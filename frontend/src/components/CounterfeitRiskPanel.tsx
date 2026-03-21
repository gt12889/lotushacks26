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

interface CounterfeitRiskPanelProps {
  anomalies: PriceAnomaly[] | null;
  risk: CounterfeitRisk | null;
}

const RISK_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  high: { bg: 'bg-alert-red/10', border: 'border-alert-red/40', text: 'text-alert-red', label: 'HIGH RISK' },
  medium: { bg: 'bg-warn/10', border: 'border-warn/40', text: 'text-warn', label: 'MEDIUM RISK' },
  low: { bg: 'bg-success/10', border: 'border-success/40', text: 'text-success', label: 'LOW RISK' },
  unknown: { bg: 'bg-t3/10', border: 'border-t3/40', text: 'text-t3', label: 'UNKNOWN' },
};

export default function CounterfeitRiskPanel({ anomalies, risk }: CounterfeitRiskPanelProps) {
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

      {!risk && (
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
