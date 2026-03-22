'use client';

import { useState, useEffect, useRef } from 'react';
import MegalodonBadge from './ui/megalodon-badge';
import SponsorBadge from './SponsorBadge';
import SparklineChart from './SparklineChart';

interface PharmacyResult {
  source_id: string;
  source_name: string;
  status: string;
  products: any[];
  lowest_price: number | null;
  result_count: number;
  response_time_ms: number | null;
  error: string | null;
}

interface PharmacyCardsProps {
  results: Record<string, PharmacyResult>;
  sparklines?: Record<string, { source_name: string; points: { price: number; time: string }[] }>;
}

const SOURCE_COLORS: Record<string, string> = {
  long_chau: '#3B82F6',
  pharmacity: '#22C55E',
  an_khang: '#F97316',
  than_thien: '#A855F7',
  medicare: '#14B8A6',
};

const PHARMACY_INITIALS: Record<string, string> = {
  long_chau: 'LC',
  pharmacity: 'PC',
  an_khang: 'AK',
  than_thien: 'TT',
  medicare: 'MC',
};

const PHARMACY_URLS: Record<string, string> = {
  long_chau: 'https://nhathuoclongchau.com.vn',
  pharmacity: 'https://www.pharmacity.vn',
  an_khang: 'https://www.ankhang.vn',
  than_thien: 'https://nhathuocthanhtien.vn',
  medicare: 'https://medicare.vn',
};

const BRIGHTDATA_PHARMACIES = new Set(['long_chau', 'pharmacity', 'an_khang']);

export default function PharmacyCards({ results, sparklines }: PharmacyCardsProps) {
  const pharmacies = ['long_chau', 'pharmacity', 'an_khang', 'than_thien', 'medicare'];
  const [glowing, setGlowing] = useState<Record<string, boolean>>({});
  const prevResults = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const id of pharmacies) {
      const hasResult = !!results[id];
      const hadResult = !!prevResults.current[id];

      if (hasResult && !hadResult) {
        setGlowing((prev) => ({ ...prev, [id]: true }));
        const timer = setTimeout(() => {
          setGlowing((prev) => ({ ...prev, [id]: false }));
        }, 1500);
        timers.push(timer);
      }

      prevResults.current[id] = hasResult;
    }

    return () => timers.forEach(clearTimeout);
  }, [results]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {pharmacies.map((id) => {
        const result = results[id];
        const color = SOURCE_COLORS[id] || '#64748B';
        const statusType = result?.status === 'success' ? 'active' : result?.status === 'error' ? 'error' : result?.status === 'searching' ? 'searching' : 'monitor';
        const hasResult = !!result;
        const isGlowing = !!glowing[id];
        const sponsors = BRIGHTDATA_PHARMACIES.has(id) ? ['TinyFish', 'BrightData'] : ['TinyFish'];

        return (
            <div
              key={id}
              className={`panel p-4 transition-all duration-500 ${!hasResult ? 'opacity-40' : ''} ${isGlowing ? 'border-l-2' : ''}`}
              style={{
                borderLeftColor: isGlowing || hasResult ? color : undefined,
                borderLeftWidth: isGlowing ? 2 : hasResult ? 1 : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold font-mono text-t1">{PHARMACY_INITIALS[id]}</span>
                {result && <MegalodonBadge status={statusType} />}
              </div>
              <div className="text-[10px] text-t3 mb-2">
                <a href={PHARMACY_URLS[id] || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-cyan transition-colors">
                  {result?.source_name || id}
                </a>
              </div>
              {result?.status === 'searching' && (
                <div className="text-xs text-warn animate-pulse font-mono">Scanning...</div>
              )}
              {result?.status === 'success' && (
                <>
                  <div className="text-xs text-t2 font-mono">{result.result_count} results</div>
                  {result.lowest_price && (
                    <div className="text-base font-bold font-mono text-t1 mt-1">
                      {result.lowest_price.toLocaleString()}đ
                    </div>
                  )}
                  {result.response_time_ms && (
                    <div className="text-[10px] text-t3 font-mono">{(result.response_time_ms / 1000).toFixed(1)}s latency</div>
                  )}
                  {sparklines?.[id]?.points && sparklines[id].points.length >= 2 && (
                    <SparklineChart data={sparklines[id].points} color={color} />
                  )}
                </>
              )}
              {result?.status === 'error' && (
                <div className="text-[10px] text-alert-red font-mono">Signal lost</div>
              )}
              {hasResult && (
                <div className="mt-2">
                  <SponsorBadge sponsors={sponsors} />
                </div>
              )}
            </div>
        );
      })}
    </div>
  );
}
