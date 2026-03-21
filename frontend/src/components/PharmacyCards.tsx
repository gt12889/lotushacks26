'use client';

import StatusPill from './StatusPill';

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

export default function PharmacyCards({ results }: PharmacyCardsProps) {
  const pharmacies = ['long_chau', 'pharmacity', 'an_khang', 'than_thien', 'medicare'];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {pharmacies.map((id) => {
        const result = results[id];
        const color = SOURCE_COLORS[id] || '#64748B';
        const statusType = result?.status === 'success' ? 'active' : result?.status === 'error' ? 'error' : result?.status === 'searching' ? 'searching' : 'monitor';

        return (
          <div
            key={id}
            className="bg-deep border border-border rounded-lg p-4 transition-all duration-500"
            style={{ borderLeftColor: result ? color : undefined, borderLeftWidth: result ? 3 : 1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold font-mono text-t1">{PHARMACY_INITIALS[id]}</span>
              {result && <StatusPill status={statusType} />}
            </div>
            <div className="text-[10px] text-t3 mb-2">{result?.source_name || id}</div>
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
              </>
            )}
            {result?.status === 'error' && (
              <div className="text-[10px] text-alert-red font-mono">Signal lost</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
