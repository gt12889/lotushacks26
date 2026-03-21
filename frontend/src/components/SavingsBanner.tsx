'use client';

interface SavingsBannerProps {
  bestPrice: number | null;
  bestSource: string | null;
  priceRange: string | null;
  potentialSavings: number | null;
  totalResults: number;
}

export default function SavingsBanner({ bestPrice, bestSource, priceRange, potentialSavings, totalResults }: SavingsBannerProps) {
  if (!bestPrice) return null;

  return (
    <div className="bg-deep border border-border rounded-lg p-6">
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
      </div>
    </div>
  );
}
