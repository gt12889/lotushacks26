'use client';

interface LiveMetricsBarProps {
  agentsSpawned: number;
  pharmaciesComplete: number;
  pharmaciesTotal: number;
  productsFound: number;
  savingsVnd: number | null;
  isActive: boolean;
}

function formatVnd(value: number): string {
  return '₫' + value.toLocaleString('en-US');
}

export default function LiveMetricsBar({
  agentsSpawned,
  pharmaciesComplete,
  pharmaciesTotal,
  productsFound,
  savingsVnd,
  isActive,
}: LiveMetricsBarProps) {
  const pharmaciesDone = pharmaciesComplete >= pharmaciesTotal && pharmaciesTotal > 0;

  return (
    <div
      className={`
        flex items-center justify-between
        bg-deep border border-border rounded-lg px-6 py-3
        font-mono
        ${isActive ? 'animate-pulse-left-border' : ''}
      `}
      style={
        isActive
          ? { borderLeftWidth: 2, borderLeftColor: '#00DBE7' }
          : undefined
      }
    >
      {/* Agents Deployed */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] uppercase tracking-wider text-t3">
          Agents Deployed
        </span>
        <span
          className="text-lg font-bold text-cyan"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {agentsSpawned}
        </span>
      </div>

      {/* Pharmacies Scanned */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] uppercase tracking-wider text-t3">
          Pharmacies Scanned
        </span>
        <span
          className={`text-lg font-bold ${pharmaciesDone ? 'text-success' : 'text-warn'}`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {pharmaciesComplete}/{pharmaciesTotal}
        </span>
      </div>

      {/* Products Found */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] uppercase tracking-wider text-t3">
          Products Found
        </span>
        <span
          className="text-lg font-bold text-t1"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {productsFound}
        </span>
      </div>

      {/* Savings Detected */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] uppercase tracking-wider text-t3">
          Savings Detected
        </span>
        <span
          className="text-lg font-bold text-warn"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {savingsVnd !== null ? formatVnd(savingsVnd) : '—'}
        </span>
      </div>
    </div>
  );
}
