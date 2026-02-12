'use client';

import { useState } from 'react';
import { PRWithMetrics, SortField, SortDirection } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import AlertBadge from './alerts/AlertBadge';

interface PRTableProps {
  prs: PRWithMetrics[];
}

export default function PRTable({ prs }: PRTableProps) {
  const [sortField, setSortField] = useState<SortField>('age');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedPRs = [...prs].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'age':
        aValue = a.ageInDays;
        bValue = b.ageInDays;
        break;
      case 'author':
        aValue = a.user.login;
        bValue = b.user.login;
        break;
      case 'repository':
        aValue = a.repository;
        bValue = b.repository;
        break;
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'comments':
        aValue = a.comments;
        bValue = b.comments;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>;
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  if (prs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No pull requests found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('title')}
            >
              Title <SortIcon field="title" />
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('author')}
            >
              Author <SortIcon field="author" />
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('repository')}
            >
              Repository <SortIcon field="repository" />
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('age')}
            >
              Age <SortIcon field="age" />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Reviewers
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('comments')}
            >
              Comments <SortIcon field="comments" />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Alerts
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedPRs.map(pr => (
            <tr
              key={pr.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => window.open(pr.html_url, '_blank')}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{pr.title}</div>
                <div className="text-sm text-gray-500">#{pr.number}</div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center space-x-2">
                  <img
                    src={pr.user.avatar_url}
                    alt={pr.user.login}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-gray-900">{pr.user.login}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">{pr.repository}</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {formatDistanceToNow(new Date(pr.created_at), { addSuffix: true })}
              </td>
              <td className="px-4 py-3">
                {pr.requested_reviewers.length > 0 ? (
                  <div className="flex -space-x-1">
                    {pr.requested_reviewers.slice(0, 3).map(reviewer => (
                      <img
                        key={reviewer.login}
                        src={reviewer.avatar_url}
                        alt={reviewer.login}
                        className="w-6 h-6 rounded-full border-2 border-white"
                        title={reviewer.login}
                      />
                    ))}
                    {pr.requested_reviewers.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                        +{pr.requested_reviewers.length - 3}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">None</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">{pr.comments || 0}</td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    pr.reviewStatus === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : pr.reviewStatus === 'changes_requested'
                      ? 'bg-red-100 text-red-800'
                      : pr.reviewStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {pr.reviewStatus.replace('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex space-x-1">
                  {pr.alerts.map((alert, idx) => (
                    <AlertBadge key={idx} type={alert} />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
