'use client';

import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import SearchBar from '@/components/SearchBar';
import PharmacyCards from '@/components/PharmacyCards';
import PriceGrid from '@/components/PriceGrid';
import SavingsBanner from '@/components/SavingsBanner';
import MegalodonAlert from '@/components/MegalodonAlert';
import StatusPill from '@/components/StatusPill';
import SonarFilters from '@/components/SonarFilters';

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

// Memory feature from remote
const MEMORY_USER_KEY = 'mediscrapeMemoryUser';

function ensureMemoryUserId(): string {
  let id = localStorage.getItem(MEMORY_USER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(MEMORY_USER_KEY, id);
  }
  return id;
}

// Mock data matching the SVG design
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
    wac: 388.90,
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
    awp: 1245.00,
    wac: 920.40,
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
    awp: 118.50,
    wac: 105.20,
    change: '0.0%',
    changeDir: 'flat' as const,
    status: 'monitor',
    statusLabel: 'MONITOR',
    agentStatus: null,
    latency: null,
    node: null,
  },
];

export default function Home() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Record<string, PharmacyResult>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [memoryHints, setMemoryHints] = useState<string[]>([]);
  const [syncTime, setSyncTime] = useState('');

  const fetchMemoryHints = useCallback(async (q: string, userId: string) => {
    if (!q.trim()) { setMemoryHints([]); return; }
    try {
      const r = await fetch(`${API_URL}/api/memory/recall?q=${encodeURIComponent(q.trim())}&user=${encodeURIComponent(userId)}`);
      if (!r.ok) { setMemoryHints([]); return; }
      const data = await r.json();
      if (data.enabled && Array.isArray(data.snippets) && data.snippets.length > 0) {
        setMemoryHints(data.snippets);
      } else {
        setMemoryHints([]);
      }
    } catch {
      setMemoryHints([]);
    }
  }, []);

  useEffect(() => {
    const update = () => setSyncTime(
      new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })
    );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setResults({});
    setSummary(null);
    setCurrentQuery(query);
    try {
      const memoryUserId = ensureMemoryUserId();
      await fetchMemoryHints(query, memoryUserId);

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
            if (event.task === 'summary') setSummary(event);
            else if (event.source_id) setResults(prev => ({ ...prev, [event.source_id]: event }));
          } catch {}
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
    <div className="min-h-screen flex flex-col">
      {/* Megalodon Alert Bar */}
      <MegalodonAlert
        drugName="Lisinopril 20mg (NDC: 00406-0512-01)"
        message="spiked by 420% in 24h. Manual review recommended."
      />

      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-t1 tracking-tight">
                Price Tracker: <span className="text-cyan">The Abyss</span>
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
                onClick={() => currentQuery ? handleSearch(currentQuery) : null}
                className="px-3 py-1.5 text-[10px] border border-cyan/40 text-cyan rounded hover:bg-cyan/10 transition-all hover:border-cyan font-mono uppercase tracking-wider"
              >
                Deploy New Probe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Content + Sidebar */}
      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="p-6 space-y-5">

            {/* Supermemory hints */}
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

            {/* Search */}
            <SearchBar onSearch={handleSearch} isSearching={isSearching} />

            {/* Live results when searching */}
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
                  <div className="bg-deep border border-cyan/20 rounded-lg p-3">
                    <p className="text-[10px] font-mono text-cyan mb-2">Generic alternatives detected:</p>
                    <div className="flex gap-2 flex-wrap">
                      {summary.variants.map((v) => (
                        <button key={v} onClick={() => handleSearch(v)} disabled={isSearching}
                          className="px-2.5 py-1 text-[10px] bg-card text-cyan border border-cyan/30 rounded hover:bg-cyan/10 transition-colors disabled:opacity-50">
                          Scan &ldquo;{v}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <PriceGrid results={results} bestPrice={summary?.best_price ?? null} />
              </div>
            )}

            {/* Chart Legend */}
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

            {/* Price Chart */}
            <div className="bg-abyss rounded-lg overflow-hidden" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pricing Abyss Index Table */}
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
                    <div className={`text-[12px] font-mono font-bold ${
                      row.changeDir === 'up-critical' ? 'text-alert-red' :
                      row.changeDir === 'up' ? 'text-success' : 'text-t3'
                    }`}>
                      {row.change}
                    </div>
                    <div>
                      {row.changeDir === 'up-critical' ? (
                        <svg className="w-4 h-4 text-alert-red" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" />
                        </svg>
                      ) : row.changeDir === 'up' ? (
                        <svg className="w-4 h-4 text-success" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" />
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
                      <span className="text-[8px] text-t3 font-mono uppercase tracking-wider">Distributed Agent Network</span>
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
                        Price trajectories are currently calculated using <span className="text-t2">14.2M</span> data points across <span className="text-t2">42</span> wholesale hubs.
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer info bar */}
            <div className="flex items-center justify-between pt-3 border-t border-border/30">
              <div className="flex gap-5 text-[9px] text-t3 font-mono">
                <span className="hover:text-t2 cursor-pointer transition-colors">Privacy Protocol</span>
                <span className="hover:text-t2 cursor-pointer transition-colors">Abyssal Methodology</span>
                <span className="hover:text-t2 cursor-pointer transition-colors">Source Oracle</span>
              </div>
              <span className="text-[9px] text-t3 font-mono">
                System Synchronized: {syncTime} UTC
              </span>
            </div>

          </div>
        </div>

        {/* Sonar Filters Sidebar */}
        <SonarFilters />
      </div>
    </div>
  );
}
