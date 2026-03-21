'use client';

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
}

const PHARMACY_COLORS: Record<string, string> = {
  long_chau: 'from-blue-500 to-blue-600',
  pharmacity: 'from-green-500 to-green-600',
  an_khang: 'from-orange-500 to-orange-600',
  than_thien: 'from-purple-500 to-purple-600',
  medicare: 'from-teal-500 to-teal-600',
};

const PHARMACY_INITIALS: Record<string, string> = {
  long_chau: 'LC',
  pharmacity: 'PC',
  an_khang: 'AK',
  than_thien: 'TT',
  medicare: 'MC',
};

function StatusIndicator({ status }: { status: string }) {
  if (status === 'searching') {
    return <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />;
  }
  if (status === 'success') {
    return <div className="w-3 h-3 bg-green-500 rounded-full" />;
  }
  if (status === 'error') {
    return <div className="w-3 h-3 bg-red-500 rounded-full" />;
  }
  return <div className="w-3 h-3 bg-gray-300 rounded-full" />;
}

export default function PharmacyCards({ results }: PharmacyCardsProps) {
  const pharmacies = ['long_chau', 'pharmacity', 'an_khang', 'than_thien', 'medicare'];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {pharmacies.map((id) => {
        const result = results[id];
        const isActive = result && result.status !== 'pending';
        const color = PHARMACY_COLORS[id] || 'from-gray-500 to-gray-600';

        return (
          <div
            key={id}
            className={`rounded-xl p-4 transition-all duration-500 ${
              isActive
                ? `bg-gradient-to-br ${color} text-white shadow-lg scale-100`
                : 'bg-gray-100 text-gray-400 scale-95'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{PHARMACY_INITIALS[id]}</span>
              <StatusIndicator status={result?.status || 'pending'} />
            </div>
            <div className="text-xs opacity-80 mb-2">{result?.source_name || id}</div>
            {result?.status === 'searching' && (
              <div className="text-sm animate-pulse">Searching...</div>
            )}
            {result?.status === 'success' && (
              <>
                <div className="text-sm">{result.result_count} results</div>
                {result.lowest_price && (
                  <div className="text-lg font-bold mt-1">
                    {result.lowest_price.toLocaleString()}đ
                  </div>
                )}
                {result.response_time_ms && (
                  <div className="text-xs opacity-60">{(result.response_time_ms / 1000).toFixed(1)}s</div>
                )}
              </>
            )}
            {result?.status === 'error' && (
              <div className="text-xs text-red-200">Failed</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
