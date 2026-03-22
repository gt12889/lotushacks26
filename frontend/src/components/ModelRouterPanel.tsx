'use client';

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

export interface ModelStep {
  step: string;
  model: string;
  provider: string;
  latency_ms: number | null;
  status: 'pending' | 'active' | 'done';
  count: number;
}

interface ModelRouterPanelProps {
  steps: ModelStep[];
  isActive: boolean;
}

const STEP_LABELS: Record<string, string> = {
  normalize: 'Normalize',
  search: 'Search',
  discovery: 'Discovery',
  ocr: 'OCR',
  analyst: 'Analyst',
};

function formatLatency(ms: number | null): string {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatusDot({ status }: { status: ModelStep['status'] }) {
  if (status === 'done') return <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success" />;
  if (status === 'active') return <span className="inline-flex h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />;
  return <span className="inline-flex h-1.5 w-1.5 rounded-full border border-t3/40" />;
}

function LatencyBar({ status, latency_ms }: { status: ModelStep['status']; latency_ms: number | null }) {
  const maxMs = 5000;
  const widthPct = latency_ms ? Math.min((latency_ms / maxMs) * 100, 100) : 0;

  return (
    <div className="h-1 w-16 rounded-full overflow-hidden bg-border/30">
      {status === 'active' && (
        <div className="h-full w-full rounded-full bg-cyan/40 animate-pulse" />
      )}
      {status === 'done' && (
        <div
          className="h-full rounded-full bg-cyan transition-all duration-300"
          style={{ width: `${widthPct}%` }}
        />
      )}
    </div>
  );
}

export default function ModelRouterPanel({ steps, isActive }: ModelRouterPanelProps) {
  return (
    <Collapsible defaultOpen className="panel overflow-hidden">
      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-white/[0.02] transition-colors">
        <span className="text-xs text-t2">Model Router</span>
        <span className="text-[10px] text-t3 font-mono">OpenRouter</span>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-4 pb-3 space-y-1.5">
          {steps.map((step, i) => {
            const label = STEP_LABELS[step.step] || step.step;
            const textColor = step.status === 'done' ? 'text-t1' : step.status === 'active' ? 'text-cyan' : 'text-t3';

            return (
              <div key={`${step.step}-${i}`} className={`flex items-center gap-3 text-xs ${textColor}`}>
                <span className="w-3 flex justify-center"><StatusDot status={step.status} /></span>
                <span className="w-16">{label}</span>
                <LatencyBar status={step.status} latency_ms={step.latency_ms} />
                <span className="w-12 text-right font-mono text-t3 text-[11px]">{formatLatency(step.latency_ms)}</span>
                <span className="text-t3 text-[11px] truncate">{step.model}</span>
              </div>
            );
          })}

          {steps.length === 0 && !isActive && (
            <p className="text-t3 text-xs">No models invoked yet.</p>
          )}
          {steps.length === 0 && isActive && (
            <p className="text-cyan text-xs animate-pulse">Initializing…</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
