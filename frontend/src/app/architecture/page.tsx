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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

function ArchNode({ Icon, name, desc, badge, color }: {
  Icon: LucideIcon;
  name: string;
  desc: string;
  badge?: string;
  color?: string;
}) {
  const c = color || '#00DBE7';
  return (
    <div className="bioluminescent-card interactive-lift p-4 text-center w-full transition-shadow">
      <div className="flex justify-center mb-1.5">
        <Icon size={24} color={c} strokeWidth={1.5} />
      </div>
      <h3
        className="font-bold text-sm font-mono"
        style={{ color: c, textShadow: `0 0 8px ${c}20` }}
      >
        {name}
      </h3>
      <p className="text-xs text-t2 mt-0.5">{desc}</p>
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

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        <ScrollReveal direction="scale" className="text-center">
          <h2 className="text-xl font-bold text-t1">System Architecture</h2>
          <p className="text-xs text-t3 mt-1">End-to-end data flow of the Megladon MD intelligence platform</p>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={40}>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-0">
          {/* Column 1: Input */}
          <div className="flex flex-col items-center gap-0">
            <ArchNode Icon={User} name="User" desc="Drug search query" color="#D6E3FF" />
            <VerticalConnector />
            <ArchNode Icon={Monitor} name="Next.js Frontend" desc="Real-time SSE dashboard" badge="React 19 + Tailwind v4" color="#00DBE7" />
          </div>

          {/* Horizontal connector 1→2 */}
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

          {/* Column 2: Orchestration */}
          <div className="flex flex-col items-center justify-center">
            <ArchNode Icon={Zap} name="FastAPI Backend" desc="Async orchestration hub" badge="Python + SSE" color="#00DBE7" />
          </div>

          {/* Horizontal connector 2→3 */}
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

          {/* Column 3: Services */}
          <div className="flex flex-col items-center gap-2">
            <ArchNode Icon={Fish} name="TinyFish" desc="5 parallel stealth agents" badge="tinyfish.ai" color="#F97316" />
            <ArchNode Icon={Globe} name="BrightData" desc="Proxy + anti-bot bypass" badge="brightdata.com" color="#22C55E" />
            <ArchNode Icon={Search} name="Exa" desc="Drug intelligence & WHO pricing" badge="exa.ai" color="#A855F7" />
            <ArchNode Icon={Bot} name="OpenRouter" desc="Qwen / OpenAI model routing" badge="openrouter.ai" color="#F97316" />
            <ArchNode Icon={Volume2} name="ElevenLabs" desc="Voice alerts" badge="elevenlabs.io" color="#2DD4BF" />
            <ArchNode Icon={MessageCircle} name="Discord" desc="Webhook notifications" badge="discord.com" color="#3B82F6" />
          </div>
        </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={80}>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: '5', label: 'Parallel Agents', desc: 'Simultaneous pharmacy searches' },
            { value: '<30s', label: 'Average Response', desc: 'Full results from all sources' },
            { value: '5', label: 'Pharmacy Chains', desc: '3,700+ stores covered' },
          ].map((m) => (
            <div key={m.label} className="bioluminescent-card interactive-lift p-6 text-center transition-shadow">
              <div className="text-3xl font-bold font-mono text-cyan">{m.value}</div>
              <div className="text-xs font-bold text-t1 mt-2">{m.label}</div>
              <div className="text-xs text-t3 mt-1">{m.desc}</div>
            </div>
          ))}
        </div>
        </ScrollReveal>

        <ScrollReveal direction="left" delay={60}>
        <div className="bioluminescent-card p-6 interactive-lift">
          <h3 className="text-xs font-bold text-cyan uppercase tracking-wider mb-4">Technology Stack</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-t1 font-bold">Frontend:</span>
              <span className="text-t2 ml-2">Next.js 16, React 19, Tailwind CSS v4, Recharts</span>
            </div>
            <div>
              <span className="text-t1 font-bold">Backend:</span>
              <span className="text-t2 ml-2">FastAPI, Server-Sent Events, SQLite</span>
            </div>
            <div>
              <span className="text-t1 font-bold">AI Agents:</span>
              <span className="text-t2 ml-2">TinyFish parallel web agents with structured extraction</span>
            </div>
            <div>
              <span className="text-t1 font-bold">Intelligence:</span>
              <span className="text-t2 ml-2">Exa semantic search, OpenRouter model routing, ElevenLabs voice</span>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
