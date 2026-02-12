import { Octokit } from '@octokit/rest';

export function createGitHubClient(token: string): Octokit {
  return new Octokit({
    auth: token,
    userAgent: 'Team Code Review Dashboard v1.0',
  });
}
