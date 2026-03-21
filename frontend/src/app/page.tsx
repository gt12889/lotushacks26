'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import PharmacyCards from '@/components/PharmacyCards';
import PriceGrid from '@/components/PriceGrid';
import SavingsBanner from '@/components/SavingsBanner';
import MegalodonAlert from '@/components/MegalodonAlert';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PharmacyResult {
  source_id: string;
  source_name: string;
  status: string;
  products: any[];
  lowest_price: number | null;
  result_count: number;
  response_time_ms: number | null;
  error: string | null;
}

interface Summary {
  query: string;
  best_price: number | null;
  best_source: string | null;
  price_range: string | null;
  potential_savings: number | null;
  total_results: number;
  variants?: string[];
}

export default function Home() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Record<string, PharmacyResult>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setResults({});
    setSummary(null);
    setCurrentQuery(query);

    try {
      const response = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(query)}`, {
        method: 'POST',
      });

      if (!response.ok || !response.body) throw new Error('Search failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const dataMatch = line.match(/^data: (.+)$/m);
          if (!dataMatch) continue;

          try {
            const event = JSON.parse(dataMatch[1]);
            if (event.task === 'summary') {
              setSummary(event);
            } else if (event.source_id) {
              setResults(prev => ({ ...prev, [event.source_id]: event }));
            }
          } catch (parseErr) {
            console.warn('Parse error:', parseErr);
          }
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const hasResults = Object.keys(results).length > 0;
  const hasMegalodon = summary && summary.potential_savings && summary.best_price && summary.potential_savings > summary.best_price;

  return (
    <div className="min-h-screen">
      {hasMegalodon && summary && (
        <MegalodonAlert
          drugName={summary.query}
          message={`Price spread of ${summary.potential_savings?.toLocaleString()} VND detected across sources`}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-t1">Price Tracker: The Abyss</h2>
          <p className="text-xs text-t3 mt-1">Surfacing deep market trajectories and molecular cost-signals.</p>
          {hasResults && (
            <div className="flex gap-3 mt-3">
              <button className="px-3 py-1.5 text-xs border border-cyan text-cyan rounded hover:bg-cyan/10 transition-colors">
                Export Intel
              </button>
              <button onClick={() => handleSearch(currentQuery)} className="px-3 py-1.5 text-xs border border-cyan text-cyan rounded hover:bg-cyan/10 transition-colors">
                Deploy New Probe
              </button>
            </div>
          )}
        </div>

        {/* Empty state */}
        {!hasResults && !isSearching && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-t1 mb-3">Compare Drug Prices Across Vietnam</h2>
            <p className="text-sm text-t3 mb-8 max-w-2xl mx-auto">
              Deploy parallel AI agents across 5+ pharmacy chains. Results in under 30 seconds.
            </p>
          </div>
        )}

        <SearchBar onSearch={handleSearch} isSearching={isSearching} />

        {(hasResults || isSearching) && (
          <div className="space-y-6">
            {currentQuery && (
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-mono text-t2">
                  Scanning: <span className="text-cyan">&ldquo;{currentQuery}&rdquo;</span>
                </h3>
                {isSearching && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan rounded-full animate-pulse" />
                    <span className="text-xs text-t3 font-mono">Agents active</span>
                  </div>
                )}
              </div>
            )}

            <PharmacyCards results={results} />

            {summary && (
              <SavingsBanner
                bestPrice={summary.best_price}
                bestSource={summary.best_source}
                priceRange={summary.price_range}
                potentialSavings={summary.potential_savings}
                totalResults={summary.total_results}
              />
            )}

            {summary?.variants && summary.variants.length > 0 && (
              <div className="bg-deep border border-cyan/20 rounded-lg p-4">
                <p className="text-xs font-mono text-cyan mb-2">Generic alternatives detected:</p>
                <div className="flex gap-2 flex-wrap">
                  {summary.variants.map((v) => (
                    <button
                      key={v}
                      onClick={() => handleSearch(v)}
                      disabled={isSearching}
                      className="px-3 py-1.5 text-xs bg-card text-cyan border border-cyan/30 rounded hover:bg-cyan/10 transition-colors disabled:opacity-50"
                    >
                      Scan &ldquo;{v}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}

            <PriceGrid results={results} bestPrice={summary?.best_price ?? null} />
          </div>
        )}

        {/* Feature cards (empty state) */}
        {!hasResults && !isSearching && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              { icon: '\u26A1', title: 'Parallel Agents', desc: '5 AI agents search pharmacy websites simultaneously in under 30 seconds.', color: 'cyan' },
              { icon: '\uD83D\uDCCA', title: 'Price Intelligence', desc: 'Track price trends, set alerts, and find savings of up to 300%.', color: 'success' },
              { icon: '\uD83D\uDC8A', title: 'Prescription Optimizer', desc: 'Optimize sourcing across pharmacies for entire prescriptions.', color: 'warn' },
            ].map((card) => (
              <div key={card.title} className="bg-deep border border-border rounded-lg p-6 hover:border-cyan/30 transition-colors">
                <div className="text-2xl mb-3">{card.icon}</div>
                <h3 className="font-bold text-t1 text-sm mb-2">{card.title}</h3>
                <p className="text-xs text-t3">{card.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
