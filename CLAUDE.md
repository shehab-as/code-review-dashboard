# CLAUDE.md — My Workspace

## What This Is

A Next.js developer hub that combines GitHub PR tracking, a personal calendar, and a Hacker News feed into a single dashboard. Users authenticate with a GitHub Personal Access Token stored in browser localStorage. Calendar events also persist in localStorage. No database — all config and data is client-side.

## Tech Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** for styling (custom `alert` + `hn` colors in `tailwind.config.ts`)
- **Octokit** (`@octokit/rest`) for GitHub API
- **SWR** for client-side data fetching with caching
- **date-fns** for date math and calendar grid
- **Jest** + **Testing Library** for unit tests

## Architecture

```
Browser (client)
  └─ SWR hooks (usePRs, useAnalytics, useHackerNews) call Next.js API routes
       ├─ API routes (app/api/github/*) use Octokit with user's token → GitHub REST API
       └─ API route  (app/api/hn)       proxies HN Firebase API (public, no auth)
  └─ Calendar events stored in localStorage via lib/calendar-storage.ts
```

- **Auth flow**: Token + repos saved to localStorage via `lib/storage.ts`. Hooks read config on mount. Token is passed in POST body to API routes — never stored server-side.
- **Calendar storage**: Events saved to localStorage under `calendar_events` key via `lib/calendar-storage.ts`. No server-side persistence.
- **SWR keys**: Prefixed with `'prs'` / `'stats'` / `'hn'` to avoid cache collisions between hooks.
- **API routes**: GitHub routes accept POST (token in body). HN route accepts GET (public API, no auth needed).
- **PR enrichment**: Shared helpers `enrichOpenPRsForRepos()` and `enrichClosedPRsForRepos()` in `lib/github-api.ts` — used by both `prs/route.ts` and `stats/route.ts`. Do NOT duplicate enrichment logic in routes.
- **Stats fields can be undefined** from the API — always guard with `?? {}` / `?? []` / `?? 0`.

## Folder Structure

```
app/
  page.tsx              # Landing (unauth) or Dashboard (auth) — single entry point
  queue/page.tsx        # PR table with filters and sorting
  calendar/page.tsx     # Monthly calendar grid with event CRUD
  news/page.tsx         # Hacker News feed with Top/New/Best tabs
  settings/page.tsx     # Token + repo configuration
  layout.tsx            # Root layout, Navigation, global CSS
  api/github/
    prs/route.ts        # POST — thin wrapper around enrichOpenPRsForRepos()
    stats/route.ts      # POST — uses enrichOpenPRsForRepos() + enrichClosedPRsForRepos() → calculateStats
  api/hn/
    route.ts            # GET — thin wrapper around lib/hn.ts fetchStories()

components/
  Navigation.tsx        # Top nav bar with gradient, logo, connection indicator
  PRCard.tsx            # Card view of a single PR
  PRList.tsx            # List of PRCards (used on dashboard, limited to N)
  PRTable.tsx           # Sortable table (used on queue page)
  alerts/
    AlertBadge.tsx      # Colored badge for alert type
  filters/
    RepositoryFilter.tsx, AuthorFilter.tsx, ReviewerFilter.tsx  # Dropdown filters

hooks/
  useGithubAuth.ts      # Reads/writes localStorage config
  usePRs.ts             # SWR hook → POST /api/github/prs (refresh: 60s)
  useAnalytics.ts       # SWR hook → POST /api/github/stats (refresh: 120s)
  useHackerNews.ts      # SWR hook → GET /api/hn (refresh: 5min)

lib/
  types.ts              # GitHubPR, PRWithMetrics, ReviewStats, AlertType enum, SortField, SortDirection
  github-client.ts      # Creates Octokit instance from token
  github-api.ts         # Low-level fetchers + enrichOpenPRsForRepos, enrichClosedPRsForRepos
  analytics.ts          # calculateTimeInReview, calculatePRAge, determineReviewStatus, identifyAlerts, calculateStats
  storage.ts            # saveConfig, loadConfig, clearConfig, isConfigured
  calendar-storage.ts   # loadEvents, saveEvents, addEvent, removeEvent (localStorage)
  hn.ts                 # fetchStoryIds, fetchItem, fetchStories (HN Firebase API)

__tests__/
  helpers.ts                # Test fixture factories (makePR, makeReview, makeCheck)
  analytics.test.ts         # Unit tests for lib/analytics.ts (25 tests)
  storage.test.ts           # Unit tests for lib/storage.ts (10 tests)
  calendar-storage.test.ts  # Unit tests for lib/calendar-storage.ts (13 tests)
  hn-api.test.ts            # Unit tests for lib/hn.ts (14 tests)
```

