import { UserConfig, Repository } from './types';

const CONFIG_KEY = 'github_dashboard_config';

export function saveConfig(token: string, repositories: Repository[]): void {
  if (typeof window === 'undefined') return;

  const config: UserConfig = {
    token,
    repositories,
  };

  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function loadConfig(): UserConfig | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(CONFIG_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as UserConfig;
  } catch {
    return null;
  }
}

export function clearConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CONFIG_KEY);
}

export function isConfigured(): boolean {
  const config = loadConfig();
  return config !== null && config.token.length > 0 && config.repositories.length > 0;
}
