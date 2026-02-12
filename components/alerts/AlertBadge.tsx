'use client';

import { AlertType } from '@/lib/types';

interface AlertBadgeProps {
  type: AlertType;
  count?: number;
}

export default function AlertBadge({ type, count }: AlertBadgeProps) {
  const config = {
    [AlertType.STALE]: {
      label: 'Stale',
      color: 'bg-alert-stale',
      textColor: 'text-white',
    },
    [AlertType.NO_REVIEWERS]: {
      label: 'No Reviewers',
      color: 'bg-alert-critical',
      textColor: 'text-white',
    },
    [AlertType.FAILING_CI]: {
      label: 'Failing CI',
      color: 'bg-alert-critical',
      textColor: 'text-white',
    },
    [AlertType.CHANGES_REQUESTED]: {
      label: 'Changes Requested',
      color: 'bg-alert-warning',
      textColor: 'text-white',
    },
  };

  const { label, color, textColor } = config[type];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${color} ${textColor}`}>
      {label}
      {count !== undefined && count > 1 && ` (${count})`}
    </span>
  );
}
