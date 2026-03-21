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

function formatLatency(ms: number | null): string {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatusIndicator({ status }: { status: ModelStep['status'] }) {
  if (status === 'done') {
    return <span className="text-[#2DD4BF] font-mono text-xs">✓</span>;
  }
  if (status === 'active') {
    return (
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F97316]" />
      </span>
    );
  }
  return <span className="text-[#64748B] font-mono text-xs">○</span>;
}

export default function ModelRouterPanel({ steps, isActive }: ModelRouterPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const statusColor = (status: ModelStep['status']) => {
    if (status === 'done') return 'text-[#2DD4BF]';
    if (status === 'active') return 'text-[#F97316]';
    return 'text-[#64748B]';
  };

  return (
    <div className="bg-[#010E24] border border-[rgba(0,219,231,0.1)] rounded-lg overflow-hidden">
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

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-3 space-y-1.5">
          {steps.map((step, i) => {
            const label = STEP_LABELS[step.step] || step.step;
            const model = MODEL_LABELS[step.model] || step.model;

            return (
              <div
                key={`${step.step}-${i}`}
                className={`flex items-center gap-2 font-mono text-xs ${statusColor(step.status)}`}
              >
                {/* Step label — fixed width */}
                <span className="w-20 truncate">{label}</span>

                {/* Dashes */}
                <span className="text-[rgba(0,219,231,0.1)]">──</span>

                {/* Model name — fixed width */}
                <span className="w-28 truncate">{model}</span>

                {/* Dashes */}
                <span className="text-[rgba(0,219,231,0.1)]">──</span>

                {/* Latency */}
                <span className="w-12 text-right tabular-nums">
                  {formatLatency(step.latency_ms)}
                </span>

                {/* Status indicator */}
                <span className="w-4 flex justify-center">
                  <StatusIndicator status={step.status} />
                </span>

                {/* Count badge */}
                {step.count > 1 && (
                  <span className="text-[#94A3B8] text-[10px]">
                    (×{step.count})
                  </span>
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
