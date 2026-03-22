'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import ComparisonBanner from '@/components/ComparisonBanner';
import SearchBar from '@/components/SearchBar';
import PharmacyCards from '@/components/PharmacyCards';
import PriceGrid from '@/components/PriceGrid';
import SavingsBanner from '@/components/SavingsBanner';
import MegalodonAlert from '@/components/MegalodonAlert';
import PricingChart from '@/components/PricingChart';
import AgentActivityFeed from '@/components/AgentActivityFeed';
import LiveMetricsBar from '@/components/LiveMetricsBar';
import DemoAlertTrigger from '@/components/DemoAlertTrigger';
import LiveBrowserPreview from '@/components/LiveBrowserPreview';
import AgentCascade from '@/components/AgentCascade';
import ModelRouterPanel from '@/components/ModelRouterPanel';
import CeilingPanel from '@/components/CeilingPanel';
import VoiceSummary from '@/components/VoiceSummary';
import ActionLabel from '@/components/ActionLabel';
import CounterfeitRiskPanel from '@/components/CounterfeitRiskPanel';
import { ApiErrorBanner } from '@/components/ApiErrorBanner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { ModelStep } from '@/components/ModelRouterPanel';
import { useLocale } from '@/components/LocaleProvider';
import { Zap, BarChart3, Pill, Eye, Shield, Bell, TrendingUp, Brain } from 'lucide-react';
import SponsorBadge from '@/components/SponsorBadge';

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
  who_reference?: { price_snippet?: string; source_title?: string; source_url?: string; highlights?: string[] } | null;
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
  type: 'spawn' | 'searching' | 'success' | 'error' | 'variant' | 'investigate';
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

