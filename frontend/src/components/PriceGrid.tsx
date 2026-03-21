'use client';

import { useState } from 'react';
import StatusPill from './StatusPill';
import SponsorBadge from './SponsorBadge';

const BRIGHTDATA_SOURCES = new Set(['long_chau', 'pharmacity', 'an_khang']);

interface Product {
  product_name: string;
  price: number;
  original_price: number | null;
  manufacturer: string | null;
  dosage_form: string | null;
  pack_size: number;
  unit_price: number | null;
  in_stock: boolean;
  product_url: string | null;
}

interface PharmacyResult {
  source_id: string;
  source_name: string;
  status: string;
  products: Product[];
}

interface VariantProduct {
  product_name: string;
  price: number;
  original_price: number | null;
  manufacturer: string | null;
  dosage_form: string | null;
  pack_size: number;
  unit_price: number | null;
  in_stock: boolean;
  product_url: string | null;
  source_id: string;
  source_name: string;
  variant_of: string;
}

interface PriceGridProps {
  results: Record<string, PharmacyResult>;
  bestPrice: number | null;
  variantProducts?: VariantProduct[];
}

type SortKey = 'price' | 'unit_price' | 'source' | 'name';

const SOURCE_COLORS: Record<string, string> = {
  long_chau: '#3B82F6',
  pharmacity: '#22C55E',
  an_khang: '#F97316',
  than_thien: '#A855F7',
  medicare: '#14B8A6',
};

export default function PriceGrid({ results, bestPrice, variantProducts = [] }: PriceGridProps) {
  const [sortBy, setSortBy] = useState<SortKey>('price');

  const allProducts: (Product & { source_id: string; source_name: string; variant_of?: string })[] = [];
  for (const [sourceId, result] of Object.entries(results)) {
    if (result.status === 'success') {
      for (const product of result.products) {
        allProducts.push({ ...product, source_id: sourceId, source_name: result.source_name });
      }
    }
  }

  // Merge Tier 3 variant products
  for (const vp of variantProducts) {
    allProducts.push({ ...vp, variant_of: vp.variant_of });
  }

  allProducts.sort((a, b) => {
    switch (sortBy) {
      case 'price': return a.price - b.price;
      case 'unit_price': return (a.unit_price || Infinity) - (b.unit_price || Infinity);
      case 'source': return a.source_name.localeCompare(b.source_name);
      case 'name': return a.product_name.localeCompare(b.product_name);
      default: return 0;
    }
  });

  // Price anomaly detection: compute mean & standard deviation
  const validPrices = allProducts.map(p => p.price).filter(p => p > 0);
  const mean = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : 0;
  const stdDev = validPrices.length > 1
    ? Math.sqrt(validPrices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / validPrices.length)
    : 0;

  function getAnomalyBadge(price: number) {
    if (stdDev === 0 || validPrices.length < 3) return null;
    if (price < mean - 2 * stdDev) {
      return { label: 'Suspiciously Low', color: 'bg-red-500/15 text-red-400 border-red-500/30' };
    }
    if (price > mean + 2 * stdDev) {
      return { label: 'Overpriced', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    }
    if (price === bestPrice) {
      return { label: 'Best Value', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    }
    return null;
  }

  if (allProducts.length === 0) return null;

  return (
    <div className="bioluminescent-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-bold text-t1 uppercase tracking-wider">
          Pricing Abyss Index
          <span className="text-t3 font-normal ml-2 normal-case tracking-normal">({allProducts.length} products)</span>
        </h3>
        <div className="flex gap-1 text-xs">
          {(['price', 'unit_price', 'source', 'name'] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1 rounded transition-colors ${
                sortBy === key ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-t3 hover:text-t2 border border-transparent'
              }`}
            >
              {key === 'unit_price' ? 'Unit' : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider text-t3 font-mono"></th>
              <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider text-t3 font-mono">Drug Name</th>
              <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider text-t3 font-mono">Source</th>
              <th className="text-right py-2.5 px-4 text-[10px] uppercase tracking-wider text-t3 font-mono">Price (VND)</th>
              <th className="text-right py-2.5 px-4 text-[10px] uppercase tracking-wider text-t3 font-mono">Unit</th>
              <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider text-t3 font-mono">Mfr</th>
              <th className="text-center py-2.5 px-4 text-[10px] uppercase tracking-wider text-t3 font-mono">Status</th>
              <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider text-t3 font-mono">Tech</th>
            </tr>
          </thead>
          <tbody>
            {allProducts.map((p, i) => (
              <tr
                key={i}
                className={`border-b border-border/50 hover:bg-card/50 transition-colors ${p.variant_of ? '' : ''}`}
                style={p.variant_of ? { animation: 'fadeSlideIn 0.3s ease-out' } : undefined}
              >
                <td className="py-2.5 px-4">
                  <div className="flex flex-col gap-1">
                    {p.price === bestPrice && <StatusPill status="best" label="BEST" />}
                    {(() => {
                      const badge = getAnomalyBadge(p.price);
                      return badge ? (
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border whitespace-nowrap ${badge.color}`}>
                          {badge.label}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </td>
                <td className="py-2.5 px-4">
                  <div className="text-t1 font-medium">
                    {p.product_url ? (
                      <a href={p.product_url} target="_blank" rel="noopener noreferrer" className="hover:text-cyan transition-colors">{p.product_name}</a>
                    ) : p.product_name}
                  </div>
                  <div className="flex items-center gap-2">
                    {p.manufacturer && <span className="text-[10px] text-t3 font-mono">{p.manufacturer}</span>}
                    {p.variant_of && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan/10 text-cyan border border-cyan/20">
                        variant of {p.variant_of}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SOURCE_COLORS[p.source_id] || '#64748B' }} />
                    <span className="text-t2 text-xs">{p.source_name}</span>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-t1">
                  {p.price.toLocaleString()}
                  {p.original_price && p.original_price > p.price && (
                    <span className="ml-2 text-t3 line-through text-[10px]">{p.original_price.toLocaleString()}</span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-t2 text-xs">
                  {p.unit_price ? `${Math.round(p.unit_price).toLocaleString()}/u` : '—'}
                </td>
                <td className="py-2.5 px-4 text-t3 text-xs">{p.manufacturer || '—'}</td>
                <td className="py-2.5 px-4 text-center">
                  {p.in_stock ? <StatusPill status="active" label="IN STOCK" /> : <StatusPill status="out-of-stock" label="OUT" />}
                </td>
                <td className="py-2.5 px-4">
                  <SponsorBadge sponsors={p.variant_of ? ['TinyFish', 'Exa'] : BRIGHTDATA_SOURCES.has(p.source_id) ? ['TinyFish', 'BrightData'] : ['TinyFish']} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
