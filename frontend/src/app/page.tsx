'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import PharmacyCards from '@/components/PharmacyCards';
import PriceGrid from '@/components/PriceGrid';
import SavingsBanner from '@/components/SavingsBanner';

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
              setResults(prev => ({
                ...prev,
                [event.source_id]: event,
              }));
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero + Search */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {!hasResults && !isSearching && (
          <div className="text-center py-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              Compare Drug Prices Across Vietnam
            </h2>
            <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
              Search any medication and instantly compare prices across 5+ pharmacy chains.
              Powered by parallel AI web agents.
            </p>
          </div>
        )}

        <SearchBar onSearch={handleSearch} isSearching={isSearching} />

        {(hasResults || isSearching) && (
          <>
            {currentQuery && (
              <h3 className="text-lg font-semibold text-gray-700">
                Results for &ldquo;{currentQuery}&rdquo;
              </h3>
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

            <PriceGrid results={results} bestPrice={summary?.best_price ?? null} />
          </>
        )}

        {!hasResults && !isSearching && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Parallel Agents</h3>
              <p className="text-sm text-gray-600">5 AI agents search pharmacy websites simultaneously in under 30 seconds.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Price Intelligence</h3>
              <p className="text-sm text-gray-600">Track price trends, set alerts, and find savings of up to 300%.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Prescription Optimizer</h3>
              <p className="text-sm text-gray-600">Optimize sourcing across pharmacies for entire prescriptions.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