export default function DashboardHome() {
  const { t } = useLocale();
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
  const [trendError, setTrendError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [sparklineData, setSparklineData] = useState<Record<string, { source_name: string; points: { price: number; time: string }[] }>>({});
  const [searchTimeMs, setSearchTimeMs] = useState<number | null>(null);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [streamingUrls, setStreamingUrls] = useState<Record<string, string>>({});
  const [modelSteps, setModelSteps] = useState<ModelStep[]>([
    { step: 'normalize', model: 'qwen-2.5-72b', provider: 'OpenRouter', latency_ms: null, status: 'pending', count: 0 },
    { step: 'search', model: 'TinyFish Agent', provider: 'TinyFish', latency_ms: null, status: 'pending', count: 0 },
    { step: 'discovery', model: 'Neural Search', provider: 'Exa', latency_ms: null, status: 'pending', count: 0 },
    { step: 'ocr', model: 'gpt-4o', provider: 'OpenAI', latency_ms: null, status: 'pending', count: 0 },
    { step: 'analyst', model: 'qwen-2.5-72b', provider: 'OpenRouter', latency_ms: null, status: 'pending', count: 0 },
  ]);
  const [analystVerdict, setAnalystVerdict] = useState<any>(null);
  const [normalization, setNormalization] = useState<{ original: string; normalized: string } | null>(null);
  const [investigationResults, setInvestigationResults] = useState<any[]>([]);
  const eventBufferRef = useRef<Array<{ type: string; data: any }>>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef('');
  const lastSummaryRef = useRef<ScanSummary | null>(null);
  const eventIdRef = useRef(0);
  const autoSearchedRef = useRef(false);

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
    const q = scanSummary?.query?.trim();
    if (!q) {
      setTrendData([]);
      setTrendError(null);
      return;
    }
    let cancelled = false;
    setTrendLoading(true);
    setTrendError(null);
    void (async () => {
      try {
        const res = await fetch(`${API_URL}/api/trends/${encodeURIComponent(q)}?days=7`);
        if (!res.ok) {
          if (!cancelled) {
            setTrendData([]);
            setTrendError(t('error.server', { status: res.status }));
          }
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setTrendData(Array.isArray(json.data) ? json.data : []);
          setTrendError(null);
        }
      } catch {
        if (!cancelled) {
          setTrendData([]);
          setTrendError(t('error.trends'));
        }
      } finally {
        if (!cancelled) setTrendLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scanSummary?.query, scanSummary?.best_price, scanSummary?.total_results, t]);

  useEffect(() => {
    if (!scanSummary?.query) return;
    const q = scanSummary.query;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/sparklines/${encodeURIComponent(q)}?days=7`);
        const json = await res.json();
        if (json.sparklines) setSparklineData(json.sparklines);
      } catch (e) {
        console.warn('Sparkline fetch failed:', e);
      }
    })();
  }, [scanSummary?.query]);

  const handleSearch = async (query: string) => {
    setSearchError(null);
    const searchStart = Date.now();
    setIsSearching(true);
    setResults({});
    setScanSummary(null);
    lastSummaryRef.current = null;
    setInsight('');
    setInsightError(null);
    setInsightLoading(false);
    setCurrentQuery(query);
    setAgentEvents([]);
    setAnalystVerdict(null);
    setNormalization(null);
    setStreamingUrls({});
    setInvestigationResults([]);
    setSearchTimeMs(null);
    setModelSteps(prev => prev.map(s => ({ ...s, latency_ms: null, status: 'pending', count: 0 })));
    eventIdRef.current = 0;
    addAgentEvent('spawn', 'Orchestrator', t('dash.deployOrchestrator', { query }));

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
      if (!response.ok || !response.body) {
        addAgentEvent(
          'error',
          'Orchestrator',
          response.ok ? t('error.searchStream') : t('error.server', { status: response.status })
        );
        setSearchError(
          response.ok ? t('error.searchStream') : t('error.server', { status: response.status })
        );
        return;
      }
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
            if (event.type === 'analyst_verdict') {
              setAnalystVerdict(event);
            } else if (event.type === 'anomaly_investigation') {
              setInvestigationResults(prev => [...prev, event]);
              addAgentEvent(
                'investigate',
                'Investigator',
                `${event.product_name}: ${event.manufacturer_check?.known_good ? 'Verified mfr' : 'Unverified mfr'}`
              );
            } else if (event.type === 'counterfeit_risk') {
              // Late-arriving counterfeit risk report from Exa Research
              setScanSummary(prev => prev ? { ...prev, counterfeit_risk: event } as any : prev);
            } else if (event.type === 'model_used') {
              if (event.step === 'normalize' && event.original_query && event.normalized_query) {
                setNormalization({ original: event.original_query, normalized: event.normalized_query });
              }
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
            } else if (event.type === 'streaming_url' && event.source_id && event.streaming_url) {
              setStreamingUrls((prev) => ({
                ...prev,
                [event.source_id]: event.streaming_url,
              }));
            } else if (event.type === 'pharmacy_status' && event.status === 'searching') {
              addAgentEvent(
                'searching',
                `${event.source_name || t('common.pharmacy')}`,
                t('common.scanning'),
                event.source_id
              );
              eventBufferRef.current.push({ type: 'pharmacy', data: event });
            } else if (event.task === 'summary' || event.type === 'search_complete') {
              eventBufferRef.current.push({ type: 'summary', data: event });
              addAgentEvent(
                'success',
                'Orchestrator',
                t('common.searchComplete', { count: event.total_results ?? 0 })
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
                  `${event.source_name || t('common.pharmacy')} Agent`,
                  t('common.foundProducts', {
                    count: event.result_count ?? 0,
                    sec: ((event.response_time_ms || 0) / 1000).toFixed(1),
                  }),
                  event.source_id
                );
              } else if (event.status === 'error') {
                addAgentEvent(
                  'error',
                  `${event.source_name || t('common.pharmacy')} Agent`,
                  String(event.error || t('common.signalLost')),
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
            setInsightError(data.error || t('dash.insightNone'));
          }
        } catch {
          setInsight('');
          setInsightError(t('dash.insightError'));
        } finally {
          setInsightLoading(false);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      const msg =
        error instanceof TypeError ? t('error.network') : t('error.searchStream');
      setSearchError(msg);
      addAgentEvent('error', 'Orchestrator', msg);
    } finally {
      setIsSearching(false);
      setSearchTimeMs(Date.now() - searchStart);
    }
  };

  // Auto-search on initial mount so judges see results immediately
  useEffect(() => {
    if (autoSearchedRef.current) return;
    autoSearchedRef.current = true;
    handleSearch('Metformin 500mg');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasResults = Object.keys(results).length > 0;
  const hasMegalodon =
    scanSummary &&
    scanSummary.potential_savings &&
    scanSummary.best_price &&
    scanSummary.potential_savings > scanSummary.best_price;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover opacity-[0.07] pointer-events-none z-0"
      >
        <source src="/drone-ocean-bg.mp4" type="video/mp4" />
      </video>

      <div className="relative z-10 min-h-screen flex flex-col">
      {hasMegalodon && scanSummary && (
        <MegalodonAlert
          drugName={scanSummary.query}
          message={t('dash.megalodonSpread', {
            amount: scanSummary.potential_savings?.toLocaleString() ?? '',
          })}
        />
      )}

      <div className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-t1 tracking-tight">
                {t('dash.title')} <span className="text-cyan">{t('dash.abyss')}</span>
              </h2>
              <p className="text-[11px] text-t3 mt-0.5 italic">
                {t('dash.subtitle')}
              </p>
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => (currentQuery ? handleSearch(currentQuery) : null)}
                className="px-3 py-1.5 text-[10px] border border-cyan/40 text-cyan rounded hover:bg-cyan/10 transition-all hover:border-cyan font-mono uppercase tracking-wider"
              >
                {t('dash.deployNewProbe')}
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
                <p className="text-xs font-mono text-cyan mb-2 flex items-center gap-2">{t('dash.supermemoryTitle')} <SponsorBadge sponsors={['Supermemory']} /></p>
                <ul className="text-xs text-t2 space-y-1 list-disc list-inside">
                  {memoryHints.slice(0, 5).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {memoryEmptyHint && memoryHints.length === 0 && (
              <p className="text-xs text-t3 font-mono">{t('dash.supermemoryHint')}</p>
            )}

            {searchError && (
              <ApiErrorBanner
                message={`${t('dash.searchErrorTitle')}: ${searchError}`}
                onDismiss={() => setSearchError(null)}
              />
            )}

            <SearchBar onSearch={handleSearch} isSearching={isSearching} defaultQuery="Metformin 500mg" />

            {!hasResults && !isSearching && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {[
                  {
                    key: 'agents',
                    icon: <Zap className="w-5 h-5 text-cyan" />,
                    title: t('dash.cardAgentsTitle'),
                    desc: t('dash.cardAgentsDesc'),
                  },
                  {
                    key: 'intel',
                    icon: <BarChart3 className="w-5 h-5 text-cyan" />,
                    title: t('dash.cardIntelTitle'),
                    desc: t('dash.cardIntelDesc'),
                  },
                  {
                    key: 'opt',
                    icon: <Pill className="w-5 h-5 text-cyan" />,
                    title: t('dash.cardOptTitle'),
                    desc: t('dash.cardOptDesc'),
                  },
                ].map((card) => (
                  <div
                    key={card.key}
                    className="bg-deep border border-border rounded-lg p-6 hover:border-cyan/30 transition-colors"
                  >
                    <div className="mb-3">{card.icon}</div>
                    <h3 className="font-bold text-t1 text-sm mb-2">{card.title}</h3>
                    <p className="text-xs text-t3">{card.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {(hasResults || isSearching) ? (
              <div className="space-y-4">
                {currentQuery && (
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xs font-mono text-t2">
                      {t('dash.scanning')}{' '}
                      <span className="text-cyan">&ldquo;{currentQuery}&rdquo;</span>
                    </h3>
                    {isSearching && (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner
                          size="sm"
                          className="[&_span]:border-cyan/20 [&_span]:border-t-cyan"
                        />
                        <span className="text-[10px] text-t3 font-mono">{t('dash.agentsActive')}</span>
                      </div>
                    )}
                  </div>
                  {normalization && (
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <SponsorBadge sponsors={['Qwen']} />
                      <span className="text-t3">&ldquo;{normalization.original}&rdquo;</span>
                      <span className="text-cyan">→</span>
                      <span className="text-t1">&ldquo;{normalization.normalized}&rdquo;</span>
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
                  agentStatuses={(() => {
                    const statuses: Record<string, 'active' | 'success' | 'error'> = {};
                    for (const [sid, r] of Object.entries(results)) {
                      if (r.status === 'success') statuses[sid] = 'success';
                      else if (r.status === 'error') statuses[sid] = 'error';
                    }
                    if (isSearching) {
                      for (const sid of Object.keys(streamingUrls)) {
                        if (!statuses[sid]) statuses[sid] = 'active';
                      }
                    }
                    return statuses;
                  })()}
                  agentResults={(() => {
                    const res: Record<string, { resultCount: number; price?: number }> = {};
                    for (const [sid, r] of Object.entries(results)) {
                      if (r.status === 'success') {
                        res[sid] = { resultCount: r.result_count, price: r.lowest_price ?? undefined };
                      }
                    }
                    return res;
                  })()}
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
                  tier3ScoutSpawnCount={scanSummary?.variants?.length ?? 0}
                  tier4AnalystActive={!!scanSummary && !analystVerdict}
                  tier4AnalystComplete={!!analystVerdict}
                  tier5InvestigationCount={0}
                  visible={isSearching || hasResults}
                />
                <PharmacyCards results={results} sparklines={sparklineData} />
                <AgentActivityFeed events={agentEvents} isActive={isSearching} />
                <ModelRouterPanel steps={modelSteps} isActive={isSearching} />
                {analystVerdict && (
                  <ActionLabel verdict={analystVerdict} signals={(scanSummary as any)?.confidence_scoring?.signals ?? null} />
                )}
                {scanSummary && (
                  <>
                    <SavingsBanner
                      bestPrice={scanSummary.best_price}
                      bestSource={scanSummary.best_source}
                      priceRange={scanSummary.price_range}
                      potentialSavings={scanSummary.potential_savings}
                      totalResults={scanSummary.total_results}
                    />
                    <VoiceSummary
                      query={scanSummary.query}
                      bestPrice={scanSummary.best_price}
                      bestSource={scanSummary.best_source}
                      potentialSavings={scanSummary.potential_savings}
                      totalResults={scanSummary.total_results}
                    />
                    <ComparisonBanner
                      searchTimeMs={searchTimeMs}
                      pharmacyCount={pharmaciesComplete}
                      productCount={productsFound}
                    />
                  </>
                )}
                {scanSummary?.price_fluctuations && scanSummary.price_fluctuations.length > 0 && (
                  <div className="rounded-lg border border-border bg-card/40 px-4 py-3">
                    <p className="text-xs font-mono text-t2 mb-2">{t('dash.fluctuationTitle')}</p>
                    <ul className="text-xs text-t3 space-y-1.5 list-disc list-inside">
                      {scanSummary.price_fluctuations.map((line: string, i: number) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(insightLoading || insight || insightError) && (
                  <div className="rounded-lg border border-cyan/30 bg-deep px-4 py-3">
                    <p className="text-xs font-mono text-cyan mb-2 flex items-center gap-2">{t('dash.insightTitle')} <SponsorBadge sponsors={['Supermemory']} /></p>
                    {insightLoading && (
                      <div className="flex items-center gap-2 text-xs text-t3">
                        <LoadingSpinner size="sm" />
                        <span>{t('dash.insightLoading')}</span>
                      </div>
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
                    <p className="text-[10px] font-mono text-cyan mb-2">{t('dash.variantsTitle')}</p>
                    <div className="flex gap-2 flex-wrap">
                      {scanSummary.variants.map((v) => (
                        <button
                          key={v}
                          onClick={() => handleSearch(v)}
                          disabled={isSearching}
                          className="px-2.5 py-1 text-[10px] bg-card text-cyan border border-cyan/30 rounded hover:bg-cyan/10 transition-colors disabled:opacity-50"
                        >
                          {t('dash.scanDrug', { name: v })}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <CeilingPanel compliance={(scanSummary as any)?.compliance ?? null} query={currentQuery} />
                <CounterfeitRiskPanel
                  anomalies={(scanSummary as any)?.price_anomalies ?? null}
                  risk={(scanSummary as any)?.counterfeit_risk ?? null}
                  investigations={investigationResults}
                />
                <PriceGrid results={results} bestPrice={scanSummary?.best_price ?? null} whoRef={scanSummary?.who_reference ?? null} />
                <DemoAlertTrigger
                  drugName={currentQuery || 'Metformin 500mg'}
                  bestPrice={scanSummary?.best_price ?? undefined}
                  bestSource={scanSummary?.best_source ?? undefined}
                />

            {scanSummary && (trendLoading || trendData.length > 0) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs font-mono text-t2">{t('dash.trendsTitle')}</p>
                  <Link
                    href={`/trends?q=${encodeURIComponent(scanSummary.query)}`}
                    className="text-xs text-cyan hover:underline font-mono"
                  >
                    {t('dash.trendsOpen')}
                  </Link>
                </div>
                {trendLoading && (
                  <div className="flex items-center gap-2 text-xs text-t3 font-mono">
                    <LoadingSpinner size="sm" />
                    <span>{t('dash.trendsLoading')}</span>
                  </div>
                )}
                {!trendLoading && trendError && (
                  <ApiErrorBanner message={trendError} onDismiss={() => setTrendError(null)} />
                )}
                {!trendLoading && trendData.length > 0 && <PricingChart data={trendData} />}
              </div>
            )}

            <div className="flex items-center gap-6 text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-cyan rounded-sm" />
                <span className="text-t2 font-mono">
                  {t('dash.chartAwp')}{' '}
                  <span className="text-t3">{t('dash.chartAwpDrug')}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-white/20 rounded-sm" />
                <span className="text-t2 font-mono">
                  {t('dash.chartWac')}{' '}
                  <span className="text-t3">{t('dash.chartWacDrug')}</span>
                </span>
              </div>
            </div>
          </div>
            ) : null}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
