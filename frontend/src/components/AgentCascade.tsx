'use client';

interface AgentCascadeProps {
  tier0Active: boolean;  // OCR running
  tier1Active: number;   // number of pharmacy agents active
  tier1Complete: number; // number completed
  tier1Total: number;    // total pharmacy agents
  tier2Variants: number; // number of variants discovered
  visible: boolean;
}

export default function AgentCascade({ tier0Active, tier1Active, tier1Complete, tier1Total, tier2Variants, visible }: AgentCascadeProps) {
  if (!visible) return null;

  const tiers = [
    {
      label: 'Tier 0',
      name: 'OCR Extract',
      status: tier0Active ? 'active' : (tier1Total > 0 ? 'done' : 'idle'),
      detail: tier0Active ? 'Extracting drugs...' : 'Prescription parsed',
      color: 'purple',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Tier 1',
      name: 'Pharmacy Agents',
      status: tier1Active > 0 ? 'active' : (tier1Complete > 0 ? 'done' : 'idle'),
      detail: tier1Active > 0
        ? `${tier1Active} agent${tier1Active !== 1 ? 's' : ''} searching...`
        : `${tier1Complete}/${tier1Total} complete`,
      color: 'blue',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      label: 'Tier 2',
      name: 'Variant Discovery',
      status: tier2Variants > 0 ? 'done' : (tier1Complete === tier1Total && tier1Total > 0 ? 'active' : 'idle'),
      detail: tier2Variants > 0
        ? `${tier2Variants} alternative${tier2Variants !== 1 ? 's' : ''} found`
        : 'Scanning generics...',
      color: 'green',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
  ];

  const statusStyles: Record<string, string> = {
    idle: 'bg-gray-100 border-gray-200 text-gray-400',
    active: 'bg-yellow-50 border-yellow-300 text-yellow-700 shadow-sm',
    done: 'bg-green-50 border-green-300 text-green-700',
  };

  const dotStyles: Record<string, string> = {
    idle: 'bg-gray-300',
    active: 'bg-yellow-400 animate-pulse',
    done: 'bg-green-500',
  };

  const arrowColor: Record<string, string> = {
    idle: 'text-gray-200',
    active: 'text-yellow-400',
    done: 'text-green-400',
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Agent Cascade Pipeline</h3>
      <div className="flex items-center gap-2">
        {tiers.map((tier, i) => (
          <div key={tier.label} className="contents">
            {/* Tier card */}
            <div className={`flex-1 border-2 rounded-xl p-3 transition-all duration-500 ${statusStyles[tier.status]}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2.5 h-2.5 rounded-full ${dotStyles[tier.status]}`} />
                <span className="text-xs font-bold uppercase tracking-wider">{tier.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="opacity-60">{tier.icon}</div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{tier.name}</p>
                  <p className="text-xs opacity-75">{tier.detail}</p>
                </div>
              </div>
            </div>
            {/* Arrow between tiers */}
            {i < tiers.length - 1 && (
              <svg className={`w-6 h-6 flex-shrink-0 ${arrowColor[tier.status]}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z"/>
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
