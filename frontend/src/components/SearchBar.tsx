'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export default function SearchBar({ onSearch, isSearching }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const quickSearches = ['Metformin 500mg', 'Amoxicillin 500mg', 'Paracetamol 500mg', 'Losartan 50mg', 'Omeprazole 20mg'];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter drug name, e.g., Metformin 500mg"
            className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            disabled={isSearching}
          />
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg whitespace-nowrap"
        >
          {isSearching ? 'Searching...' : 'Search All'}
        </button>
      </form>
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm text-gray-500">Quick:</span>
        {quickSearches.map((drug) => (
          <button
            key={drug}
            onClick={() => { setQuery(drug); onSearch(drug); }}
            disabled={isSearching}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors disabled:opacity-50"
          >
            {drug}
          </button>
        ))}
      </div>
    </div>
  );
}
