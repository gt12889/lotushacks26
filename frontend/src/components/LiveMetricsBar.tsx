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
    <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-deep/60 border border-border">
      <Metric label="Agents" value={<Counter value={agentsSpawned} className="text-sm font-bold text-t1 tabular-nums" />} />
      <Metric
        label="Pharmacies"
        value={
          <span className={`text-sm font-bold tabular-nums ${pharmaciesDone ? 'text-success' : 'text-t1'}`}>
            <Counter value={pharmaciesComplete} />/{pharmaciesTotal}
          </span>
        }
      />
      <Metric label="Products" value={<Counter value={productsFound} className="text-sm font-bold text-t1 tabular-nums" />} />
      <Metric
        label="Savings"
        value={
          savingsVnd !== null
            ? <Counter value={savingsVnd} formatter={formatVnd} className="text-sm font-bold text-warn tabular-nums" />
            : <span className="text-sm text-t3">—</span>
        }
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-t3">{label}</span>
      {value}
    </div>
  );
}
