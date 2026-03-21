'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import SearchBar from '@/components/SearchBar';
import PharmacyCards from '@/components/PharmacyCards';
import PriceGrid from '@/components/PriceGrid';
import SavingsBanner from '@/components/SavingsBanner';
import MegalodonAlert from '@/components/MegalodonAlert';
import StatusPill from '@/components/StatusPill';
import SonarFilters from '@/components/SonarFilters';
import PricingChart from '@/components/PricingChart';
import AgentActivityFeed from '@/components/AgentActivityFeed';
import LiveMetricsBar from '@/components/LiveMetricsBar';
import DemoAlertTrigger from '@/components/DemoAlertTrigger';
import LiveBrowserPreview from '@/components/LiveBrowserPreview';
import AgentCascade from '@/components/AgentCascade';
import ModelRouterPanel from '@/components/ModelRouterPanel';
import CeilingPanel from '@/components/CeilingPanel';
import CounterfeitRiskPanel from '@/components/CounterfeitRiskPanel';
import type { ModelStep } from '@/components/ModelRouterPanel';

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

interface ScanSummary {
  query: string;
  best_price: number | null;
  best_source: string | null;
  price_range: string | null;
  potential_savings: number | null;
  total_results: number;
  variants?: string[];
  price_fluctuations?: string[];
}

interface TrendPoint {
  source_id: string;
  source_name: string;
  product_name: string;
  price: number;
  observed_at: string;
}

interface AgentEvent {
  id: string;
  timestamp: number;
  type: 'spawn' | 'searching' | 'success' | 'error' | 'variant';
  agent: string;
  message: string;
  source_id?: string;
}

const MEMORY_USER_KEY = 'megladonMdMemoryUser';
/** Supermemory indexes asynchronously; first recall may be empty; we retry once after this delay. */
const MEMORY_RECALL_RETRY_MS = 7000;

function ensureMemoryUserId(): string {
  let id = localStorage.getItem(MEMORY_USER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(MEMORY_USER_KEY, id);
  }
  return id;
}

const MOCK_CHART_DATA = [
  { date: 'OCT 12', awp: 513.6, wac: 520.26 },
  { date: 'OCT 13', awp: 500.28, wac: 516.93 },
  { date: 'OCT 14', awp: 506.94, wac: 518.93 },
  { date: 'OCT 15', awp: 466.98, wac: 513.6 },
  { date: 'OCT 16', awp: 480.3, wac: 510.27 },
  { date: 'OCT 17', awp: 427.02, wac: 512.27 },
  { date: 'OCT 18', awp: 440.34, wac: 506.94 },
  { date: 'OCT 19', awp: 400.38, wac: 503.61 },
  { date: 'OCT 20', awp: 407.04, wac: 505.61 },
  { date: 'OCT 21', awp: 360.42, wac: 500.28 },
  { date: 'OCT 22', awp: 373.74, wac: 496.95 },
];

const MOCK_TABLE_DATA = [
  {
    name: 'Atorvastatin Calcium',
    ndc: '00093-3147-01',
    awp: 432.12,
    wac: 388.9,
    change: '+1.2%',
    changeDir: 'up' as const,
    status: 'best',
    statusLabel: 'TINYFISH',
    agentStatus: 'Active',
    latency: '12ms',
    node: '0x44B1...FA12',
  },
  {
    name: 'Lisinopril 20mg',
    ndc: '00406-0512-01',
    awp: 1245.0,
    wac: 920.4,
    change: '+420%',
    changeDir: 'up-critical' as const,
    status: 'critical',
    statusLabel: 'CRITICAL',
    agentStatus: null,
    latency: null,
    node: null,
  },
  {
    name: 'Rosuvastatin 10mg',
    ndc: '00378-0112-05',
    awp: 118.5,
    wac: 105.2,
    change: '0.0%',
    changeDir: 'flat' as const,
    status: 'monitor',
    statusLabel: 'MONITOR',
    agentStatus: null,
    latency: null,
    node: null,
  },
];

