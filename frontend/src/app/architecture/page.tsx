'use client';

import {
  User,
  Monitor,
  Zap,
  Fish,
  Globe,
  Search,
  Bot,
  Volume2,
  MessageCircle,
  Brain,
  Shield,
  Camera,
  BarChart3,
  Bell,
  Gauge,
  Database,
  Languages,
  Mic,
  Activity,
  Eye,
  Scale,
  TrendingUp,
  FileText,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

/* ── reusable pieces ─────────────────────────────────────────────── */

function ArchNode({
  Icon,
  name,
  desc,
  badge,
  color,
  small,
}: {
  Icon: LucideIcon;
  name: string;
  desc: string;
  badge?: string;
  color?: string;
  small?: boolean;
}) {
  const c = color || '#00DBE7';
  return (
    <div className={`bioluminescent-card interactive-lift ${small ? 'p-3' : 'p-4'} text-center w-full transition-shadow`}>
      <div className="flex justify-center mb-1.5">
        <Icon size={small ? 18 : 24} color={c} strokeWidth={1.5} />
      </div>
      <h3
        className={`font-bold ${small ? 'text-xs' : 'text-sm'} font-mono`}
        style={{ color: c, textShadow: `0 0 8px ${c}20` }}
      >
        {name}
      </h3>
      <p className="text-[10px] text-t2 mt-0.5 leading-tight">{desc}</p>
      {badge && (
        <p className="text-[8px] text-t3/60 font-mono mt-1 tracking-wide">{badge}</p>
      )}
    </div>
  );
}

function VerticalConnector() {
  return (
    <div className="flex justify-center py-1">
      <div
        className="w-[2px] h-6"
        style={{ background: 'linear-gradient(to bottom, transparent, #00DBE7, transparent)' }}
      />
    </div>
  );
}

function HorizontalConnector() {
  return (
    <div className="flex items-center px-2">
      <div
        className="h-[2px] w-12"
        style={{
          background: 'linear-gradient(90deg, transparent, #00DBE7, transparent)',
          backgroundSize: '200% 100%',
          animation: 'flowPulse 2s linear infinite',
        }}
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold text-cyan uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

/* ── page ─────────────────────────────────────────────────────────── */

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        <ScrollReveal direction="scale" className="text-center">
          <h2 className="text-xl font-bold text-t1">System Architecture</h2>
          <p className="text-xs text-t3 mt-1">End-to-end data flow of the Megalodon MD intelligence platform</p>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={40}>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-0">
          {/* Column 1: Input */}
          <div className="flex flex-col items-center gap-0">
            <ArchNode Icon={User} name="User" desc="Drug search, voice, or prescription upload" color="#D6E3FF" />
            <VerticalConnector />
            <ArchNode
              Icon={Monitor}
              name="Next.js 16 Frontend"
              desc="Real-time SSE dashboard with 6 pages"
              badge="React 19 · Tailwind v4 · Recharts"
              color="#00DBE7"
            />
          </div>

          <HorizontalConnector />

          {/* Column 2: Orchestration */}
          <div className="flex flex-col items-center gap-2">
            <ArchNode
              Icon={Zap}
              name="FastAPI Backend"
              desc="Async orchestration hub with 20+ endpoints"
              badge="Python · SSE · APScheduler"
              color="#00DBE7"
            />
            <ArchNode
              Icon={Database}
              name="SQLite"
              desc="Prices, alerts, monitors, gov ceilings"
              badge="aiosqlite · 893+ records"
              color="#94A3B8"
            />
          </div>

          <HorizontalConnector />

          {/* Column 3: External Services */}
          <div className="flex flex-col items-center gap-2">
            <ArchNode Icon={Fish} name="TinyFish" desc="5 parallel stealth web agents" badge="tinyfish.ai · /run + /run-batch" color="#F97316" />
            <ArchNode Icon={Globe} name="BrightData" desc="Proxy + anti-bot bypass" badge="brightdata.com · 3 pharmacy chains" color="#22C55E" />
            <ArchNode Icon={Search} name="Exa" desc="Drug variants, WHO pricing, counterfeit risk" badge="exa.ai · semantic search" color="#A855F7" />
            <ArchNode Icon={Bot} name="OpenRouter" desc="Qwen 2.5 72B + GPT-4o + Claude fallback" badge="openrouter.ai · model routing" color="#F97316" />
            <ArchNode Icon={Volume2} name="ElevenLabs" desc="Vietnamese TTS voice alerts" badge="elevenlabs.io · multilingual v2" color="#2DD4BF" />
            <ArchNode Icon={MessageCircle} name="Discord" desc="Webhook price alerts + audio" badge="discord.com · markdown + attachments" color="#3B82F6" />
            <ArchNode Icon={Brain} name="Supermemory" desc="Cross-session search recall" badge="supermemory.ai · hybrid search" color="#EC4899" />
            <ArchNode Icon={Camera} name="GPT-4o Vision" desc="Prescription OCR with function calling" badge="openai.com · structured extraction" color="#10B981" />
          </div>
        </div>
        </ScrollReveal>

        {/* ── 6-Tier Agent Cascade ───────────────────────────────── */}
        <div className="bioluminescent-card p-6">
          <SectionTitle>6-Tier Agent Cascade</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {[
              { Icon: Camera, name: 'OCR', desc: 'Prescription extraction', color: '#10B981' },
              { Icon: Fish, name: 'Search', desc: '5 parallel pharmacy agents', color: '#F97316' },
              { Icon: Layers, name: 'Variant', desc: 'Exa generic discovery', color: '#A855F7' },
              { Icon: Search, name: 'Scout', desc: 'Variant re-search per chain', color: '#00DBE7' },
              { Icon: Bot, name: 'Analyst', desc: 'LLM cross-validation', color: '#F97316' },
              { Icon: Eye, name: 'Investigator', desc: 'Anomaly price verification', color: '#EE4042' },
            ].map((tier, i) => (
              <div key={tier.name} className="relative">
                <ArchNode Icon={tier.Icon} name={`T${i + 1}: ${tier.name}`} desc={tier.desc} color={tier.color} small />
              </div>
            ))}
          </div>
        </div>

        {/* ── Dashboard Features ─────────────────────────────────── */}
        <div className="bioluminescent-card p-6">
          <SectionTitle>Dashboard Components</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { Icon: Search, name: 'SearchBar', desc: 'Text + voice input (vi-VN)', color: '#00DBE7' },
              { Icon: Fish, name: 'PharmacyCards', desc: '5 chain result cards + sparklines', color: '#F97316' },
              { Icon: BarChart3, name: 'PriceGrid', desc: 'Sortable product table + anomaly flags', color: '#2DD4BF' },
              { Icon: Activity, name: 'AgentFeed', desc: 'Terminal-style event log', color: '#00DBE7' },
              { Icon: Gauge, name: 'LiveMetrics', desc: 'KPI counters: agents, products, savings', color: '#F97316' },
              { Icon: Layers, name: 'AgentCascade', desc: '6-tier visual pipeline', color: '#A855F7' },
              { Icon: Bot, name: 'ModelRouter', desc: 'Model step tracking + latency bars', color: '#F97316' },
              { Icon: Shield, name: 'AnalystVerdict', desc: '5-signal confidence breakdown', color: '#2DD4BF' },
              { Icon: TrendingUp, name: 'PricingChart', desc: '7/30/90D price history (Recharts)', color: '#00DBE7' },
              { Icon: Eye, name: 'CounterfeitRisk', desc: 'Anomaly + regulatory warnings', color: '#EE4042' },
              { Icon: Scale, name: 'CeilingPanel', desc: 'Gov price compliance check', color: '#22C55E' },
              { Icon: Volume2, name: 'VoiceSummary', desc: 'ElevenLabs audio playback', color: '#2DD4BF' },
              { Icon: Globe, name: 'LivePreview', desc: 'Agent status + streaming URLs', color: '#3B82F6' },
              { Icon: MessageCircle, name: 'DemoAlert', desc: 'Discord test notification', color: '#3B82F6' },
              { Icon: Brain, name: 'SavingsBanner', desc: 'Best price + procurement projection', color: '#EC4899' },
              { Icon: FileText, name: 'ComparisonBanner', desc: 'Search timing + result stats', color: '#94A3B8' },
            ].map((comp) => (
              <ArchNode key={comp.name} Icon={comp.Icon} name={comp.name} desc={comp.desc} color={comp.color} small />
            ))}
          </div>
        </div>

        {/* ── Pages ──────────────────────────────────────────────── */}
        <div className="bioluminescent-card p-6">
          <SectionTitle>Application Pages</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { Icon: Globe, name: 'Landing', desc: 'Hero, live stats, features, infrastructure', color: '#00DBE7' },
              { Icon: Search, name: 'Dashboard', desc: 'Main search hub with full agent cascade', color: '#F97316' },
              { Icon: TrendingUp, name: 'Trends', desc: 'Single drug + AI multi-search analysis', color: '#2DD4BF' },
              { Icon: Bell, name: 'Alerts', desc: 'Price alerts + proactive monitors', color: '#EE4042' },
              { Icon: Gauge, name: 'Optimize', desc: 'Prescription OCR + multi-drug sourcing', color: '#A855F7' },
              { Icon: Layers, name: 'Architecture', desc: 'This page — system diagram', color: '#94A3B8' },
            ].map((page) => (
              <ArchNode key={page.name} Icon={page.Icon} name={page.name} desc={page.desc} color={page.color} small />
            ))}
          </div>
        </div>

        {/* ── Intelligence Features ──────────────────────────────── */}
        <div className="bioluminescent-card p-6">
          <SectionTitle>Intelligence & Analysis</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {[
              { name: 'Confidence Scoring', desc: 'Source agreement (30) + price convergence (20) + compliance (15) + anomaly-free (20) + variant coverage (15) = 100pt scale' },
              { name: 'Counterfeit Detection', desc: 'Exa-powered anomaly flagging for suspicious pricing patterns and regulatory risk assessment' },
              { name: 'Gov Ceiling Compliance', desc: 'DAV (Dept of Administration) price ceiling checks against 5+ registered drug categories' },
              { name: 'NL Query Parsing', desc: 'Natural language → structured drug list. Maps conditions (diabetes, hypertension) to first-line drugs' },
              { name: 'Variant Discovery', desc: 'Exa semantic search finds generics + branded alternatives per pharmacy per drug' },
              { name: 'Price Fluctuation', desc: 'Per-source trend detection comparing current scan vs historical DB observations' },
            ].map((feat) => (
              <div key={feat.name} className="bioluminescent-card p-3">
                <div className="text-cyan font-bold font-mono text-[11px]">{feat.name}</div>
                <div className="text-t3 text-[10px] mt-1 leading-tight">{feat.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Proactive Monitor Behaviors ─────────────────────────── */}
        <div className="bioluminescent-card p-6">
          <SectionTitle>Proactive Monitor Behaviors</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {[
              { name: 'Price Drop Detection', desc: '≥10% decrease triggers Discord alert with comparison data', color: '#2DD4BF' },
              { name: 'Anomaly Watchdog', desc: '>2 standard deviations below mean → counterfeit warning alert', color: '#EE4042' },
              { name: 'Compliance Violation', desc: 'Exceeds DAV ceiling price → auto-report to configured channel', color: '#F97316' },
            ].map((b) => (
              <div key={b.name} className="bioluminescent-card p-3">
                <div className="font-bold font-mono text-[11px]" style={{ color: b.color }}>{b.name}</div>
                <div className="text-t3 text-[10px] mt-1 leading-tight">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats Row ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '5', label: 'Parallel Agents', desc: 'Simultaneous pharmacy searches' },
            { value: '<30s', label: 'Avg Response', desc: 'Full results from all sources' },
            { value: '3,700+', label: 'Stores Covered', desc: 'Across 5 pharmacy chains' },
            { value: '20+', label: 'API Endpoints', desc: 'Search, optimize, alerts, trends...' },
          ].map((m) => (
            <div key={m.label} className="bioluminescent-card interactive-lift p-5 text-center transition-shadow">
              <div className="text-2xl font-bold font-mono text-cyan">{m.value}</div>
              <div className="text-xs font-bold text-t1 mt-2">{m.label}</div>
              <div className="text-[10px] text-t3 mt-1">{m.desc}</div>
            </div>
          ))}
        </div>

        {/* ── Technology Stack ────────────────────────────────────── */}
        <div className="bioluminescent-card p-6 interactive-lift">
          <SectionTitle>Technology Stack</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-t1 font-bold">Frontend:</span>
              <span className="text-t2 ml-2">Next.js 16, React 19, Tailwind CSS v4, Recharts</span>
            </div>
            <div>
              <span className="text-t1 font-bold">Backend:</span>
              <span className="text-t2 ml-2">FastAPI, SSE, APScheduler, aiosqlite</span>
            </div>
            <div>
              <span className="text-t1 font-bold">Web Agents:</span>
              <span className="text-t2 ml-2">TinyFish parallel stealth agents + BrightData proxy</span>
            </div>
            <div>
              <span className="text-t1 font-bold">Intelligence:</span>
              <span className="text-t2 ml-2">Exa semantic search, WHO pricing, counterfeit detection</span>
            </div>
            <div>
              <span className="text-t1 font-bold">LLM Routing:</span>
              <span className="text-t2 ml-2">OpenRouter (Qwen 2.5 72B, GPT-4o, Claude fallback)</span>
            </div>
            <div>
              <span className="text-t1 font-bold">OCR:</span>
              <span className="text-t2 ml-2">GPT-4o Vision with function calling</span>
            </div>
            <div>
              <span className="text-t1 font-bold">Voice:</span>
              <span className="text-t2 ml-2">ElevenLabs multilingual v2 (Vietnamese TTS)</span>
            </div>
            <div>
              <span className="text-t1 font-bold">Memory:</span>
              <span className="text-t2 ml-2">Supermemory hybrid search + context recall</span>
            </div>
            <div>
              <span className="text-t1 font-bold">Alerts:</span>
              <span className="text-t2 ml-2">Discord webhooks + voice note attachments</span>
            </div>
            <div>
              <span className="text-t1 font-bold">i18n:</span>
              <span className="text-t2 ml-2">EN/VI locale toggle, 150+ translated keys</span>
            </div>
            <div>
              <span className="text-t1 font-bold">Voice Input:</span>
              <span className="text-t2 ml-2">Web Speech API (vi-VN), browser-native</span>
            </div>
            <div>
              <span className="text-t1 font-bold">Deploy:</span>
              <span className="text-t2 ml-2">Docker + Railway, Nixpacks fallback</span>
            </div>
          </div>
        </div>

        {/* ── Sponsor Integration Map ────────────────────────────── */}
        <div className="bioluminescent-card p-6">
          <SectionTitle>Sponsor Integration Map</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { name: 'TinyFish', role: 'Core agent infra — 5 parallel stealth scrapers + batch API', color: '#F97316' },
              { name: 'BrightData', role: 'Proxy layer for 3 chains with anti-bot bypass', color: '#22C55E' },
              { name: 'Exa', role: 'Drug variants, WHO pricing, counterfeit risk, drug info', color: '#A855F7' },
              { name: 'OpenRouter', role: 'LLM routing — normalization, analysis, NL parsing, insights', color: '#F97316' },
              { name: 'ElevenLabs', role: 'Vietnamese voice alerts + search summaries', color: '#2DD4BF' },
              { name: 'Discord', role: 'Price alerts, anomaly warnings, compliance violations', color: '#3B82F6' },
              { name: 'Supermemory', role: 'Cross-session drug search recall + personalization', color: '#EC4899' },
              { name: 'OpenAI', role: 'GPT-4o Vision prescription OCR + structured extraction', color: '#10B981' },
            ].map((s) => (
              <div key={s.name} className="bioluminescent-card p-3 text-center">
                <div className="font-bold font-mono text-[11px]" style={{ color: s.color }}>{s.name}</div>
                <div className="text-t3 text-[10px] mt-1 leading-tight">{s.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
