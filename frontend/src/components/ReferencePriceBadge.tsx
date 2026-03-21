'use client';

import SponsorBadge from './SponsorBadge';

interface ReferencePriceBadgeProps {
  whoRef: {
    price_snippet?: string;
    source_title?: string;
    source_url?: string;
    highlights?: string[];
  } | null;
  currentPrice: number;
}

export default function ReferencePriceBadge({ whoRef, currentPrice }: ReferencePriceBadgeProps) {
  if (!whoRef || !whoRef.price_snippet) return null;

  const priceMatch = whoRef.price_snippet.match(/[\$USD]\s*([\d.]+)/i);
  const refUSD = priceMatch ? parseFloat(priceMatch[1]) : null;
  const refVND = refUSD ? Math.round(refUSD * 25500) : null;
  const ratio = refVND ? (currentPrice / refVND).toFixed(1) : null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] font-mono">
      <span className="text-purple-400">WHO</span>
      {refVND ? (
        <span className="text-t2">
          ~{refVND.toLocaleString()}₫
          {ratio && <span className={`ml-1 ${parseFloat(ratio) > 2 ? 'text-warn' : 'text-success'}`}>({ratio}×)</span>}
        </span>
      ) : (
        <span className="text-t3 truncate max-w-[150px]">{whoRef.price_snippet.slice(0, 60)}</span>
      )}
      <SponsorBadge sponsors={['Exa']} />
    </div>
  );
}
