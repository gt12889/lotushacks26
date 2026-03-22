'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const METRIC_LABELS: Record<string, string> = {
  prices: 'Prices Tracked',
  anomalies: 'Anomalies Detected',
  violations: 'Violations Flagged',
  savings: 'Total Savings (VND)',
};

function StatsDetailContent() {
  const searchParams = useSearchParams();
  const metric = searchParams.get('metric') || 'prices';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/stats/details?metric=${metric}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [metric]);

  return (
    <div className="min-h-screen bg-[#0A1628] text-[#E2E8F0]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-[#00DBE7] hover:underline text-sm font-mono">&larr; Back</Link>
          <h1 className="text-2xl font-bold">{METRIC_LABELS[metric] || metric}</h1>
        </div>

        {/* Metric tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {Object.entries(METRIC_LABELS).map(([key, label]) => (
            <Link
              key={key}
              href={`/stats?metric=${key}`}
              className={`px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
                metric === key
                  ? 'bg-[#00DBE7]/20 border-[#00DBE7] text-[#00DBE7]'
                  : 'bg-[#0D1B2A] border-[#1E293B] text-[#94A3B8] hover:border-[#00DBE7]/40'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {loading && <p className="text-sm text-[#94A3B8] animate-pulse font-mono">Querying database...</p>}

        {!loading && data && (
          <div className="space-y-6">
            {/* Method / SQL */}
            {data.method && (
              <div className="rounded-lg border border-[#1E293B] bg-[#0D1B2A] p-4">
                <p className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-widest mb-1">Detection Method</p>
                <p className="text-sm text-[#E2E8F0]">{data.method}</p>
              </div>
            )}
            {data.sql && (
              <div className="rounded-lg border border-[#1E293B] bg-[#0D1B2A] p-4">
                <p className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-widest mb-1">SQL Query</p>
                <code className="text-sm text-[#00DBE7] font-mono">{data.sql}</code>
                {data.total !== undefined && (
                  <p className="text-sm text-[#E2E8F0] mt-2">Result: <span className="text-[#00DBE7] font-bold">{data.total.toLocaleString()}</span></p>
                )}
              </div>
            )}

            {/* Gov ceilings for violations */}
            {data.gov_ceilings && (
              <div className="rounded-lg border border-[#1E293B] bg-[#0D1B2A] p-4">
                <p className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-widest mb-3">Government Ceiling Prices (DAV)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {data.gov_ceilings.map((g: any, i: number) => (
                    <div key={i} className="text-xs font-mono">
                      <span className="text-[#E2E8F0]">{g.drug_name}</span>
                      <span className="text-[#94A3B8]"> — </span>
                      <span className="text-[#00DBE7]">{g.ceiling_price.toLocaleString()} {g.unit}/unit</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Savings total */}
            {metric === 'savings' && data.total !== undefined && (
              <div className="rounded-lg border border-[#00DBE7]/30 bg-[#00DBE7]/5 p-4">
                <p className="text-sm text-[#94A3B8]">Total addressable savings across all drugs:</p>
                <p className="text-3xl font-bold text-[#00DBE7] mt-1">{data.total.toLocaleString()} VND</p>
              </div>
            )}

            {/* Data table */}
            {(data.rows || data.sample_rows) && (
              <div className="rounded-lg border border-[#1E293B] overflow-hidden">
                <div className="bg-[#0D1B2A] px-4 py-2 border-b border-[#1E293B] flex items-center justify-between">
                  <p className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-widest">
                    Source Rows ({(data.rows || data.sample_rows).length}{data.total ? ` of ${data.total.toLocaleString()}` : ''})
                  </p>
                  <a
                    href={`${API_URL}/api/stats/details?metric=${metric}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono text-[#00DBE7] hover:underline"
                  >
                    Raw JSON &rarr;
                  </a>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#1E293B] bg-[#0D1B2A]/50">
                        {Object.keys((data.rows || data.sample_rows)[0] || {}).map((col) => (
                          <th key={col} className="px-3 py-2 text-left text-[#94A3B8] uppercase tracking-wider text-[10px] whitespace-nowrap">
                            {col.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(data.rows || data.sample_rows).map((row: any, i: number) => (
                        <tr key={i} className="border-b border-[#1E293B]/50 hover:bg-[#1E293B]/30">
                          {Object.values(row).map((val: any, j: number) => {
                            const isNumber = typeof val === 'number';
                            const colName = Object.keys(row)[j];
                            const isHighlight = colName === 'z_score' || colName === 'pct_above' || colName === 'spread';
                            return (
                              <td
                                key={j}
                                className={`px-3 py-2 whitespace-nowrap ${
                                  isHighlight ? 'text-[#F97316] font-semibold' : isNumber ? 'text-[#E2E8F0]' : 'text-[#94A3B8]'
                                }`}
                              >
                                {isNumber ? val.toLocaleString() : String(val ?? '')}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A1628] text-[#94A3B8] flex items-center justify-center font-mono text-sm">Loading...</div>}>
      <StatsDetailContent />
    </Suspense>
  );
}
