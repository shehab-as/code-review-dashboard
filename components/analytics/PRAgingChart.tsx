'use client';

import { ReviewStats } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PRAgingChartProps {
  stats: ReviewStats;
}

export default function PRAgingChart({ stats }: PRAgingChartProps) {
  const dist = stats.prAgingDistribution ?? {};
  const data = [
    {
      name: '< 1 day',
      count: dist.lessThanOneDay ?? 0,
      color: '#10B981', // green
    },
    {
      name: '1-3 days',
      count: dist.oneToThreeDays ?? 0,
      color: '#F59E0B', // amber
    },
    {
      name: '3-7 days',
      count: dist.threeToSevenDays ?? 0,
      color: '#F97316', // orange
    },
    {
      name: '> 7 days',
      count: dist.moreThanSevenDays ?? 0,
      color: '#EF4444', // red
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">PR Age Distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
