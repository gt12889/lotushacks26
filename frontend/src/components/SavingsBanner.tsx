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
    ? `MegalodonMD: ${query} - Best price ${bestPrice.toLocaleString()} VND at ${bestSource}. Save ${savings.toLocaleString()} VND (${Math.round((savings / (bestPrice + savings)) * 100)}%)!`
    : `MegalodonMD: ${query} - Best price ${bestPrice.toLocaleString()} VND at ${bestSource}`;
  const url = `https://zalo.me/share?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function SavingsBanner({ bestPrice, bestSource, priceRange, potentialSavings, totalResults, query }: SavingsBannerProps) {
  if (!bestPrice) return null;

  const savingsPct = potentialSavings && potentialSavings > 0
    ? Math.round((potentialSavings / (bestPrice + potentialSavings)) * 100)
    : null;

  return (
    <div className="panel p-4">
      <div className="flex items-center gap-6 flex-wrap">
        {/* Best price */}
        <div>
          <p className="text-[10px] text-t3 mb-0.5">Best price</p>
          <p className="text-xl font-bold font-mono text-success">{bestPrice.toLocaleString()} <span className="text-sm font-normal text-t3">VND</span></p>
          <p className="text-[11px] text-t3">at <span className="text-t2">{bestSource}</span></p>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-border hidden md:block" />

        {/* Range */}
        {priceRange && (
          <div>
            <p className="text-[10px] text-t3 mb-0.5">Range</p>
            <p className="text-sm font-mono text-t1">{priceRange}</p>
          </div>
        )}

        {/* Savings */}
        {potentialSavings && potentialSavings > 0 && (
          <div>
            <p className="text-[10px] text-t3 mb-0.5">Savings</p>
            <p className="text-lg font-bold font-mono text-warn">
              {potentialSavings.toLocaleString()} <span className="text-sm font-normal">({savingsPct}%)</span>
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="w-px h-10 bg-border hidden md:block" />

        {/* Results count */}
        <div>
          <p className="text-[10px] text-t3 mb-0.5">Products</p>
          <p className="text-lg font-bold font-mono text-t1">{totalResults}</p>
        </div>

        {/* Zalo share — pushed right */}
        {bestSource && query && (
          <button
            onClick={() => shareViaZalo(query, bestPrice, bestSource, potentialSavings ?? null)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-t3 hover:text-cyan hover:bg-cyan/5 transition-colors text-[11px]"
            title="Share via Zalo"
          >
            <Share2 size={12} strokeWidth={1.5} />
            Share
          </button>
        )}
      </div>
    </div>
  );
}
