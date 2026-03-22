'use client';

import SponsorBadge from './SponsorBadge';

interface PriceAnomaly {
  product_name: string;
  unit_price: number;
  median_price: number;
  deviation_pct: number;
}

interface CounterfeitRisk {
  drug_name: string;
  risk_level: string;
  recent_incidents: string[];
  warning_signs: string[];
  regulatory_alerts: string[];
  source: string;
}

interface Investigation {
  product_name: string;
  unit_price: number;
  median_price: number;
  counterfeit_research: CounterfeitRisk | null;
  who_comparison: { price_snippet?: string; source_title?: string } | null;
  manufacturer_check: { name: string; known_good: boolean };
}

interface CounterfeitRiskPanelProps {
  anomalies: PriceAnomaly[] | null;
  risk: CounterfeitRisk | null;
  investigations?: Investigation[];
}

const RISK_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  high: { bg: 'bg-alert-red/10', border: 'border-alert-red/40', text: 'text-alert-red', label: 'HIGH RISK' },
  medium: { bg: 'bg-warn/10', border: 'border-warn/40', text: 'text-warn', label: 'MEDIUM RISK' },
  low: { bg: 'bg-success/10', border: 'border-success/40', text: 'text-success', label: 'LOW RISK' },
  unknown: { bg: 'bg-t3/10', border: 'border-t3/40', text: 'text-t3', label: 'UNKNOWN' },
};

export default function CounterfeitRiskPanel({ anomalies, risk, investigations }: CounterfeitRiskPanelProps) {
  if (!anomalies || anomalies.length === 0) return null;

  const riskStyle = RISK_STYLES[risk?.risk_level ?? 'unknown'] || RISK_STYLES.unknown;

  return (
    <div className={`${riskStyle.bg} border ${riskStyle.border} rounded-lg p-4 font-mono`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <h3 className="text-[10px] uppercase tracking-widest text-t2 font-bold">
            Counterfeit Risk Analysis
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {risk && (
            <span className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded border ${riskStyle.border} ${riskStyle.text}`}>
              {riskStyle.label}
            </span>
          )}
          <SponsorBadge sponsors={['Exa']} />
        </div>
      </div>

      {/* Price anomalies */}
      <div className="mb-3">
        <p className="text-[10px] text-t3 uppercase tracking-wider mb-1">Suspicious Pricing Detected</p>
        {anomalies.map((a, i) => (
          <div key={i} className="flex items-center gap-3 py-1 text-xs">
            <span className="text-alert-red">●</span>
            <span className="text-t1">{a.product_name}</span>
            <span className="text-t3">—</span>
            <span className="text-alert-red font-bold">₫{Math.round(a.unit_price).toLocaleString()}/unit</span>
            <span className="text-t3">vs median ₫{Math.round(a.median_price).toLocaleString()}</span>
            <span className="text-alert-red text-[10px]">({a.deviation_pct}% below)</span>
          </div>
        ))}
      </div>

      {/* Per-product Investigation Swarm Results */}
      {investigations && investigations.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-t3 uppercase tracking-wider mb-2">Investigation Swarm Results</p>
          <div className="space-y-2">
            {investigations.map((inv, i) => (
              <div key={i} className="border border-border/30 rounded p-2.5 bg-deep/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-t1 font-semibold">{inv.product_name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    inv.manufacturer_check?.known_good
                      ? 'bg-success/10 text-success border border-success/30'
                      : 'bg-alert-red/10 text-alert-red border border-alert-red/30'
                  }`}>
                    {inv.manufacturer_check?.known_good ? 'VERIFIED MFR' : 'UNVERIFIED MFR'}
                  </span>
                </div>
                <p className="text-[10px] text-t3">
                  Manufacturer: <span className="text-t2">{inv.manufacturer_check?.name || 'Unknown'}</span>
                  <span className="mx-2">·</span>
                  Price: <span className="text-alert-red">₫{Math.round(inv.unit_price).toLocaleString()}</span>
                  <span className="text-t3"> vs median </span>
                  <span className="text-t2">₫{Math.round(inv.median_price).toLocaleString()}</span>
                </p>
                {inv.who_comparison?.price_snippet && (
                  <p className="text-[10px] text-t2 mt-1 border-l-2 border-cyan/30 pl-2">
                    WHO: {inv.who_comparison.price_snippet.slice(0, 150)}
                  </p>
                )}
                {inv.counterfeit_research?.risk_level && (
                  <span className={`text-[9px] mt-1.5 inline-block px-1.5 py-0.5 rounded font-bold uppercase border ${
                    RISK_STYLES[inv.counterfeit_research.risk_level]?.bg || 'bg-t3/10'
                  } ${RISK_STYLES[inv.counterfeit_research.risk_level]?.text || 'text-t3'} ${
                    RISK_STYLES[inv.counterfeit_research.risk_level]?.border || 'border-t3/40'
                  }`}>
                    {RISK_STYLES[inv.counterfeit_research.risk_level]?.label || 'UNKNOWN'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exa Research report */}
      {risk && (
        <>
          {risk.recent_incidents.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] text-t3 uppercase tracking-wider mb-1">Recent Incidents</p>
              <ul className="text-xs text-t2 space-y-1">
                {risk.recent_incidents.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-alert-red shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {risk.warning_signs.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] text-t3 uppercase tracking-wider mb-1">Warning Signs</p>
              <ul className="text-xs text-t2 space-y-1">
                {risk.warning_signs.slice(0, 4).map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-warn shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {risk.regulatory_alerts.length > 0 && (
            <div>
              <p className="text-[10px] text-t3 uppercase tracking-wider mb-1">Regulatory Alerts</p>
              <ul className="text-xs text-t2 space-y-1">
                {risk.regulatory_alerts.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-cyan shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!risk && !investigations?.length && (
        <p className="text-xs text-t3 animate-pulse">Researching counterfeit risks via Exa Research API...</p>
      )}

      <div className="mt-3 pt-2 border-t border-border/30">
        <p className="text-[9px] text-t3">
          Powered by Exa Research API — deep web analysis of drug safety data, seizure reports, and regulatory filings.
        </p>
      </div>
    </div>
  );
}
