import { saveConfig, loadConfig, clearConfig, isConfigured } from '@/lib/storage';

// Mock localStorage
const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
    },
    writable: true,
  });
});

const testRepo = { owner: 'acme', name: 'app', fullName: 'acme/app' };

describe('saveConfig / loadConfig', () => {
  it('round-trips config through localStorage', () => {
    saveConfig('ghp_test123', [testRepo]);
    const loaded = loadConfig();
    expect(loaded).not.toBeNull();
    expect(loaded!.token).toBe('ghp_test123');
    expect(loaded!.repositories).toHaveLength(1);
    expect(loaded!.repositories[0].fullName).toBe('acme/app');
  });

  it('returns null when nothing is stored', () => {
    expect(loadConfig()).toBeNull();
  });

  it('returns null for corrupted data', () => {
    store['github_dashboard_config'] = 'not-json{{{';
    expect(loadConfig()).toBeNull();
  });
});

describe('clearConfig', () => {
  it('removes stored config', () => {
    saveConfig('ghp_test123', [testRepo]);
    expect(loadConfig()).not.toBeNull();
    clearConfig();
    expect(loadConfig()).toBeNull();
  });
});

describe('isConfigured', () => {
  it('returns false when nothing is stored', () => {
    expect(isConfigured()).toBe(false);
  });

  it('returns false with empty token', () => {
    saveConfig('', [testRepo]);
    expect(isConfigured()).toBe(false);
  });

  it('returns false with no repositories', () => {
    saveConfig('ghp_test123', []);
    expect(isConfigured()).toBe(false);
  });

  it('returns true with valid config', () => {
    saveConfig('ghp_test123', [testRepo]);
    expect(isConfigured()).toBe(true);
  });
});
