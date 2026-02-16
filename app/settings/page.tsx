'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGithubAuth } from '@/hooks/useGithubAuth';
import { createGitHubClient } from '@/lib/github-client';
import { testConnection } from '@/lib/github-api';
import { Repository } from '@/lib/types';

export default function SettingsPage() {
  const router = useRouter();
  const { config, updateConfig, logout } = useGithubAuth();

  const [token, setToken] = useState('');
  const [repoInput, setRepoInput] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setToken(config.token);
      setRepositories(config.repositories);
    }
  }, [config]);

  const handleTestConnection = async () => {
    if (!token) {
      alert('Please enter a token');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const client = createGitHubClient(token);
      const isValid = await testConnection(client);

      if (isValid) {
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    } catch (error) {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const handleAddRepository = () => {
    if (!repoInput) return;

    const parts = repoInput.trim().split('/');
    if (parts.length !== 2) {
      alert('Please enter repository in format: owner/repo');
      return;
    }

    const [owner, name] = parts;
    const newRepo: Repository = {
      owner,
      name,
      fullName: `${owner}/${name}`,
    };

    if (repositories.some(r => r.fullName === newRepo.fullName)) {
      alert('Repository already added');
      return;
    }

    setRepositories([...repositories, newRepo]);
    setRepoInput('');
  };

  const handleRemoveRepository = (fullName: string) => {
    setRepositories(repositories.filter(r => r.fullName !== fullName));
  };

  const handleSave = () => {
    if (!token) {
      alert('Please enter a token');
      return;
    }

    if (repositories.length === 0) {
      alert('Please add at least one repository');
      return;
    }

    setSaving(true);
    updateConfig(token, repositories);
    setTimeout(() => {
      setSaving(false);
      router.push('/');
    }, 500);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
      setToken('');
      setRepositories([]);
      setTestResult(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">GitHub Authentication</h2>

        <div className="mb-4">
          <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
            Personal Access Token
          </label>
          <input
            id="token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-2 text-sm text-gray-500">
            Create a token at{' '}
            <a
              href="https://github.com/settings/tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              GitHub Settings
            </a>{' '}
            with <code className="bg-gray-100 px-1 rounded">repo</code> scope.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleTestConnection}
            disabled={testing || !token}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          {testResult === 'success' && (
            <span className="text-green-600 font-medium">✓ Connection successful</span>
          )}
          {testResult === 'error' && (
            <span className="text-red-600 font-medium">✗ Invalid token</span>
          )}
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ Your token is stored locally in your browser. Never share it with others.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Repositories</h2>

        <div className="mb-4">
          <label htmlFor="repo-input" className="block text-sm font-medium text-gray-700 mb-2">
            Add Repository
          </label>
          <div className="flex space-x-2">
            <input
              id="repo-input"
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRepository()}
              placeholder="owner/repository"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleAddRepository}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Example: facebook/react, microsoft/vscode
          </p>
        </div>

        {repositories.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Configured Repositories</h3>
            {repositories.map(repo => (
              <div
                key={repo.fullName}
                className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-md"
              >
                <span className="text-gray-900">{repo.fullName}</span>
                <button
                  onClick={() => handleRemoveRepository(repo.fullName)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No repositories configured yet.</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          {config && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
            >
              Sign Out
            </button>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !token || repositories.length === 0}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
}
