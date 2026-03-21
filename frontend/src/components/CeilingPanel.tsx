'use client';

interface ComplianceData {
  has_ceiling: boolean;
  drug_name?: string;
  drug_query?: string;
  ceiling_price?: number;
  unit?: string;
  source?: string;
  effective_date?: string;
  violations?: Array<{
    product: string;
    unit_price: number;
    delta_percent: number;
    source: string;
  }>;
  compliant_count?: number;
  violation_count?: number;
}

interface CeilingPanelProps {
  compliance: ComplianceData | null;
  query: string;
}

function severityColor(deltaPct: number): string {
  if (deltaPct <= 0) return 'text-success';
  if (deltaPct <= 50) return 'text-warn';
  return 'text-alert-red';
}

function severityLabel(deltaPct: number): string {
  if (deltaPct <= 0) return 'BELOW';
  if (deltaPct <= 50) return 'ABOVE';
  return 'CRITICAL';
}

export default function CeilingPanel({ compliance, query }: CeilingPanelProps) {
  if (!compliance) return null;

  if (!compliance.has_ceiling) {
    return (
      <div className="bioluminescent-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-t3" />
          <p className="text-[10px] uppercase tracking-wider text-t3 font-mono">
            DAV Price Ceiling
          </p>
        </div>
        <p className="text-sm font-mono text-t2">
          No DAV ceiling data registered for{' '}
          <span className="text-cyan">{query}</span>
        </p>
        <p className="text-[10px] text-t3 mt-2 font-mono">
          Submit inquiry → dav.gov.vn
        </p>
      </div>
    );
  }

  const {
    drug_name,
    ceiling_price,
    unit,
    source,
    effective_date,
    violations = [],
    compliant_count = 0,
    violation_count = 0,
  } = compliance;

  return (
    <div className="bioluminescent-card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className={`w-2 h-2 rounded-full ${violation_count > 0 ? 'bg-alert-red' : 'bg-success'}`}
        />
        <p className="text-[10px] uppercase tracking-wider text-t3 font-mono">
          DAV Price Ceiling Analysis
        </p>
      </div>

      {/* Ceiling info row */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          <p className="text-xs text-t3 font-mono mb-0.5">Drug</p>
          <p className="text-sm font-mono text-cyan">{drug_name}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-t3 font-mono mb-0.5">Ceiling Price</p>
          <p className="text-lg font-bold font-mono text-t1">
            {ceiling_price?.toLocaleString()}{' '}
            <span className="text-xs text-t3">{unit}/unit</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-t3 font-mono mb-0.5">Source</p>
          <p className="text-xs font-mono text-t2">{source}</p>
        </div>
        {effective_date && (
          <div className="text-center">
            <p className="text-xs text-t3 font-mono mb-0.5">Effective</p>
            <p className="text-xs font-mono text-t2">{effective_date}</p>
          </div>
        )}
      </div>

      {/* Compliance counts */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-success" />
          <p className="text-xs font-mono text-success">
            {compliant_count} product{compliant_count !== 1 ? 's' : ''} below
            ceiling
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-alert-red" />
          <p className="text-xs font-mono text-alert-red">
            {violation_count} product{violation_count !== 1 ? 's' : ''} above
            ceiling
          </p>
        </div>
      </div>

      {/* Violations list */}
      {violations.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-[10px] uppercase tracking-wider text-t3 font-mono mb-2">
            Violations
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {violations.map((v, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs font-mono bg-abyss rounded px-3 py-2"
              >
                <span className="text-t2 truncate max-w-[60%]">{v.product}</span>
                <div className="flex items-center gap-3">
                  <span className="text-t1">
                    {v.unit_price.toLocaleString()} {unit}
                  </span>
                  <span className={`${severityColor(v.delta_percent)} font-bold`}>
                    +{v.delta_percent}% {severityLabel(v.delta_percent)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
