'use client';

import { useState, useEffect } from 'react';
import { loadConfig, saveConfig, clearConfig } from '@/lib/storage';
import { Repository, UserConfig } from '@/lib/types';

export function useGithubAuth() {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loaded = loadConfig();
    setConfig(loaded);
    setIsLoading(false);
  }, []);

  const updateConfig = (token: string, repositories: Repository[]) => {
    saveConfig(token, repositories);
    setConfig({ token, repositories });
  };

  const logout = () => {
    clearConfig();
    setConfig(null);
  };

  return {
    config,
    isAuthenticated: config !== null && config.token.length > 0,
    isLoading,
    updateConfig,
    logout,
  };
}
