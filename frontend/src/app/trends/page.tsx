'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PricePoint {
  source_id: string;
  source_name: string;
  product_name: string;
  price: number;
  observed_at: string;
}

const TIME_RANGES = [
  { label: '24h', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

const SOURCE_COLORS: Record<string, string> = {
  long_chau: '#3b82f6',
  pharmacity: '#22c55e',
  an_khang: '#f97316',
  than_thien: '#a855f7',
  medicare: '#14b8a6',
};

export default function TrendsPage() {
  const [query, setQuery] = useState('');
  const [days, setDays] = useState(7);
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrends = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/trends/${encodeURIComponent(query)}?days=${days}`);
      const json = await res.json();
      setData(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Group data by source
  const bySource: Record<string, PricePoint[]> = {};
  for (const p of data) {
    if (!bySource[p.source_id]) bySource[p.source_id] = [];
    bySource[p.source_id].push(p);
  }

  // Find price range for chart scaling
  const allPrices = data.map((d) => d.price);
  const minPrice = Math.min(...allPrices, 0);
  const maxPrice = Math.max(...allPrices, 100);
  const range = maxPrice - minPrice || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Price Trends</h2>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Drug Name</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTrends()}
              placeholder="e.g. Metformin 500mg"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <div className="flex gap-1">
              {TIME_RANGES.map((r) => (
                <button
                  key={r.days}
                  onClick={() => setDays(r.days)}
                  className={`px-3 py-3 rounded-lg text-sm font-medium ${
                    days === r.days ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={fetchTrends}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'View Trends'}
          </button>
        </div>

        {data.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Price History: {query} ({days} days)
            </h3>

            {/* Simple CSS chart */}
            <div className="space-y-6">
              {Object.entries(bySource).map(([sourceId, points]) => (
                <div key={sourceId}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: SOURCE_COLORS[sourceId] || '#6b7280' }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {points[0]?.source_name || sourceId}
                    </span>
                    <span className="text-xs text-gray-500">({points.length} observations)</span>
                  </div>
                  <div className="flex items-end gap-1 h-24 bg-gray-50 rounded-lg p-2">
                    {points.map((p, i) => {
                      const height = ((p.price - minPrice) / range) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
                          <div
                            className="w-full rounded-t transition-all"
                            style={{
                              height: `${Math.max(height, 4)}%`,
                              backgroundColor: SOURCE_COLORS[sourceId] || '#6b7280',
                              opacity: 0.8,
                            }}
                          />
                          <div className="absolute -top-8 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                            {p.price.toLocaleString()}d — {new Date(p.observed_at).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{points.length > 0 ? new Date(points[0].observed_at).toLocaleDateString() : ''}</span>
                    <span>{points.length > 0 ? new Date(points[points.length - 1].observed_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Price summary table */}
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-semibold text-gray-600">Pharmacy</th>
                    <th className="text-left py-2 font-semibold text-gray-600">Product</th>
                    <th className="text-right py-2 font-semibold text-gray-600">Latest Price</th>
                    <th className="text-right py-2 font-semibold text-gray-600">Observations</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(bySource).map(([sourceId, points]) => {
                    const latest = points[points.length - 1];
                    return (
                      <tr key={sourceId} className="border-b border-gray-50">
                        <td className="py-2 text-gray-700">{latest?.source_name}</td>
                        <td className="py-2 text-gray-700">{latest?.product_name}</td>
                        <td className="py-2 text-right font-mono">{latest?.price.toLocaleString()} VND</td>
                        <td className="py-2 text-right text-gray-500">{points.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data.length === 0 && !loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-400">
            <p className="text-lg">Search a drug and select a time range to view price trends</p>
          </div>
        )}
      </main>
    </div>
  );
}
