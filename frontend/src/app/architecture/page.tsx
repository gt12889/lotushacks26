export default function ArchitecturePage() {
  const steps = [
    { icon: '👤', label: 'User', desc: 'Searches for a drug', color: '#D6E3FF' },
    { icon: '🖥️', label: 'Next.js Frontend', desc: 'Sends SSE request', color: '#00DBE7' },
    { icon: '⚙️', label: 'FastAPI Backend', desc: 'Orchestrates parallel agents', color: '#00DBE7' },
    { icon: '🐟', label: 'TinyFish Agents ×5', desc: 'Navigate pharmacy websites', color: '#F97316' },
    { icon: '🏪', label: 'Pharmacy Websites', desc: 'Long Chau, Pharmacity, An Khang, Than Thien, Medicare', color: '#22C55E' },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
        <div className="text-center">
          <h2 className="text-xl font-bold text-t1">How It Works</h2>
          <p className="text-xs text-t3 mt-1">Architecture overview for the MediScrape platform</p>
        </div>

        <div className="flex flex-col items-center gap-0">
          {steps.map((step, i) => (
            <div key={step.label} className="flex flex-col items-center">
              <div className="bg-deep border border-border rounded-lg p-6 w-80 text-center hover:border-cyan/30 transition-colors">
                <div className="text-3xl mb-2">{step.icon}</div>
                <h3 className="font-bold text-sm" style={{ color: step.color }}>{step.label}</h3>
                <p className="text-xs text-t3 mt-1">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="flex flex-col items-center py-2">
                  <div className="w-0.5 h-6 bg-cyan/30" />
                  <div className="text-cyan text-xs">▼</div>
                  <div className="w-0.5 h-2 bg-cyan/30" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { value: '5', label: 'Parallel Agents', desc: 'Simultaneous pharmacy searches' },
            { value: '<30s', label: 'Average Response', desc: 'Full results from all sources' },
            { value: '5', label: 'Pharmacy Chains', desc: '3,700+ stores covered' },
          ].map((m) => (
            <div key={m.label} className="bg-deep border border-border rounded-lg p-6 text-center">
              <div className="text-3xl font-bold font-mono text-cyan">{m.value}</div>
              <div className="text-xs font-bold text-t1 mt-2">{m.label}</div>
              <div className="text-[10px] text-t3 mt-1">{m.desc}</div>
            </div>
          ))}
        </div>

        <div className="bg-deep border border-border rounded-lg p-6">
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
              <span className="text-t1 font-bold">OCR:</span>
              <span className="text-t2 ml-2">Prescription image → drug list extraction via vision AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
