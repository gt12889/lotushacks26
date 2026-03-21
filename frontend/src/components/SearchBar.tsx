'use client';

import { useState } from 'react';
import { useLocale } from '@/components/LocaleProvider';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export default function SearchBar({ onSearch, isSearching }: SearchBarProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const quickSearches = ['Metformin 500mg', 'Amoxicillin 500mg', 'Paracetamol 500mg', 'Losartan 50mg', 'Omeprazole 20mg'];

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full px-5 py-3.5 text-base bg-deep border border-border rounded-lg focus:ring-1 focus:ring-cyan focus:border-cyan text-t1 placeholder-t3 font-mono outline-none transition-colors"
            disabled={isSearching}
          />
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-t3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="px-6 py-3.5 bg-cyan text-abyss font-bold rounded-lg hover:bg-cyan/80 disabled:bg-t3/30 disabled:text-t3 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isSearching ? t('search.scanning') : t('search.deploy')}
        </button>
      </form>
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-t3">{t('search.quickScan')}</span>
        {quickSearches.map((drug) => (
          <button
            key={drug}
            onClick={() => { setQuery(drug); onSearch(drug); }}
            disabled={isSearching}
            className="px-3 py-1 text-xs bg-card text-t2 rounded border border-border hover:border-cyan/30 hover:text-cyan transition-colors disabled:opacity-50"
          >
            {drug}
          </button>
        ))}
      </div>
    </div>
  );
}
