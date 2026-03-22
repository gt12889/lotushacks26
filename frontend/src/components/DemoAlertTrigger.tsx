'use client';

import { useState, useCallback } from 'react';

import { demoFetch } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DemoAlertTriggerProps {
  drugName?: string;
  bestPrice?: number;
  bestSource?: string;
}

type SendState = 'idle' | 'sending' | 'sent' | 'error';

export default function DemoAlertTrigger({
  drugName = 'Metformin 500mg',
  bestPrice,
  bestSource,
}: DemoAlertTriggerProps) {
  const [state, setState] = useState<SendState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const fireAlert = useCallback(async () => {
    if (state === 'sending') return;

    setState('sending');
    setErrorMsg('');

    try {
      const res = await demoFetch(`${API_URL}/api/demo-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drug_name: drugName,
          best_price: bestPrice,
          best_source: bestSource,
        }),
      });

      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? 'Alert endpoint not configured'
            : `Request failed (${res.status})`
        );
      }

      setState('sent');
      setTimeout(() => setState('idle'), 3000);
    } catch (err) {
      setState('error');
      setErrorMsg(
        err instanceof Error ? err.message : 'Alert endpoint not configured'
      );
      setTimeout(() => setState('idle'), 4000);
    }
  }, [state, drugName, bestPrice, bestSource]);

  const buttonLabel = {
    idle: '🔔 Fire Demo Alert',
    sending: '⏳ Sending…',
    sent: '✓ Alert Sent',
    error: '✗ Failed',
  }[state];

  const buttonStyle = {
    idle: 'bg-[#F97316]/20 border-[#F97316] text-[#F97316] hover:bg-[#F97316]/30',
    sending: 'bg-[#F97316]/10 border-[#F97316]/50 text-[#F97316]/70 cursor-wait',
    sent: 'bg-[#2DD4BF]/20 border-[#2DD4BF] text-[#2DD4BF]',
    error: 'bg-[#EE4042]/20 border-[#EE4042] text-[#EE4042]',
  }[state];

  return (
    <div className="bg-[#010E24] border border-[#F97316]/30 rounded-lg p-4 font-mono">
      <button
        type="button"
        onClick={fireAlert}
        disabled={state === 'sending'}
        className={`${buttonStyle} border px-4 py-2 rounded font-mono text-sm transition-colors duration-200 w-full`}
      >
        {state === 'sending' && (
          <span className="inline-block animate-spin mr-2">⟳</span>
        )}
        {buttonLabel}
      </button>

      <p className="text-[#64748B] text-xs mt-2 text-center">
        Sends Discord alert + Vietnamese voice note via ElevenLabs
      </p>

      {state === 'sent' && (
        <p className="text-[#2DD4BF] text-xs mt-2 text-center">
          ✓ Alert sent to Discord with voice note
        </p>
      )}

      {state === 'error' && errorMsg && (
        <p className="text-[#EE4042] text-xs mt-2 text-center">{errorMsg}</p>
      )}

      <div className="flex justify-center gap-2 mt-3">
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-[rgba(0,219,231,0.1)] text-[#94A3B8]">
          ElevenLabs
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-[rgba(0,219,231,0.1)] text-[#94A3B8]">
          Discord
        </span>
      </div>
    </div>
  );
}
