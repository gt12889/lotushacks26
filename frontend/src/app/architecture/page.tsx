function ArchNode({ icon, name, desc, badge, color }: {
  icon: string;
  name: string;
  desc: string;
  badge?: string;
  color?: string;
}) {
  return (
    <div className="bioluminescent-card p-4 text-center w-full">
      <div className="text-2xl mb-1.5">{icon}</div>
      <h3
        className="font-bold text-sm font-mono"
        style={{ color: color || '#00DBE7', textShadow: `0 0 8px ${color || '#00DBE7'}40` }}
      >
        {name}
      </h3>
      <p className="text-[10px] text-t2 mt-0.5">{desc}</p>
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
        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-t1">System Architecture</h2>
          <p className="text-xs text-t3 mt-1">End-to-end data flow of the MediScrape intelligence platform</p>
        </div>

        {/* 3-Column Architecture Flow */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-0">
          {/* Column 1: Input */}
          <div className="flex flex-col items-center gap-0">
            <ArchNode icon="👤" name="User" desc="Drug search query" color="#D6E3FF" />
            <VerticalConnector />
            <ArchNode icon="⚛️" name="Next.js Frontend" desc="Real-time SSE dashboard" badge="React 19 + Tailwind v4" color="#00DBE7" />
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
            <ArchNode icon="⚡" name="FastAPI Backend" desc="Async orchestration hub" badge="Python + SSE" color="#00DBE7" />
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
            <ArchNode icon="🐟" name="TinyFish" desc="5 parallel stealth agents" badge="tinyfish.ai" color="#F97316" />
            <ArchNode icon="🌐" name="BrightData" desc="Proxy + anti-bot bypass" badge="brightdata.com" color="#22C55E" />
            <ArchNode icon="🔍" name="Exa" desc="Drug intelligence & WHO pricing" badge="exa.ai" color="#A855F7" />
            <ArchNode icon="🤖" name="OpenRouter" desc="Qwen / OpenAI model routing" badge="openrouter.ai" color="#F97316" />
            <ArchNode icon="🔊" name="ElevenLabs" desc="Voice alerts" badge="elevenlabs.io" color="#2DD4BF" />
            <ArchNode icon="💬" name="Discord" desc="Webhook notifications" badge="discord.com" color="#3B82F6" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: '5', label: 'Parallel Agents', desc: 'Simultaneous pharmacy searches' },
            { value: '<30s', label: 'Average Response', desc: 'Full results from all sources' },
            { value: '5', label: 'Pharmacy Chains', desc: '3,700+ stores covered' },
          ].map((m) => (
            <div key={m.label} className="bioluminescent-card p-6 text-center">
              <div className="text-3xl font-bold font-mono text-cyan">{m.value}</div>
              <div className="text-xs font-bold text-t1 mt-2">{m.label}</div>
              <div className="text-[10px] text-t3 mt-1">{m.desc}</div>
            </div>
          ))}
        </div>

        {/* Technology Stack */}
        <div className="bioluminescent-card p-6">
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
      </div>
    </div>
  );
}