export default function DashboardHome() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Record<string, PharmacyResult>>({});
  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [memoryHints, setMemoryHints] = useState<string[]>([]);
  const [memoryEmptyHint, setMemoryEmptyHint] = useState(false);
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [syncTime, setSyncTime] = useState('');
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [streamingUrls, setStreamingUrls] = useState<Record<string, string>>({});
  const [modelSteps, setModelSteps] = useState<ModelStep[]>([
    { step: 'normalize', model: 'qwen-2.5-72b', provider: 'OpenRouter', latency_ms: null, status: 'pending', count: 0 },
    { step: 'search', model: 'TinyFish Agent', provider: 'TinyFish', latency_ms: null, status: 'pending', count: 0 },
    { step: 'discovery', model: 'Neural Search', provider: 'Exa', latency_ms: null, status: 'pending', count: 0 },
    { step: 'ocr', model: 'gpt-4o', provider: 'OpenAI', latency_ms: null, status: 'pending', count: 0 },
  ]);
  const eventBufferRef = useRef<Array<{ type: string; data: any }>>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef('');
  const lastSummaryRef = useRef<ScanSummary | null>(null);
  const eventIdRef = useRef(0);

  const pharmaciesComplete = Object.values(results).filter(
    (r) => r.status === 'success' || r.status === 'error'
  ).length;
  const productsFound = Object.values(results).reduce(
    (sum, r) => sum + (r.status === 'success' ? r.result_count : 0),
    0
  );

  const addAgentEvent = useCallback(
    (type: AgentEvent['type'], agent: string, message: string, source_id?: string) => {
      const evt: AgentEvent = {
        id: String(++eventIdRef.current),
        timestamp: Date.now(),
        type,
        agent,
        message,
        source_id,
      };
      setAgentEvents((prev) => [...prev, evt]);
    },
    []
  );

  const flushEvents = useCallback(() => {
    const buffer = eventBufferRef.current;
    if (buffer.length === 0) return;

    const newResults: Record<string, any> = {};
    let newSummary: ScanSummary | null = null;

    for (const evt of buffer) {
      if (evt.type === 'pharmacy') {
        newResults[evt.data.source_id] = evt.data;
      } else if (evt.type === 'summary') {
        newSummary = evt.data;
      }
    }

    if (Object.keys(newResults).length > 0) {
      setResults((prev) => ({ ...prev, ...newResults }));
    }
    if (newSummary) {
      setScanSummary(newSummary);
      lastSummaryRef.current = newSummary;
    }

    eventBufferRef.current = [];
  }, []);

  const fetchMemoryRecall = useCallback(
    async (q: string, userId: string): Promise<{ enabled: boolean; snippets: string[] }> => {
      if (!q.trim()) {
        return { enabled: false, snippets: [] };
      }
      try {
        const r = await fetch(
          `${API_URL}/api/memory/recall?q=${encodeURIComponent(q.trim())}&user=${encodeURIComponent(userId)}`
        );
        if (!r.ok) {
          return { enabled: false, snippets: [] };
        }
        const data = await r.json();
        const enabled = Boolean(data.enabled);
        const snippets = Array.isArray(data.snippets) ? data.snippets : [];
        return { enabled, snippets };
      } catch {
        return { enabled: false, snippets: [] };
      }
    },
    []
  );

  useEffect(() => {
    const update = () =>
      setSyncTime(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const q = scanSummary?.query?.trim();
    if (!q) {
      setTrendData([]);
      return;
    }
    let cancelled = false;
    setTrendLoading(true);
    void (async () => {
      try {
        const res = await fetch(`${API_URL}/api/trends/${encodeURIComponent(q)}?days=7`);
        const json = await res.json();
        if (!cancelled) {
          setTrendData(Array.isArray(json.data) ? json.data : []);
        }
      } catch {
        if (!cancelled) setTrendData([]);
      } finally {
        if (!cancelled) setTrendLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scanSummary?.query, scanSummary?.best_price, scanSummary?.total_results]);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setResults({});
    setScanSummary(null);
    lastSummaryRef.current = null;
    setInsight('');
    setInsightError(null);
    setInsightLoading(false);
    setCurrentQuery(query);
    setAgentEvents([]);
    setStreamingUrls({});
    setModelSteps(prev => prev.map(s => ({ ...s, latency_ms: null, status: 'pending', count: 0 })));
    eventIdRef.current = 0;
    addAgentEvent('spawn', 'Orchestrator', `Deploying agents for "${query}"`);

    try {
      const memoryUserId = ensureMemoryUserId();
      latestQueryRef.current = query;
      setMemoryEmptyHint(false);

      const recall = await fetchMemoryRecall(query, memoryUserId);
      if (recall.enabled && recall.snippets.length > 0) {
        setMemoryHints(recall.snippets);
      } else {
        setMemoryHints([]);
        setMemoryEmptyHint(recall.enabled && recall.snippets.length === 0);
        if (recall.enabled && recall.snippets.length === 0) {
          const qSnap = query;
          const uid = memoryUserId;
          window.setTimeout(() => {
            if (latestQueryRef.current !== qSnap) return;
            void (async () => {
              const again = await fetchMemoryRecall(qSnap, uid);
              if (latestQueryRef.current !== qSnap) return;
              if (again.snippets.length > 0) {
                setMemoryHints(again.snippets);
                setMemoryEmptyHint(false);
              }
            })();
          }, MEMORY_RECALL_RETRY_MS);
        }
      }

      const memQ = `&memory_user=${encodeURIComponent(memoryUserId)}`;
      const response = await fetch(
        `${API_URL}/api/search?query=${encodeURIComponent(query)}${memQ}`,
        { method: 'POST' }
      );
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
            if (event.type === 'model_used') {
              setModelSteps(prev => prev.map(s =>
                s.step === event.step
                  ? { ...s, model: event.model || s.model, provider: event.provider || s.provider, latency_ms: event.latency_ms, status: 'done', count: s.count + 1 }
                  : s
              ));
            } else if (event.type === 'agent_spawn') {
              addAgentEvent(
                'spawn',
                event.name || 'Agent',
                `Spawned → ${event.target ?? ''}`
              );
            } else if (event.type === 'agent_complete') {
              addAgentEvent(
                'success',
                event.agent_id || 'Agent',
                `Complete (${event.result_count ?? 0} results)`
              );
            } else if (event.type === 'agent_fail') {
              addAgentEvent('error', event.agent_id || 'Agent', String(event.error || 'failed'));
            } else if (event.type === 'pharmacy_status' && event.status === 'searching') {
              addAgentEvent(
                'searching',
                `${event.source_name || 'Pharmacy'}`,
                'Scanning…',
                event.source_id
              );
              eventBufferRef.current.push({ type: 'pharmacy', data: event });
            } else if (event.task === 'summary' || event.type === 'search_complete') {
              eventBufferRef.current.push({ type: 'summary', data: event });
              addAgentEvent(
                'success',
                'Orchestrator',
                `Search complete — ${event.total_results ?? 0} products`
              );
            } else if (event.source_id) {
              eventBufferRef.current.push({ type: 'pharmacy', data: event });
              if (event.streaming_url) {
                setStreamingUrls((prev) => ({
                  ...prev,
                  [event.source_id]: event.streaming_url,
                }));
              }
              if (event.status === 'success') {
                addAgentEvent(
                  'success',
                  `${event.source_name || 'Pharmacy'} Agent`,
                  `Found ${event.result_count ?? 0} products (${((event.response_time_ms || 0) / 1000).toFixed(1)}s)`,
                  event.source_id
                );
              } else if (event.status === 'error') {
                addAgentEvent(
                  'error',
                  `${event.source_name || 'Pharmacy'} Agent`,
                  String(event.error || 'Signal lost'),
                  event.source_id
                );
              }
            }

            if (!flushTimerRef.current) {
              flushTimerRef.current = setTimeout(() => {
                flushEvents();
                flushTimerRef.current = null;
              }, 200);
            }
          } catch {
            /* skip bad chunk */
          }
        }
      }
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      flushEvents();

      const lastSummary = lastSummaryRef.current as ScanSummary | null;
      if (lastSummary) {
        setInsightLoading(true);
        try {
          const ir = await fetch(`${API_URL}/api/insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user: memoryUserId,
              drug_query: lastSummary.query,
              current_scan: {
                best_price: lastSummary.best_price,
                best_source: lastSummary.best_source,
                price_range: lastSummary.price_range,
                potential_savings: lastSummary.potential_savings,
                total_results: lastSummary.total_results,
                variants: lastSummary.variants ?? [],
                price_fluctuations: lastSummary.price_fluctuations ?? [],
              },
            }),
          });
          const data = await ir.json();
          if (data.enabled && typeof data.insight === 'string' && data.insight.trim()) {
            setInsight(data.insight.trim());
            setInsightError(null);
          } else if (!data.enabled) {
            setInsight('');
            setInsightError(null);
          } else {
            setInsight('');
            setInsightError(data.error || 'No personalized note returned.');
          }
        } catch {
          setInsight('');
          setInsightError('Could not load personalized note.');
        } finally {
          setInsightLoading(false);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const hasResults = Object.keys(results).length > 0;
  const hasMegalodon =
    scanSummary &&
    scanSummary.potential_savings &&
    scanSummary.best_price &&
    scanSummary.potential_savings > scanSummary.best_price;

  return (
    <div className="min-h-screen flex flex-col">
      {hasMegalodon && scanSummary && (
        <MegalodonAlert
          drugName={scanSummary.query}
          message={`Price spread of ${scanSummary.potential_savings?.toLocaleString()} VND detected across sources`}
        />
      )}

      <div className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-t1 tracking-tight">
                Megladon MD: <span className="text-cyan">The Abyss</span>
              </h2>
              <p className="text-[11px] text-t3 mt-0.5 italic">
                Surfacing deep market trajectories and molecular cost-signals.
              </p>
            </div>
            <div className="flex gap-2 mt-1">
              <button className="px-3 py-1.5 text-[10px] border border-cyan/40 text-cyan rounded hover:bg-cyan/10 transition-all hover:border-cyan font-mono uppercase tracking-wider">
                Export Intel
              </button>
              <button
                onClick={() => (currentQuery ? handleSearch(currentQuery) : null)}
                className="px-3 py-1.5 text-[10px] border border-cyan/40 text-cyan rounded hover:bg-cyan/10 transition-all hover:border-cyan font-mono uppercase tracking-wider"
              >
                Deploy New Probe
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        <div className="flex-1 min-w-0">
          <div className="p-6 space-y-5">
            {memoryHints.length > 0 && (
              <div className="rounded-lg border border-cyan/25 bg-cyan/5 px-4 py-3">
                <p className="text-xs font-mono text-cyan mb-2">Supermemory — related context</p>
                <ul className="text-xs text-t2 space-y-1 list-disc list-inside">
                  {memoryHints.slice(0, 5).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {memoryEmptyHint && memoryHints.length === 0 && (
              <p className="text-xs text-t3 font-mono">
                Supermemory is on — past searches for similar drugs may appear after indexing (a few
                seconds).
              </p>
            )}

            <SearchBar onSearch={handleSearch} isSearching={isSearching} />

            {!hasResults && !isSearching && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {[
                  {
                    icon: '⚡',
                    title: 'Parallel Agents',
                    desc: '5 AI agents search pharmacy websites simultaneously in under 30 seconds.',
                  },
                  {
                    icon: '📊',
                    title: 'Price Intelligence',
                    desc: 'Track price trends, set alerts, and find savings of up to 300%.',
                  },
                  {
                    icon: '💊',
                    title: 'Prescription Optimizer',
                    desc: 'Optimize sourcing across pharmacies for entire prescriptions.',
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="bg-deep border border-border rounded-lg p-6 hover:border-cyan/30 transition-colors"
                  >
                    <div className="text-2xl mb-3">{card.icon}</div>
                    <h3 className="font-bold text-t1 text-sm mb-2">{card.title}</h3>
                    <p className="text-xs text-t3">{card.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {(hasResults || isSearching) && (
              <div className="space-y-4">
                {currentQuery && (
                  <div className="flex items-center gap-3">
                    <h3 className="text-xs font-mono text-t2">
                      Scanning: <span className="text-cyan">&ldquo;{currentQuery}&rdquo;</span>
                    </h3>
                    {isSearching && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-cyan rounded-full animate-pulse" />
                        <span className="text-[10px] text-t3 font-mono">Agents active</span>
                      </div>
                    )}
                  </div>
                )}
                <LiveBrowserPreview
                  streamingUrls={streamingUrls}
                  pharmacyNames={Object.fromEntries(
                    Object.values(results).map((r) => [r.source_id, r.source_name])
                  )}
                  isSearching={isSearching}
                />
                <LiveMetricsBar
                  agentsSpawned={agentEvents.filter((e) => e.type === 'spawn').length}
                  pharmaciesComplete={pharmaciesComplete}
                  pharmaciesTotal={5}
                  productsFound={productsFound}
                  savingsVnd={scanSummary?.potential_savings ?? null}
                  isActive={isSearching}
                />
                <AgentCascade
                  tier0Active={false}
                  tier1Active={isSearching ? 5 - pharmaciesComplete : 0}
                  tier1Complete={pharmaciesComplete}
                  tier1Total={5}
                  tier2Variants={scanSummary?.variants?.length ?? 0}
                  visible={isSearching || hasResults}
                />
                <PharmacyCards results={results} />
                <AgentActivityFeed events={agentEvents} isActive={isSearching} />
                <ModelRouterPanel steps={modelSteps} isActive={isSearching} />
                {scanSummary && (
                  <SavingsBanner
                    bestPrice={scanSummary.best_price}
                    bestSource={scanSummary.best_source}
                    priceRange={scanSummary.price_range}
                    potentialSavings={scanSummary.potential_savings}
                    totalResults={scanSummary.total_results}
                  />
                )}
                {scanSummary?.price_fluctuations && scanSummary.price_fluctuations.length > 0 && (
                  <div className="rounded-lg border border-border bg-card/40 px-4 py-3">
                    <p className="text-xs font-mono text-t2 mb-2">Price vs last scan (product + chain)</p>
                    <ul className="text-xs text-t3 space-y-1.5 list-disc list-inside">
                      {scanSummary.price_fluctuations.map((line: string, i: number) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(insightLoading || insight || insightError) && (
                  <div className="rounded-lg border border-cyan/30 bg-deep px-4 py-3">
                    <p className="text-xs font-mono text-cyan mb-2">Personalized note</p>
                    {insightLoading && (
                      <p className="text-xs text-t3 animate-pulse">Generating from your scan and memory…</p>
                    )}
                    {!insightLoading && insight && (
                      <p className="text-sm text-t2 leading-relaxed whitespace-pre-wrap">{insight}</p>
                    )}
                    {!insightLoading && insightError && (
                      <p className="text-xs text-t3">{insightError}</p>
                    )}
                  </div>
                )}
                {scanSummary?.variants && scanSummary.variants.length > 0 && (
                  <div className="bg-deep border border-cyan/20 rounded-lg p-3">
                    <p className="text-[10px] font-mono text-cyan mb-2">Generic alternatives detected:</p>
                    <div className="flex gap-2 flex-wrap">
                      {scanSummary.variants.map((v) => (
                        <button
                          key={v}
                          onClick={() => handleSearch(v)}
                          disabled={isSearching}
                          className="px-2.5 py-1 text-[10px] bg-card text-cyan border border-cyan/30 rounded hover:bg-cyan/10 transition-colors disabled:opacity-50"
                        >
                          Scan &ldquo;{v}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <CeilingPanel compliance={(scanSummary as any)?.compliance ?? null} query={currentQuery} />
                <CounterfeitRiskPanel
                  anomalies={(scanSummary as any)?.price_anomalies ?? null}
                  risk={(scanSummary as any)?.counterfeit_risk ?? null}
                />
                <PriceGrid results={results} bestPrice={scanSummary?.best_price ?? null} />
                <DemoAlertTrigger
                  drugName={currentQuery || 'Metformin 500mg'}
                  bestPrice={scanSummary?.best_price ?? undefined}
                  bestSource={scanSummary?.best_source ?? undefined}
                />
              </div>
            )}

            {scanSummary && (trendLoading || trendData.length > 0) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs font-mono text-t2">7-day price trajectory (stored scans)</p>
                  <Link
                    href={`/trends?q=${encodeURIComponent(scanSummary.query)}`}
                    className="text-xs text-cyan hover:underline font-mono"
                  >
                    Open full trends
                  </Link>
                </div>
                {trendLoading && (
                  <p className="text-xs text-t3 animate-pulse font-mono">Loading history…</p>
                )}
                {!trendLoading && trendData.length > 0 && <PricingChart data={trendData} />}
              </div>
            )}

            <div className="flex items-center gap-6 text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-cyan rounded-sm" />
                <span className="text-t2 font-mono">
                  AWP <span className="text-t3">ATOVASTATIN CALCIUM</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-white/20 rounded-sm" />
                <span className="text-t2 font-mono">
                  WAC <span className="text-t3">METFORMIN</span>
                </span>
              </div>
            </div>

            <div className="bg-abyss rounded-lg overflow-hidden" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={MOCK_CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="awpGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00DBE7" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#041329" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'monospace' }}
                    axisLine={{ stroke: 'rgba(0,219,231,0.1)' }}
                    tickLine={false}
                    interval={1}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#010E24',
                      border: '1px solid rgba(0,219,231,0.2)',
                      borderRadius: 4,
                      fontSize: 10,
                      fontFamily: 'monospace',
                    }}
                    labelStyle={{ color: '#D6E3FF', fontSize: 10 }}
                    itemStyle={{ color: '#94A3B8', fontSize: 10 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="awp"
                    stroke="#00DBE7"
                    strokeWidth={1.5}
                    fill="url(#awpGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#00DBE7', stroke: '#041329', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="wac"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={1}
                    strokeDasharray="3 2"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-abyss">
              <div className="flex items-center gap-4 mb-3">
                <h3 className="text-[11px] font-bold text-t1 uppercase tracking-[0.15em]">
                  Pricing Abyss Index
                </h3>
                <div className="flex items-center gap-2 text-[9px] text-t3 font-mono">
                  <span>Real-time Feed</span>
                  <span className="text-t3">•</span>
                  <span>Tinyfish Intelligence</span>
                </div>
              </div>

              <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr_0.8fr_1fr] gap-0 border-b border-border/60 pb-2 mb-0">
                <span className="text-[9px] uppercase tracking-wider text-t3 font-mono">Drug Name / NDC</span>
                <span className="text-[9px] uppercase tracking-wider text-t3 font-mono">AWP ($)</span>
                <span className="text-[9px] uppercase tracking-wider text-t3 font-mono">WAC ($)</span>
                <span className="text-[9px] uppercase tracking-wider text-t3 font-mono">24H</span>
                <span className="text-[9px] uppercase tracking-wider text-t3 font-mono">Trend</span>
                <span className="text-[9px] uppercase tracking-wider text-t3 font-mono">Status</span>
              </div>

              {MOCK_TABLE_DATA.map((row, i) => (
                <div key={i} className="border-b border-border/30 hover:bg-card/30 transition-colors">
                  <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr_0.8fr_1fr] gap-0 items-center py-3">
                    <div>
                      <div className="text-[12px] text-t1 font-medium leading-tight">{row.name}</div>
                      <div className="text-[9px] text-t3 font-mono mt-0.5">{row.ndc}</div>
                    </div>
                    <div className="text-[12px] text-t2 font-mono">{row.awp.toFixed(2)}</div>
                    <div className="text-[12px] text-t2 font-mono">{row.wac.toFixed(2)}</div>
                    <div
                      className={`text-[12px] font-mono font-bold ${
                        row.changeDir === 'up-critical'
                          ? 'text-alert-red'
                          : row.changeDir === 'up'
                            ? 'text-success'
                            : 'text-t3'
                      }`}
                    >
                      {row.change}
                    </div>
                    <div>
                      {row.changeDir === 'up-critical' ? (
                        <svg className="w-4 h-4 text-alert-red" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                          />
                        </svg>
                      ) : row.changeDir === 'up' ? (
                        <svg className="w-4 h-4 text-success" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                          />
                        </svg>
                      ) : (
                        <span className="text-[10px] text-t3 font-mono">—</span>
                      )}
                    </div>
                    <div>
                      <StatusPill status={row.status} label={row.statusLabel} />
                    </div>
                  </div>

                  {row.agentStatus && (
                    <div className="flex items-center gap-4 pb-2.5 pl-1">
                      <span className="text-[8px] text-t3 font-mono uppercase tracking-wider">
                        Distributed Agent Network
                      </span>
                      <span className="text-[8px] text-t3 font-mono">
                        Heartbeat: <span className="text-success">{row.agentStatus}</span>
                      </span>
                      <span className="text-[8px] text-t3 font-mono">
                        Latency: <span className="text-t2">{row.latency}</span>
                      </span>
                      <span className="text-[8px] text-t3 font-mono">
                        Processing Node: <span className="text-t2">{row.node}</span>
                      </span>
                    </div>
                  )}

                  {row.status === 'monitor' && (
                    <div className="pb-2.5 pl-1">
                      <span className="text-[8px] text-t3 font-mono">
                        Price trajectories are currently calculated using{' '}
                        <span className="text-t2">14.2M</span> data points across{' '}
                        <span className="text-t2">42</span> wholesale hubs.
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/30">
              <div className="flex gap-5 text-[9px] text-t3 font-mono">
                <span className="hover:text-t2 cursor-pointer transition-colors">Privacy Protocol</span>
                <span className="hover:text-t2 cursor-pointer transition-colors">Abyssal Methodology</span>
                <span className="hover:text-t2 cursor-pointer transition-colors">Source Oracle</span>
              </div>
              <span className="text-[9px] text-t3 font-mono">System Synchronized: {syncTime} UTC</span>
            </div>
          </div>
        </div>

        <SonarFilters />
      </div>
    </div>
  );
}
