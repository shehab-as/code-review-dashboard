# CLAUDE.md — My Code Reviews

## What This Is

A Next.js dashboard that fetches live GitHub data via Octokit and displays PR metrics, alerts, and analytics. Users authenticate with a GitHub Personal Access Token stored in browser localStorage. No database — all config is client-side.

## Tech Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** for styling (custom `alert` colors in `tailwind.config.ts`)
- **Octokit** (`@octokit/rest`) for GitHub API
- **SWR** for client-side data fetching with caching
- **Recharts** for charts, **date-fns** for date math
- **Jest** + **Testing Library** for unit tests

## Architecture

```
Browser (client)
  └─ SWR hooks (usePRs, useAnalytics) call Next.js API routes
       └─ API routes (app/api/github/*) use Octokit with user's token
            └─ GitHub REST API
```

- **Auth flow**: Token + repos saved to localStorage via `lib/storage.ts`. Hooks read config on mount. Token is passed in POST body to API routes — never stored server-side.
- **SWR keys**: Prefixed with `'prs'` / `'stats'` to avoid cache collisions between hooks.
- **API routes accept POST** (not GET) because token and repo list are sent in the request body.
- **Stats fields can be undefined** from the API — all analytics components use `?? {}` / `?? []` / `?? 0` guards.

## Folder Structure

```
app/
  page.tsx              # Landing (unauth) or Dashboard (auth) — single entry point
  queue/page.tsx        # PR table with filters and sorting
  settings/page.tsx     # Token + repo configuration
  layout.tsx            # Root layout, Navigation, global CSS
  api/github/
    prs/route.ts        # POST — fetches open PRs with reviews + checks, returns PRWithMetrics[]
    reviews/route.ts    # POST — fetches reviews for a single PR
    stats/route.ts      # POST — calculates ReviewStats (includes closed PRs for trends)

components/
  Navigation.tsx        # Top nav bar with gradient, logo, connection indicator
  PRCard.tsx            # Card view of a single PR
  PRList.tsx            # List of PRCards (used on dashboard, limited to N)
  PRTable.tsx           # Sortable table (used on queue page)
  alerts/
    AlertBadge.tsx      # Colored badge for alert type
  analytics/
    AverageReviewTime.tsx  # Stat card with per-repo breakdown
    PRAgingChart.tsx       # Bar chart: <1d, 1-3d, 3-7d, >7d
  filters/
    RepositoryFilter.tsx, AuthorFilter.tsx, ReviewerFilter.tsx  # Dropdown filters

hooks/
  useGithubAuth.ts      # Reads/writes localStorage config
  usePRs.ts             # SWR hook → POST /api/github/prs (refresh: 60s)
  useAnalytics.ts       # SWR hook → POST /api/github/stats (refresh: 120s)

lib/
  types.ts              # GitHubPR, PRWithMetrics, ReviewStats, AlertType enum, etc.
  github-client.ts      # Creates Octokit instance from token
  github-api.ts         # fetchPRsForRepo, fetchReviewsForPR, fetchPRChecks, fetchClosedPRs, testConnection
  analytics.ts          # calculateTimeInReview, calculatePRAge, determineReviewStatus, identifyAlerts, calculateStats
  storage.ts            # saveConfig, loadConfig, clearConfig, isConfigured

__tests__/
  helpers.ts            # Test fixture factories (makePR, makeReview, makeCheck)
  analytics.test.ts     # Unit tests for lib/analytics.ts (25 tests)
  storage.test.ts       # Unit tests for lib/storage.ts (10 tests)
```

## Build & Run

```bash
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint
npm test             # Run all tests (35 tests)
npm run test:watch   # Run tests in watch mode
```

No environment variables required. All config is entered in the Settings UI.

## Key Patterns

- All page components are `'use client'` — no RSC data fetching.
- The `PRWithMetrics` type extends `GitHubPR` with calculated fields (`ageInDays`, `reviewStatus`, `alerts`, etc.). Enrichment happens server-side in API routes.
- Alert thresholds: Stale = >3 days, Failing CI = any check with `conclusion === 'failure'`, No Reviewers = `requested_reviewers.length === 0`.
- The dashboard metrics row is a 6-column grid: Open PRs, Repositories, Total Alerts, Stale, No Reviewers, Failing CI. Alert cards highlight with colored backgrounds when counts > 0.

## Testing

Tests use Jest with `next/jest` config. Test files live in `__tests__/`. Shared fixtures in `__tests__/helpers.ts`.

- `analytics.test.ts` — covers `calculateTimeInReview`, `calculatePRAge`, `determineReviewStatus`, `identifyAlerts`, `calculateReviewLoad`, `calculateStats`
- `storage.test.ts` — covers `saveConfig`, `loadConfig`, `clearConfig`, `isConfigured` with mocked localStorage

## Common Pitfalls

- SWR keys must be unique per hook — both `usePRs` and `useAnalytics` prefix their keys (`'prs'`/`'stats'`).
- Stats API response fields can be `undefined` — always guard with `??` before calling `Object.entries()` or accessing nested properties.
- The `comments` field on `GitHubPR` is optional (not present in Octokit's pulls.list response).
- GitHub rate limit: 5,000 req/hr authenticated. SWR caching helps, but many repos with many PRs can hit limits.
