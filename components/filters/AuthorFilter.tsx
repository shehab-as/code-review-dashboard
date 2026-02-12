'use client';

interface AuthorFilterProps {
  authors: string[];
  selected: string;
  onChange: (author: string) => void;
}

export default function AuthorFilter({ authors, selected, onChange }: AuthorFilterProps) {
  return (
    <div>
      <label htmlFor="author-filter" className="block text-sm font-medium text-gray-700 mb-1">
        Author
      </label>
      <select
        id="author-filter"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Authors</option>
        {authors.map(author => (
          <option key={author} value={author}>
            {author}
          </option>
        ))}
      </select>
    </div>
  );
}
