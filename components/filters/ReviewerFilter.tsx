'use client';

interface ReviewerFilterProps {
  reviewers: string[];
  selected: string;
  onChange: (reviewer: string) => void;
}

export default function ReviewerFilter({ reviewers, selected, onChange }: ReviewerFilterProps) {
  return (
    <div>
      <label htmlFor="reviewer-filter" className="block text-sm font-medium text-gray-700 mb-1">
        Reviewer
      </label>
      <select
        id="reviewer-filter"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Reviewers</option>
        {reviewers.map(reviewer => (
          <option key={reviewer} value={reviewer}>
            {reviewer}
          </option>
        ))}
      </select>
    </div>
  );
}
