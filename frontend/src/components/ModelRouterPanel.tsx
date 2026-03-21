'use client';

import { useState } from 'react';
import SponsorBadge from './SponsorBadge';

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
};

const MODEL_LABELS: Record<string, string> = {
  'qwen/qwen-2.5-72b-instruct': 'qwen-2.5-72b',
  'TinyFish Agent': 'TinyFish Agent',
  'Neural Search': 'Exa Neural',
  'gpt-4o': 'gpt-4o',
};

const STEP_SPONSORS: Record<string, string> = {
  normalize: 'Qwen 2.5 72B',
  search: 'Powered by TinyFish',
  discovery: 'Exa Neural Search',
  ocr: 'OpenAI GPT-4o',
};

function formatLatency(ms: number | null): string {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatusIndicator({ status }: { status: ModelStep['status'] }) {
  if (status === 'done') {
    return (
      <span
        className="inline-flex h-[6px] w-[6px] rounded-full bg-success"
        style={{ animation: 'completionFlash 0.4s ease-out' }}
      />
    );
  }
  if (status === 'active') {
    return (
      <span
        className="sonar-dot inline-flex h-[6px] w-[6px] rounded-full bg-warn"
        style={{ '--sonar-color': '#F97316' } as React.CSSProperties}
      />
    );
  }
  return (
    <span className="inline-flex h-[6px] w-[6px] rounded-full border border-t3" />
  );
}

function LatencyBar({ status, latency_ms }: { status: ModelStep['status']; latency_ms: number | null }) {
  const maxMs = 5000;
  const widthPct = latency_ms ? Math.min((latency_ms / maxMs) * 100, 100) : 0;

  return (
    <div
      className="h-1.5 w-20 rounded-full overflow-hidden"
      style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)', background: 'rgba(0,219,231,0.05)', border: '1px solid rgba(0,219,231,0.08)' }}
    >
      {status === 'active' && (
        <div
          className="h-full rounded-full"
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #00DBE7, #2DD4BF, #00DBE7)',
            backgroundSize: '200% 100%',
            animation: 'gradientShift 1.5s linear infinite',
          }}
        />
      )}
      {status === 'done' && (
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${widthPct}%`,
            background: 'linear-gradient(90deg, #00DBE7, #2DD4BF)',
            animation: 'completionFlash 0.4s ease-out',
          }}
        />
      )}
    </div>
  );
}

export default function ModelRouterPanel({ steps, isActive }: ModelRouterPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const statusColor = (status: ModelStep['status']) => {
    if (status === 'done') return 'text-[#2DD4BF]';
    if (status === 'active') return 'text-[#F97316]';
    return 'text-[#64748B]';
  };

  return (
    <div className="bioluminescent-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[rgba(0,219,231,0.03)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[#D6E3FF] text-xs font-bold tracking-widest">
            MODEL ROUTER
          </span>
          <span className="text-[#64748B] font-mono text-xs">
            {expanded ? '▾' : '▸'}
          </span>
        </div>
        <SponsorBadge sponsors={['OpenRouter', 'OpenAI', 'Exa', 'TinyFish']} />
      </button>

      {/* OpenRouter branding */}
      {expanded && (
        <div className="px-4 pb-1">
          <div className="text-[9px] font-mono text-t2 pl-2 border-l-2 border-warn/50">
            ⚡ Routed via OpenRouter
          </div>
        </div>
      )}

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-3 pt-2 space-y-2">
          {steps.map((step, i) => {
            const label = STEP_LABELS[step.step] || step.step;
            const model = MODEL_LABELS[step.model] || step.model;
            const sponsor = STEP_SPONSORS[step.step];

            return (
              <div
                key={`${step.step}-${i}`}
                className="space-y-0.5"
              >
                <div className={`flex items-center gap-2 font-mono text-xs ${statusColor(step.status)}`}>
                  {/* Status indicator */}
                  <span className="w-4 flex justify-center">
                    <StatusIndicator status={step.status} />
                  </span>

                  {/* Step label */}
                  <span className="w-20 truncate">{label}</span>

                  {/* Latency bar */}
                  <LatencyBar status={step.status} latency_ms={step.latency_ms} />

                  {/* Latency value */}
                  <span className="w-12 text-right tabular-nums">
                    {formatLatency(step.latency_ms)}
                  </span>

                  {/* Model name */}
                  <span className="w-28 truncate text-t2">{model}</span>

                  {/* Count badge */}
                  {step.count > 1 && (
                    <span className="text-[#94A3B8] text-[10px]">
                      (×{step.count})
                    </span>
                  )}
                </div>

                {/* Sponsor attribution */}
                {sponsor && (
                  <div className="text-[8px] font-mono text-t3/60 pl-6 tracking-wide">
                    {sponsor}
                  </div>
                )}
              </div>
            );
          })}

          {steps.length === 0 && !isActive && (
            <p className="text-[#64748B] font-mono text-xs">No models invoked yet.</p>
          )}

          {steps.length === 0 && isActive && (
            <p className="text-[#F97316] font-mono text-xs animate-pulse">
              Initializing pipeline…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
