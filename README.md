# Team Code Review Dashboard

A full-stack web application to help engineering teams track GitHub PRs, review times, and identify bottlenecks in the code review process.

![Dashboard Screenshot](docs/dashboard-preview.png)

## Features

### 📊 Analytics
- **Average Review Time**: Track time from PR creation to first review, broken down by repository
- **PR Aging Distribution**: Visualize how long PRs have been open with color-coded severity
- **Review Load**: See how many PRs each team member is assigned to review
- **Approval Trends**: Track approval times over the past 30 days

### 🔔 Smart Alerts
Automatically identify problematic PRs:
- **Stale PRs**: Open for more than 3 days
- **No Reviewers**: PRs without assigned reviewers
- **Failing CI**: PRs with failing CI/CD checks
- **Changes Requested**: PRs with unaddressed change requests

### 📋 Queue Management
- View all open PRs in a sortable, filterable table
- Filter by repository, author, or reviewer
- Sort by age, author, repository, title, or comment count
- Click any PR to open it in GitHub

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **GitHub API**: Octokit REST client
- **Data Fetching**: SWR for caching and revalidation
- **Charts**: Recharts
- **Date Utilities**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A GitHub account
- GitHub Personal Access Token

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd claude-box
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### GitHub Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens/new)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Code Review Dashboard")
4. Select the following scope:
   - ✅ **repo** (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't be able to see it again)

### Configuration

1. Navigate to the **Settings** page
2. Paste your GitHub Personal Access Token
3. Click "Test Connection" to verify the token works
4. Add repositories in the format `owner/repository` (e.g., `facebook/react`, `microsoft/vscode`)
5. Click "Save & Continue"

## Usage

### Dashboard

The main dashboard displays:
- Total open PRs across all configured repositories
- Alert summary with count by type
- Analytics charts showing review metrics
- Top 5 oldest PRs requiring attention

### Queue Page

The queue page provides a comprehensive view of all open PRs with:
- Sortable columns (age, author, repository, title, comments)
- Filters for repository, author, and reviewer
- Visual indicators for review status and alerts
- Click any row to open the PR in GitHub

### Settings

Manage your configuration:
- Update your GitHub token
- Add or remove repositories
- Test connection to verify authentication
- Sign out to clear stored credentials

## Security Considerations

⚠️ **Important Security Notes**:

- Your GitHub token is stored in **browser localStorage**
- This is suitable for personal use or demo purposes
- For production use with multiple users, consider:
  - Server-side session storage
  - Encrypted httpOnly cookies
  - OAuth flow with GitHub App

### Token Permissions

Only grant the minimum required permissions:
- **repo** scope (read-only access to repositories)
- Create a dedicated token for this application
- Regularly rotate your tokens

## Project Structure

```
claude-box/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   └── github/           # GitHub API endpoints
│   ├── dashboard/            # Dashboard page
│   ├── queue/                # Queue page
│   ├── settings/             # Settings page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── analytics/            # Analytics charts
│   ├── alerts/               # Alert components
│   ├── filters/              # Filter components
│   ├── Navigation.tsx
│   ├── PRCard.tsx
│   ├── PRList.tsx
│   └── PRTable.tsx
├── hooks/                    # Custom React hooks
│   ├── useGithubAuth.ts
│   ├── usePRs.ts
│   └── useAnalytics.ts
├── lib/                      # Core library
│   ├── analytics.ts          # Analytics calculations
│   ├── github-api.ts         # GitHub API wrappers
│   ├── github-client.ts      # Octokit client setup
│   ├── storage.ts            # LocalStorage helpers
│   └── types.ts              # TypeScript types
└── public/                   # Static assets
```

## Development

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to a GitHub repository
2. Import the project in [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and deploy
4. No environment variables needed (client-side storage)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Deploy to Other Platforms

This app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Cloudflare Pages
- Railway
- Render

## API Reference

### POST /api/github/prs

Fetch all open PRs with enriched metrics.

**Request Body:**
```json
{
  "token": "ghp_xxxxx",
  "repositories": [
    { "owner": "facebook", "name": "react", "fullName": "facebook/react" }
  ]
}
```

**Response:**
```json
{
  "prs": [
    {
      "id": 123,
      "number": 456,
      "title": "Fix bug in component",
      "ageInDays": 2,
      "reviewStatus": "pending",
      "alerts": ["stale"],
      // ... additional PR data
    }
  ]
}
```

### POST /api/github/stats

Calculate analytics and statistics.

**Response:**
```json
{
  "stats": {
    "averageReviewTimeHours": 24.5,
    "totalOpenPRs": 42,
    "totalAlerts": 8,
    // ... additional stats
  }
}
```

## Troubleshooting

### Token Issues

**Problem**: "Invalid token" error
- Verify you copied the entire token
- Ensure the token has `repo` scope
- Check if the token has expired

### API Rate Limits

**Problem**: Getting rate limit errors
- GitHub allows 5,000 requests/hour for authenticated users
- SWR caching reduces requests significantly
- Refresh intervals: PRs (60s), Stats (120s)

### No PRs Showing

**Problem**: Dashboard shows 0 PRs
- Verify repositories are spelled correctly (`owner/repo`)
- Check that repositories have open pull requests
- Ensure your token has access to the repositories

### Performance Issues

**Problem**: Slow loading times
- Reduce number of configured repositories
- Consider repositories with fewer PRs
- Close browser tabs to free memory

## Future Enhancements

- [ ] Database integration for historical trend analysis
- [ ] Multi-user team management
- [ ] Customizable alert thresholds
- [ ] Browser push notifications
- [ ] Slack/Discord integration
- [ ] Email notifications
- [ ] PR review templates and checklists
- [ ] JIRA/Linear ticket integration
- [ ] Merge conflict detection
- [ ] Code review quality metrics
- [ ] Export to CSV/PDF
- [ ] Dark mode
- [ ] Saved filter presets
- [ ] Shareable filtered views via URL params

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Octokit](https://github.com/octokit/rest.js) - GitHub REST API client
- [SWR](https://swr.vercel.app/) - Data fetching library
- [Recharts](https://recharts.org/) - Charting library
- [date-fns](https://date-fns.org/) - Date utility library

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section

---

**Built with ❤️ for better code reviews**
