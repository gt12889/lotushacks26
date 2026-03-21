'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bot, BarChart3 } from 'lucide-react';
import PricingChart from '@/components/PricingChart';
import NLSearchBar from '@/components/NLSearchBar';
import ComparisonMatrix from '@/components/ComparisonMatrix';
import { ApiErrorBanner } from '@/components/ApiErrorBanner';
import { LoadingPanel } from '@/components/ui/loading-spinner';
import { useLocale } from '@/components/LocaleProvider';

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

const QUICK_SUGGESTIONS = [
  'Metformin 500mg',
  'Amoxicillin 500mg',
  'Paracetamol 500mg',
  'Losartan 50mg',
  'Omeprazole 20mg',
];

function TrendsContent() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [days, setDays] = useState(7);
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // AI Multi-Search state
  const [mode, setMode] = useState<'single' | 'ai'>('single');
  const [nlLoading, setNlLoading] = useState(false);
  const [nlDrugs, setNlDrugs] = useState<string[]>([]);
  const [nlResults, setNlResults] = useState<Record<string, any>>({});
  const [nlMatrix, setNlMatrix] = useState<any>(null);
  const [nlRecommendation, setNlRecommendation] = useState('');
  const [nlError, setNlError] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get('q')?.trim();
    if (!q) return;
    setQuery(q);
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    void (async () => {
      try {
        const res = await fetch(`${API_URL}/api/trends/${encodeURIComponent(q)}?days=7`);
        if (!res.ok) {
          if (!cancelled) {
            setData([]);
            setFetchError(t('error.server', { status: res.status }));
          }
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setData(json.data || []);
          setFetchError(null);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setData([]);
          setFetchError(t('error.trends'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, t]);

  const fetchTrends = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_URL}/api/trends/${encodeURIComponent(q)}?days=${days}`);
      if (!res.ok) {
        setData([]);
        setFetchError(t('error.server', { status: res.status }));
        return;
      }
      const json = await res.json();
      setData(json.data || []);
      setFetchError(null);
    } catch (e) {
      console.error(e);
      setData([]);
      setFetchError(t('error.trends'));
    } finally {
      setLoading(false);
    }
  };

  const handleNLSearch = async (nlQuery: string) => {
    setNlLoading(true);
    setNlError(null);
    setNlDrugs([]);
    setNlResults({});
    setNlMatrix(null);
    setNlRecommendation('');

    try {
      const res = await fetch(`${API_URL}/api/nl-search?query=${encodeURIComponent(nlQuery)}`, { method: 'POST' });
      if (!res.ok) {
        setNlError(t('error.server', { status: res.status }));
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) {
        setNlError(t('error.nlSearch'));
        return;
      }
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'nl_parsed') {
              setNlDrugs(event.drugs || []);
            } else if (event.type === 'drug_search_complete') {
              setNlResults(prev => ({ ...prev, [event.drug]: event }));
            } else if (event.type === 'nl_complete') {
              setNlResults(event.results || {});
              setNlMatrix(event.matrix || null);
              setNlRecommendation(event.recommendation || '');
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (e) {
      console.error(e);
      setNlError(e instanceof TypeError ? t('error.network') : t('error.nlSearch'));
    } finally {
      setNlLoading(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-t1">Depth Analysis</h2>
            <p className="text-xs text-t3 mt-1">Molecular price trajectory over time</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('single')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${mode === 'single' ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'bg-card text-t2 border border-border hover:border-cyan/30'}`}
            >
              Single Drug
            </button>
            <button
              onClick={() => setMode('ai')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${mode === 'ai' ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'bg-card text-t2 border border-border hover:border-cyan/30'}`}
            >
              AI Multi-Search
            </button>
          </div>
        </div>

        {mode === 'ai' ? (
          <>
            <NLSearchBar onSearch={handleNLSearch} loading={nlLoading} />
            {nlError && (
              <ApiErrorBanner message={nlError} onDismiss={() => setNlError(null)} />
            )}

            {nlDrugs.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider text-t3 font-mono">Searching:</span>
                {nlDrugs.map(d => (
                  <span key={d} className="px-3 py-1 text-xs bg-cyan/10 text-cyan rounded border border-cyan/30 font-mono">{d}</span>
                ))}
              </div>
            )}

            {nlLoading && !nlMatrix && (
              <LoadingPanel message={t('trends.nlWorking')} />
            )}

            {nlMatrix && (
              <ComparisonMatrix
                drugs={nlDrugs}
                results={nlResults}
                matrix={nlMatrix}
                recommendation={nlRecommendation}
              />
            )}

            {!nlLoading && !nlMatrix && nlDrugs.length === 0 && (
              <div className="bg-deep border border-border rounded-lg p-16 text-center space-y-4">
                <Bot size={32} className="text-cyan mx-auto" />
                <p className="text-sm text-t1 font-bold">AI-Powered Multi-Drug Search</p>
                <p className="text-xs text-t3 max-w-md mx-auto">
                  Describe what medications you need in plain English. Our AI will parse your request,
                  search all pharmacies in parallel, and recommend the optimal sourcing strategy.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-wider text-t3 font-mono mb-1">Drug Name</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchTrends()}
                  placeholder="Enter a drug name, e.g. Paracetamol 500mg"
                  className="w-full px-4 py-3 bg-deep border border-border rounded-lg text-t1 font-mono placeholder-t3 focus:ring-1 focus:ring-cyan focus:border-cyan outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-t3 font-mono mb-1">Time Range</label>
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
                onClick={() => fetchTrends()}
                disabled={loading || !query.trim()}
                className="px-6 py-3 bg-cyan text-abyss font-bold rounded-lg hover:bg-cyan/80 disabled:bg-t3/30 disabled:text-t3 transition-colors"
              >
                {loading ? 'Scanning...' : 'Analyze'}
              </button>
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs uppercase tracking-wider text-t3 font-mono">Try:</span>
              {QUICK_SUGGESTIONS.map((drug) => (
                <button
                  key={drug}
                  onClick={() => { setQuery(drug); fetchTrends(drug); }}
                  disabled={loading}
                  className="px-3 py-1 text-xs bg-card text-t2 rounded border border-border hover:border-cyan/30 hover:text-cyan transition-colors disabled:opacity-50"
                >
                  {drug}
                </button>
              ))}
            </div>

            {fetchError && (
              <ApiErrorBanner message={fetchError} onDismiss={() => setFetchError(null)} />
            )}

            {loading && query.trim() && (
              <LoadingPanel message={t('trends.loadingHistory')} />
            )}

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
                        <th className="text-left py-2.5 px-6 text-xs uppercase tracking-wider text-t3 font-mono">Pharmacy</th>
                        <th className="text-left py-2.5 px-6 text-xs uppercase tracking-wider text-t3 font-mono">Product</th>
                        <th className="text-right py-2.5 px-6 text-xs uppercase tracking-wider text-t3 font-mono">Latest Price</th>
                        <th className="text-right py-2.5 px-6 text-xs uppercase tracking-wider text-t3 font-mono">Observations</th>
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

            {data.length === 0 && !loading && !fetchError && (
              <div className="bg-deep border border-border rounded-lg p-16 text-center space-y-4">
                <BarChart3 size={32} className="text-cyan mx-auto" />
                <p className="text-sm text-t1 font-bold">No price data yet</p>
                <p className="text-xs text-t3 max-w-md mx-auto">
                  Search for a drug above to see how its price has changed over time across Vietnamese pharmacies.
                  Try clicking one of the suggestions to get started.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function TrendsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-t3">
          <LoadingPanel message="Loading trends…" />
        </div>
      }
    >
      <TrendsContent />
    </Suspense>
  );
}
