'use client';

import { Camera, Search, Dna, Brain } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface AgentCascadeProps {
  tier0Active: boolean;  // OCR running
  tier1Active: number;   // number of pharmacy agents active
  tier1Complete: number; // number completed
  tier1Total: number;    // total pharmacy agents
  tier2Variants: number; // number of variants discovered
  tier3AnalystActive: boolean;
  tier3AnalystComplete: boolean;
  visible: boolean;
}

export default function AgentCascade({ tier0Active, tier1Active, tier1Complete, tier1Total, tier2Variants, tier3AnalystActive, tier3AnalystComplete, visible }: AgentCascadeProps) {
  if (!visible) return null;

  const tiers: { label: string; name: string; status: string; detail: string; Icon: LucideIcon }[] = [
    {
      label: 'Tier 0',
      name: 'OCR Extract',
      status: tier0Active ? 'active' : (tier1Total > 0 ? 'done' : 'idle'),
      detail: tier0Active ? 'Extracting drugs...' : 'Prescription parsed',
      Icon: Camera,
    },
    {
      label: 'Tier 1',
      name: 'Pharmacy Agents',
      status: tier1Active > 0 ? 'active' : (tier1Complete > 0 ? 'done' : 'idle'),
      detail: tier1Active > 0
        ? `${tier1Active} agent${tier1Active !== 1 ? 's' : ''} searching...`
        : `${tier1Complete}/${tier1Total} complete`,
      Icon: Search,
    },
    {
      label: 'Tier 2',
      name: 'Variant Discovery',
      status: tier2Variants > 0 ? 'done' : (tier1Complete === tier1Total && tier1Total > 0 ? 'active' : 'idle'),
      detail: tier2Variants > 0
        ? `${tier2Variants} alternative${tier2Variants !== 1 ? 's' : ''} found`
        : 'Scanning generics...',
      Icon: Dna,
    },
    {
      label: 'Tier 3',
      name: 'Analyst Verdict',
      status: tier3AnalystComplete ? 'done' : (tier3AnalystActive ? 'active' : 'idle'),
      detail: tier3AnalystComplete
        ? 'Verdict delivered'
        : tier3AnalystActive ? 'Cross-validating...' : 'Awaiting data',
      Icon: Brain,
    },
  ];

  const statusBorder: Record<string, string> = {
    idle: 'border-border',
    active: 'border-warn/50',
    done: 'border-success/50',
  };

  const statusBg: Record<string, string> = {
    idle: 'bg-deep',
    active: 'bg-warn/5',
    done: 'bg-success/5',
  };

  const dotClass: Record<string, string> = {
    idle: 'bg-t3 sonar-dot sonar-dot--idle',
    active: 'bg-warn sonar-dot',
    done: 'bg-success sonar-dot sonar-dot--idle',
  };

  const sonarColor: Record<string, string> = {
    idle: '#64748B',
    active: '#F97316',
    done: '#2DD4BF',
  };

  const iconColor: Record<string, string> = {
    idle: '#64748B',
    active: '#F97316',
    done: '#2DD4BF',
  };

  const textColor: Record<string, string> = {
    idle: 'text-t3',
    active: 'text-warn',
    done: 'text-success',
  };

  return (
    <div className="bioluminescent-card p-4">
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-t2 mb-3">Agent Cascade Pipeline</h3>
      <div className="flex items-center gap-2">
        {tiers.map((tier, i) => (
          <div key={tier.label} className="contents">
            <div className={`flex-1 border rounded-lg p-3 transition-all duration-500 ${statusBorder[tier.status]} ${statusBg[tier.status]}`}>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-2 h-2 rounded-full ${dotClass[tier.status]}`}
                  style={{ '--sonar-color': sonarColor[tier.status] } as React.CSSProperties}
                />
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${textColor[tier.status]}`}>{tier.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <tier.Icon size={16} color={iconColor[tier.status]} strokeWidth={1.5} />
                <div>
                  <p className="text-xs font-mono font-semibold text-t1 leading-tight">{tier.name}</p>
                  <p className={`text-[10px] font-mono ${textColor[tier.status]}`}>{tier.detail}</p>
                </div>
              </div>
            </div>
            {i < tiers.length - 1 && (
              <svg className={`w-4 h-4 flex-shrink-0 ${textColor[tier.status]}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z"/>
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
