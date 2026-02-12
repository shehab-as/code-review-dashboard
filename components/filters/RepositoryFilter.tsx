'use client';

interface RepositoryFilterProps {
  repositories: string[];
  selected: string;
  onChange: (repo: string) => void;
}

export default function RepositoryFilter({ repositories, selected, onChange }: RepositoryFilterProps) {
  return (
    <div>
      <label htmlFor="repo-filter" className="block text-sm font-medium text-gray-700 mb-1">
        Repository
      </label>
      <select
        id="repo-filter"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Repositories</option>
        {repositories.map(repo => (
          <option key={repo} value={repo}>
            {repo}
          </option>
        ))}
      </select>
    </div>
  );
}