## Build & Run

```bash
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint
npm test             # Run all tests (62 tests)
npm run test:watch   # Run tests in watch mode
```

No environment variables required. All config is entered in the Settings UI.

## Key Patterns

- All page components are `'use client'` — no RSC data fetching.
- The `PRWithMetrics` type extends `GitHubPR` with calculated fields (`ageInDays`, `reviewStatus`, `alerts`, etc.). Enrichment happens server-side in `lib/github-api.ts` shared helpers.
- Alert thresholds: Stale = >3 days, Failing CI = any check with `conclusion === 'failure'`, No Reviewers = `requested_reviewers.length === 0`.
- Dashboard layout: Top row = HN feed (left) + Metrics (right). Bottom row = PR Queue (left) + Upcoming Events (right).
- Calendar events support title, date, optional time, and color. Stored as JSON array in localStorage.
- HN core logic lives in `lib/hn.ts` (testable without Next.js server deps). The API route in `app/api/hn/route.ts` is a thin wrapper.
- API routes are thin wrappers — business logic belongs in `lib/`. This keeps routes testable and avoids duplication.
- Types are imported from `lib/types.ts` and `lib/hn.ts`. Do not re-declare types locally in pages or hooks.
- Hooks use proper `Repository[]` typing (not `any[]`). Keep it that way.

## Testing

Tests use Jest with `next/jest` config. Test files live in `__tests__/`. Shared fixtures in `__tests__/helpers.ts`.

- `analytics.test.ts` — covers `calculateTimeInReview`, `calculatePRAge`, `determineReviewStatus`, `identifyAlerts`, `calculateReviewLoad`, `calculateStats`
- `storage.test.ts` — covers `saveConfig`, `loadConfig`, `clearConfig`, `isConfigured` with mocked localStorage
- `calendar-storage.test.ts` — covers `loadEvents`, `saveEvents`, `addEvent`, `removeEvent` with mocked localStorage
- `hn-api.test.ts` — covers `fetchStoryIds`, `fetchItem`, `fetchStories` with mocked global fetch

**Testing guidelines**: Test pure functions in `lib/` directly. For API routes that depend on Next.js server globals (`NextRequest`), extract logic into `lib/` and test the extracted function instead (see `lib/hn.ts` as the pattern). Use `error: unknown` with `instanceof Error` guards in catch blocks.

## Common Pitfalls

- SWR keys must be unique per hook — `usePRs` (`'prs'`), `useAnalytics` (`'stats'`), `useHackerNews` (`'hn'`).
- Stats API response fields can be `undefined` — always guard with `??` before calling `Object.entries()` or accessing nested properties.
- The `comments` field on `GitHubPR` is optional — use `?? 0` when sorting or displaying.
- GitHub rate limit: 5,000 req/hr authenticated. SWR caching helps, but many repos with many PRs can hit limits.
- HN API is public and unauthenticated. The `fetchStories` function caps at 50 items per request.
- Calendar and GitHub config both use localStorage — clearing site data loses both.
- Do NOT duplicate PR enrichment logic in API routes — use the shared helpers in `lib/github-api.ts`.
- Do NOT add `any` types — use proper types from `lib/types.ts`. The codebase has been cleaned of all `any` usage.
