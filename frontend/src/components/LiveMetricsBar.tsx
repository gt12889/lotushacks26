'use client';

import { useLocale } from '@/components/LocaleProvider';
import { Counter } from '@/components/ui/counter';

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
  const { t } = useLocale();
  const pharmaciesDone = pharmaciesComplete >= pharmaciesTotal && pharmaciesTotal > 0;

  return (
    <div
      className={`
        flex items-center justify-between
        bioluminescent-card px-6 py-3
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
        <Counter
          value={agentsSpawned}
          className="text-lg font-bold text-cyan"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        />
      </div>

      {/* Pharmacies Scanned */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] uppercase tracking-wider text-t3">
          {t('metrics.pharmaciesScanned')}
        </span>
        <span
          className={`text-lg font-bold ${pharmaciesDone ? 'text-success' : 'text-warn'}`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          <Counter value={pharmaciesComplete} />/{pharmaciesTotal}
        </span>
      </div>

      {/* Products Found */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] uppercase tracking-wider text-t3">
          {t('metrics.productsFound')}
        </span>
        <Counter
          value={productsFound}
          className="text-lg font-bold text-t1"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        />
      </div>

      {/* Savings Detected */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] uppercase tracking-wider text-t3">
          {t('metrics.savingsDetected')}
        </span>
        {savingsVnd !== null ? (
          <Counter
            value={savingsVnd}
            formatter={formatVnd}
            className="text-lg font-bold text-warn"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          />
        ) : (
          <span
            className="text-lg font-bold text-warn"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            —
          </span>
        )}
      </div>
    </div>
  );
}
