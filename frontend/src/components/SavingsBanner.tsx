'use client';

import { Share2 } from 'lucide-react';

interface SavingsBannerProps {
  bestPrice: number | null;
  bestSource: string | null;
  priceRange: string | null;
  potentialSavings: number | null;
  totalResults: number;
  query?: string;
}

function shareViaZalo(query: string, bestPrice: number, bestSource: string, savings: number | null) {
  const text = savings && savings > 0
    ? `MediScrape: ${query} - Best price ${bestPrice.toLocaleString()} VND at ${bestSource}. Save ${savings.toLocaleString()} VND (${Math.round((savings / (bestPrice + savings)) * 100)}%)!`
    : `MediScrape: ${query} - Best price ${bestPrice.toLocaleString()} VND at ${bestSource}`;
  const url = `https://zalo.me/share?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function SavingsBanner({ bestPrice, bestSource, priceRange, potentialSavings, totalResults, query }: SavingsBannerProps) {
  if (!bestPrice) return null;

  return (
    <div className="bioluminescent-card p-6">
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">Best Price Detected</p>
          <p className="text-2xl font-bold font-mono text-success">{bestPrice.toLocaleString()} VND</p>
          <p className="text-xs text-t3">at <span className="text-cyan">{bestSource}</span></p>
        </div>
        {priceRange && (
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">Price Range</p>
            <p className="text-sm font-mono text-t1">{priceRange}</p>
          </div>
        )}
        {potentialSavings && potentialSavings > 0 && (
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">Potential Savings</p>
            <p className="text-xl font-bold font-mono text-warn">
              {potentialSavings.toLocaleString()} VND
              <span className="text-sm ml-1">({Math.round((potentialSavings / (bestPrice + potentialSavings)) * 100)}%)</span>
            </p>
          </div>
        )}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">Total Results</p>
          <p className="text-xl font-bold font-mono text-t1">{totalResults}</p>
        </div>

        {/* Procurement savings calculator */}
        {potentialSavings && potentialSavings > 0 && bestSource && (
          <div className="bg-deep border border-success/20 rounded-lg px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">Procurement Projection</p>
            <p className="text-xs text-t2 leading-relaxed">
              Sourcing from <span className="text-cyan font-medium">{bestSource}</span> saves{' '}
              <span className="text-success font-bold">{potentialSavings.toLocaleString()} VND</span>/unit.
            </p>
            <p className="text-xs text-t2 mt-1">
              At 500 units/month → annual savings:{' '}
              <span className="text-warn font-bold text-base">
                {(potentialSavings * 500 * 12).toLocaleString()} VND
              </span>
            </p>
          </div>
        )}

        {/* Zalo share */}
        {bestSource && query && (
          <button
            onClick={() => shareViaZalo(query, bestPrice, bestSource, potentialSavings ?? null)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0068FF]/10 border border-[#0068FF]/30 text-[#0068FF] hover:bg-[#0068FF]/20 transition-colors text-xs font-mono"
            title="Share via Zalo"
          >
            <Share2 size={14} strokeWidth={1.5} />
            Share via Zalo
          </button>
        )}
      </div>
    </div>
  );
}
