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
  Camera,
  Database,
  Eye,
  Layers,
  Phone,
  ArrowDown,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function Node({
  Icon,
  name,
  desc,
  color = '#00DBE7',
}: {
  Icon: LucideIcon;
  name: string;
  desc: string;
  color?: string;
}) {
  return (
    <div className="panel p-4 text-center w-full">
      <div className="flex justify-center mb-1.5">
        <Icon size={22} color={color} strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-medium" style={{ color }}>{name}</h3>
      <p className="text-[11px] text-t3 mt-0.5 leading-tight">{desc}</p>
    </div>
  );
}

function Arrow({ direction = 'down' }: { direction?: 'down' | 'right' }) {
  const Icon = direction === 'right' ? ArrowRight : ArrowDown;
  return (
    <div className="flex justify-center py-1 px-2">
      <Icon size={16} className="text-cyan/40" strokeWidth={1.5} />
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-t1">How It Works</h2>
          <p className="text-sm text-t3 mt-1">
            End-to-end data flow of the Megalodon MD platform
          </p>
        </div>

        {/* ── High-Level Flow ── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1">
          {/* Input */}
          <div className="flex flex-col items-center gap-1">
            <Node Icon={User} name="User" desc="Search, voice, or prescription upload" color="#D6E3FF" />
            <Arrow />
            <Node Icon={Monitor} name="Next.js Frontend" desc="Real-time SSE dashboard" color="#00DBE7" />
          </div>

          <Arrow direction="right" />

          {/* Orchestration */}
          <div className="flex flex-col items-center gap-2">
            <Node Icon={Zap} name="FastAPI Backend" desc="Async orchestration, 20+ endpoints" color="#00DBE7" />
            <Node Icon={Database} name="SQLite" desc="Prices, alerts, monitors, gov ceilings" color="#94A3B8" />
          </div>

          <Arrow direction="right" />

          {/* Services */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { Icon: Fish, name: 'TinyFish', desc: '5 parallel stealth agents', color: '#F97316' },
              { Icon: Globe, name: 'BrightData', desc: 'Proxy + anti-bot', color: '#22C55E' },
              { Icon: Search, name: 'Exa', desc: 'Drug intelligence', color: '#A855F7' },
              { Icon: Bot, name: 'OpenRouter', desc: 'LLM routing', color: '#F97316' },
              { Icon: Volume2, name: 'ElevenLabs', desc: 'Vietnamese TTS', color: '#2DD4BF' },
              { Icon: MessageCircle, name: 'Discord', desc: 'Alert webhooks', color: '#3B82F6' },
              { Icon: Brain, name: 'Supermemory', desc: 'Search recall', color: '#EC4899' },
              { Icon: Camera, name: 'GPT-4o', desc: 'Prescription OCR', color: '#10B981' },
              { Icon: Phone, name: 'Twilio', desc: 'Voice call alerts', color: '#EE4042' },
            ].map((s) => (
              <div key={s.name} className="panel p-2.5 text-center">
                <s.Icon size={16} color={s.color} strokeWidth={1.5} className="mx-auto mb-1" />
                <div className="text-xs font-medium" style={{ color: s.color }}>{s.name}</div>
                <div className="text-[10px] text-t3">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 6-Tier Agent Cascade ── */}
        <div className="panel p-6">
          <h3 className="text-xs text-t2 mb-4">6-Tier Agent Cascade</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { tier: 'T1', name: 'OCR', desc: 'Prescription extraction', sub: 'GPT-4o Vision', color: '#10B981' },
              { tier: 'T2', name: 'Search', desc: '5 parallel pharmacy agents', sub: 'TinyFish', color: '#F97316' },
              { tier: 'T3', name: 'Variant', desc: 'Generic discovery', sub: 'Exa', color: '#A855F7' },
              { tier: 'T4', name: 'Scout', desc: 'Variant re-search', sub: 'TinyFish spawn', color: '#00DBE7' },
              { tier: 'T5', name: 'Analyst', desc: 'Cross-validation', sub: 'Qwen 2.5 72B', color: '#F97316' },
              { tier: 'T6', name: 'Investigator', desc: 'Anomaly verification', sub: 'Exa + LLM', color: '#EE4042' },
            ].map((t) => (
              <div key={t.tier} className="text-center">
                <div className="text-[10px] text-t3 mb-1">{t.tier}</div>
                <div className="text-sm font-medium" style={{ color: t.color }}>{t.name}</div>
                <div className="text-[11px] text-t2 mt-0.5">{t.desc}</div>
                <div className="text-[10px] text-t3 mt-1">{t.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Intelligence + Monitors side by side ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Intelligence */}
          <div className="panel p-5">
            <h3 className="text-xs text-t2 mb-3">Intelligence</h3>
            <div className="space-y-2.5">
              {[
                { name: 'Confidence Scoring', desc: '5-signal weighted score (0–100) across source agreement, price convergence, compliance, anomalies, and variant coverage' },
                { name: 'Counterfeit Detection', desc: 'Exa-powered anomaly flagging for suspicious pricing and regulatory risk' },
                { name: 'Gov Ceiling Compliance', desc: 'DAV price ceiling checks against registered drug categories' },
                { name: 'NL Query Parsing', desc: 'Natural language → structured drug list with condition mapping' },
                { name: 'Variant Discovery', desc: 'Exa finds generics + branded alternatives per pharmacy' },
                { name: 'Price Fluctuation', desc: 'Per-source trend detection vs historical observations' },
              ].map((f) => (
                <div key={f.name}>
                  <div className="text-xs text-t1">{f.name}</div>
                  <div className="text-[11px] text-t3 leading-snug">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Proactive Monitors */}
          <div className="panel p-5">
            <h3 className="text-xs text-t2 mb-3">Proactive Monitors</h3>
            <div className="space-y-3">
              {[
                { name: 'Price Drop Detection', trigger: '≥10% decrease', action: 'Discord + Twilio call', color: '#2DD4BF' },
                { name: 'Anomaly Watchdog', trigger: '>2 SD below mean', action: 'Counterfeit warning', color: '#EE4042' },
                { name: 'Compliance Violation', trigger: 'Exceeds DAV ceiling', action: 'Auto-report', color: '#F97316' },
              ].map((b) => (
                <div key={b.name} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: b.color }} />
                  <div>
                    <div className="text-xs text-t1">{b.name}</div>
                    <div className="text-[11px] text-t3">{b.trigger} → {b.action}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="text-xs text-t2 mb-3">Alert Channels</h3>
              <div className="space-y-2">
                {[
                  { Icon: MessageCircle, name: 'Discord', desc: 'Webhook with Vietnamese voice note attachment', color: '#3B82F6' },
                  { Icon: Phone, name: 'Twilio', desc: 'Phone call with ElevenLabs audio playback', color: '#EE4042' },
                  { Icon: Volume2, name: 'ElevenLabs', desc: 'Vietnamese TTS for both channels', color: '#2DD4BF' },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-2.5">
                    <c.Icon size={14} color={c.color} strokeWidth={1.5} />
                    <div>
                      <span className="text-xs text-t1">{c.name}</span>
                      <span className="text-[11px] text-t3 ml-2">{c.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '5', label: 'Parallel Agents' },
            { value: '<30s', label: 'Avg Response' },
            { value: '3,700+', label: 'Stores Covered' },
            { value: '20+', label: 'API Endpoints' },
          ].map((m) => (
            <div key={m.label} className="panel p-4 text-center">
              <div className="text-2xl font-bold font-mono text-cyan">{m.value}</div>
              <div className="text-xs text-t3 mt-1">{m.label}</div>
            </div>
          ))}
        </div>

        {/* ── Tech Stack ── */}
        <div className="panel p-5">
          <h3 className="text-xs text-t2 mb-3">Technology Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs">
            {[
              ['Frontend', 'Next.js 16, React 19, Tailwind v4, Recharts'],
              ['Backend', 'FastAPI, SSE, APScheduler, aiosqlite'],
              ['Web Agents', 'TinyFish stealth agents + BrightData proxy'],
              ['Intelligence', 'Exa semantic search, WHO pricing, counterfeit detection'],
              ['LLM', 'OpenRouter (Qwen 2.5 72B, GPT-4o, Claude)'],
              ['OCR', 'GPT-4o Vision with function calling'],
              ['Voice', 'ElevenLabs multilingual v2 + Twilio calls'],
              ['Memory', 'Supermemory hybrid search + recall'],
              ['Alerts', 'Discord webhooks + Twilio voice calls'],
              ['i18n', 'EN/VI locale toggle, 150+ keys'],
              ['Voice Input', 'Web Speech API (vi-VN)'],
              ['Deploy', 'Docker + Railway'],
            ].map(([label, tech]) => (
              <div key={label}>
                <span className="text-t1">{label}:</span>
                <span className="text-t3 ml-1.5">{tech}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Sponsors ── */}
        <div className="panel p-5">
          <h3 className="text-xs text-t2 mb-3">Sponsor Integrations</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2.5 text-xs">
            {[
              { name: 'TinyFish', role: '5 parallel stealth scrapers + batch API', color: '#F97316' },
              { name: 'BrightData', role: 'Proxy for 3 chains with anti-bot bypass', color: '#22C55E' },
              { name: 'Exa', role: 'Drug variants, WHO pricing, counterfeit risk', color: '#A855F7' },
              { name: 'OpenRouter', role: 'LLM routing — normalization, analysis, insights', color: '#F97316' },
              { name: 'ElevenLabs', role: 'Vietnamese voice alerts + summaries', color: '#2DD4BF' },
              { name: 'Discord', role: 'Price alerts + anomaly warnings', color: '#3B82F6' },
              { name: 'Supermemory', role: 'Cross-session search recall', color: '#EC4899' },
              { name: 'OpenAI', role: 'GPT-4o Vision prescription OCR', color: '#10B981' },
              { name: 'Twilio', role: 'Voice call alerts on price changes', color: '#EE4042' },
            ].map((s) => (
              <div key={s.name} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: s.color }} />
                <div>
                  <span className="text-t1 font-medium">{s.name}</span>
                  <span className="text-t3 ml-1.5">{s.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
