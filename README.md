# My Workspace

A developer hub built with Next.js that brings GitHub PR tracking, a personal calendar, and Hacker News into a single dashboard.

![Dashboard Screenshot](docs/dash-preview.png)

## Features

- **PR Tracking** — View open PRs across repos with smart alerts (stale, no reviewers, failing CI)
- **Calendar** — Monthly grid with color-coded events, persisted in localStorage
- **Hacker News** — Browse Top/New/Best stories with auto-refresh
- **Queue** — Sortable, filterable PR table with review status indicators
- **Dashboard** — HN feed, PR metrics, queue, and upcoming events at a glance

## Tech Stack

Next.js 15 (App Router) | TypeScript | Tailwind CSS | Octokit | SWR | date-fns | Jest (62 tests)

## Getting Started

```bash
git clone <repository-url>
cd claude-box
npm install
npm run dev          # http://localhost:3000
```

Calendar and Hacker News work immediately. For PR features, configure a GitHub token in Settings:

1. Create a [Personal Access Token](https://github.com/settings/tokens/new) with `repo` scope
2. Go to Settings, paste the token, test connection
3. Add repositories as `owner/repo` and save

## Scripts

```bash
npm run dev          # Dev server
npm run build        # Production build
npm start            # Start production server
npm test             # Run 62 tests
npm run lint         # ESLint
```

## Project Structure

```
app/                          # Pages + API routes
  page.tsx                    # Landing / Dashboard
  calendar/ news/ queue/ settings/
  api/github/  (prs, stats)  # POST — Octokit with user token
  api/hn/                     # GET — HN Firebase API proxy
components/                   # Navigation, PRCard, PRList, PRTable, alerts/, filters/
hooks/                        # useGithubAuth, usePRs, useAnalytics, useHackerNews
lib/                          # Core logic
  github-api.ts               # API fetchers + shared PR enrichment helpers
  analytics.ts                # Review time, PR age, alerts, stats calculations
  hn.ts                       # HN story fetching (testable without Next.js deps)
  calendar-storage.ts         # Calendar CRUD (localStorage)
  storage.ts                  # Config CRUD (localStorage)
  types.ts                    # All TypeScript interfaces and enums
__tests__/                    # 62 tests across 4 suites
```

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/github/prs` | POST | Fetch open PRs with metrics and alerts |
| `/api/github/stats` | POST | Calculate review stats and approval trends |
| `/api/hn?type=top&limit=30` | GET | Fetch Hacker News stories (top/new/best) |

GitHub endpoints accept `{ token, repositories }` in the request body. HN endpoint is public.

## Deployment

Deploy to [Vercel](https://vercel.com) (recommended), Netlify, or any Next.js-compatible platform. No environment variables needed.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Security

- GitHub token and calendar events are stored in **browser localStorage** (client-side only)
- Suitable for personal use — for multi-user production, use server-side sessions or OAuth

## License

MIT
