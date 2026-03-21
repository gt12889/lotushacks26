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
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm font-medium text-green-700">Best Price Found</p>
          <p className="text-3xl font-bold text-green-900">{bestPrice.toLocaleString()} VND</p>
          <p className="text-sm text-green-600">at {bestSource}</p>
        </div>
        {priceRange && (
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Price Range</p>
            <p className="text-lg font-semibold text-gray-900">{priceRange}</p>
          </div>
        )}
        {potentialSavings && potentialSavings > 0 && (
          <div className="text-center">
            <p className="text-sm font-medium text-orange-600">Potential Savings</p>
            <p className="text-2xl font-bold text-orange-700">{potentialSavings.toLocaleString()} VND</p>
            <p className="text-xs text-orange-500">vs most expensive option</p>
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600">Total Results</p>
          <p className="text-2xl font-bold text-gray-900">{totalResults}</p>
        </div>
      </div>
    </div>
  );
}
