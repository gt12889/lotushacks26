'use client';

import { Clock, Zap } from 'lucide-react';

interface ComparisonBannerProps {
  searchTimeMs: number | null;
  pharmacyCount: number;
  productCount: number;
}

export default function ComparisonBanner({ searchTimeMs, pharmacyCount, productCount }: ComparisonBannerProps) {
  if (!searchTimeMs || pharmacyCount === 0) return null;

  const megalodonSeconds = (searchTimeMs / 1000).toFixed(1);
  const manualMinutes = pharmacyCount * 3; // ~3 min per pharmacy manually

  return (
    <div className="bioluminescent-card p-4 overflow-hidden">
      <p className="text-[9px] uppercase tracking-widest text-t3 font-mono mb-3">Speed Comparison</p>
      <div className="grid grid-cols-2 gap-4">
        {/* Manual */}
        <div className="border border-alert-red/20 rounded-lg p-3 bg-alert-red/5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-alert-red" strokeWidth={1.5} />
            <span className="text-[10px] font-mono text-alert-red font-bold uppercase tracking-wider">Manual Search</span>
          </div>
          <p className="text-xl font-bold font-mono text-t1">{manualMinutes} min</p>
          <p className="text-[10px] text-t3 font-mono mt-1">
            {pharmacyCount} pharmacies × ~3 min each
          </p>
        </div>

        {/* MegalodonMD */}
        <div className="border border-cyan/20 rounded-lg p-3 bg-cyan/5">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-cyan" strokeWidth={1.5} />
            <span className="text-[10px] font-mono text-cyan font-bold uppercase tracking-wider">MegalodonMD</span>
          </div>
          <p className="text-xl font-bold font-mono text-cyan">{megalodonSeconds}s</p>
          <p className="text-[10px] text-t3 font-mono mt-1">
            {pharmacyCount} pharmacies · {productCount} products
          </p>
        </div>
      </div>

      {/* Speedup bar */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-alert-red/20">
          <div
            className="h-full rounded-full bg-cyan"
            style={{
              width: `${Math.min((parseFloat(megalodonSeconds) / (manualMinutes * 60)) * 100, 100)}%`,
              minWidth: '2px',
            }}
          />
        </div>
        <span className="text-xs font-mono font-bold text-cyan">
          {Math.round((manualMinutes * 60) / parseFloat(megalodonSeconds))}× faster
        </span>
      </div>
    </div>
  );
}
