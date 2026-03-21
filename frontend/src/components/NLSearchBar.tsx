'use client';

import { useState } from 'react';

interface NLSearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

const EXAMPLE_QUERIES = [
  'I need diabetes and blood pressure meds for a clinic, generic preferred',
  'Antibiotics and pain relief for a rural pharmacy',
  'Common cardiovascular drugs, cheapest options',
];

export default function NLSearchBar({ onSearch, loading }: NLSearchBarProps) {
  const [query, setQuery] = useState('');

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">
          Describe what you need
        </label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (query.trim()) onSearch(query.trim());
            }
          }}
          placeholder="e.g. I need diabetes and blood pressure medications for a clinic, generic preferred..."
          rows={2}
          className="w-full px-4 py-3 bg-deep border border-border rounded-lg text-t1 font-mono text-sm placeholder-t3 focus:ring-1 focus:ring-cyan focus:border-cyan outline-none resize-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => query.trim() && onSearch(query.trim())}
          disabled={loading || !query.trim()}
          className="px-6 py-2.5 bg-cyan text-abyss font-bold rounded-lg hover:bg-cyan/80 disabled:bg-t3/30 disabled:text-t3 transition-colors text-sm"
        >
          {loading ? 'Analyzing...' : 'AI Search'}
        </button>
        <span className="text-[10px] text-t3 font-mono">POWERED BY OPENROUTER</span>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-[10px] uppercase tracking-wider text-t3 font-mono">Try:</span>
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => { setQuery(q); onSearch(q); }}
            disabled={loading}
            className="px-3 py-1 text-xs bg-card text-t2 rounded border border-border hover:border-cyan/30 hover:text-cyan transition-colors disabled:opacity-50 text-left"
          >
            {q.length > 50 ? q.slice(0, 50) + '...' : q}
          </button>
        ))}
      </div>
    </div>
  );
}
