'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PricingChart from '@/components/PricingChart';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PricePoint {
  source_id: string;
  source_name: string;
  product_name: string;
  price: number;
  observed_at: string;
}

const TIME_RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

function TrendsContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [days, setDays] = useState(7);
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q')?.trim();
    if (!q) return;
    setQuery(q);
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(`${API_URL}/api/trends/${encodeURIComponent(q)}?days=7`);
        const json = await res.json();
        if (!cancelled) setData(json.data || []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

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

  const bySource: Record<string, PricePoint[]> = {};
  for (const p of data) {
    if (!bySource[p.source_id]) bySource[p.source_id] = [];
    bySource[p.source_id].push(p);
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-t1">Depth Analysis</h2>
          <p className="text-xs text-t3 mt-1">Molecular price trajectory over time</p>
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">Drug Name</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTrends()}
              placeholder="Scan molecular signals..."
              className="w-full px-4 py-3 bg-deep border border-border rounded-lg text-t1 font-mono placeholder-t3 focus:ring-1 focus:ring-cyan focus:border-cyan outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">Time Range</label>
            <div className="flex gap-1">
              {TIME_RANGES.map((r) => (
                <button
                  key={r.days}
                  onClick={() => setDays(r.days)}
                  className={`px-4 py-3 rounded-lg text-xs font-mono font-bold transition-colors ${
                    days === r.days ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'bg-card text-t2 border border-border hover:border-cyan/30'
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
            className="px-6 py-3 bg-cyan text-abyss font-bold rounded-lg hover:bg-cyan/80 disabled:bg-t3/30 disabled:text-t3 transition-colors"
          >
            {loading ? 'Scanning...' : 'Analyze'}
          </button>
        </div>

        {data.length > 0 && (
          <>
            <PricingChart data={data} />

            <div className="bg-deep border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-3 border-b border-border">
                <h3 className="text-xs font-bold text-t1 uppercase tracking-wider">Price Summary — {query} ({days} days)</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Pharmacy</th>
                    <th className="text-left py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Product</th>
                    <th className="text-right py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Latest Price</th>
                    <th className="text-right py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Observations</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(bySource).map(([sourceId, points]) => {
                    const latest = points[points.length - 1];
                    return (
                      <tr key={sourceId} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                        <td className="py-2.5 px-6 text-t1 text-xs">{latest?.source_name}</td>
                        <td className="py-2.5 px-6 text-t2 text-xs">{latest?.product_name}</td>
                        <td className="py-2.5 px-6 text-right font-mono text-t1">{latest?.price.toLocaleString()} VND</td>
                        <td className="py-2.5 px-6 text-right text-t3 font-mono">{points.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {data.length === 0 && !loading && (
          <div className="bg-deep border border-border rounded-lg p-16 text-center">
            <p className="text-sm text-t3">Search a drug and select a time range to view price trajectories</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrendsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-t3 text-sm font-mono">Loading trends…</div>
      }
    >
      <TrendsContent />
    </Suspense>
  );
}
