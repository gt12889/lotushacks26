'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

import { demoFetch } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface VoiceSummaryProps {
  query: string;
  bestPrice: number | null;
  bestSource: string | null;
  potentialSavings: number | null;
  totalResults: number;
}

export default function VoiceSummary({
  query,
  bestPrice,
  bestSource,
  potentialSavings,
  totalResults,
}: VoiceSummaryProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasFiredRef = useRef(false);

  const play = useCallback(async () => {
    if (status === 'loading' || status === 'playing') return;
    setStatus('loading');

    try {
      const res = await demoFetch(`${API_URL}/api/tts/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          best_price: bestPrice,
          best_source: bestSource,
          potential_savings: potentialSavings,
          total_results: totalResults,
        }),
      });

      if (!res.ok) {
        setStatus('error');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setStatus('idle');
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setStatus('error');
        URL.revokeObjectURL(url);
      };

      setStatus('playing');
      await audio.play();
    } catch {
      setStatus('error');
    }
  }, [query, bestPrice, bestSource, potentialSavings, totalResults, status]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setStatus('idle');
  }, []);

  // Auto-play on mount (first render with results)
  useEffect(() => {
    if (!hasFiredRef.current && bestPrice) {
      hasFiredRef.current = true;
      play();
    }
  }, [bestPrice, play]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Reset fired flag when query changes
  useEffect(() => {
    hasFiredRef.current = false;
  }, [query]);

  return (
    <button
      onClick={status === 'playing' ? stop : play}
      disabled={status === 'loading'}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
        status === 'playing'
          ? 'bg-cyan/20 border border-cyan text-cyan animate-pulse'
          : status === 'loading'
            ? 'bg-card border border-border text-t3 cursor-wait'
            : status === 'error'
              ? 'bg-alert-red/10 border border-alert-red/30 text-alert-red hover:bg-alert-red/20'
              : 'bg-card border border-border text-t2 hover:border-cyan/30 hover:text-cyan'
      }`}
      title={
        status === 'playing'
          ? 'Stop voice summary'
          : status === 'loading'
            ? 'Generating voice...'
            : 'Play Vietnamese voice summary'
      }
    >
      {status === 'loading' ? (
        <Loader2 size={14} className="animate-spin" />
      ) : status === 'playing' ? (
        <VolumeX size={14} />
      ) : (
        <Volume2 size={14} />
      )}
      <span>
        {status === 'loading'
          ? 'Generating...'
          : status === 'playing'
            ? 'Playing'
            : status === 'error'
              ? 'Retry'
              : 'Voice Summary'}
      </span>
      <span className="text-[9px] text-t3 ml-1">ElevenLabs</span>
    </button>
  );
}
