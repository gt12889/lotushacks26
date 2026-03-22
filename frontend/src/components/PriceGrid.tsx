'use client';

import { useState } from 'react';
import MegalodonBadge from './ui/megalodon-badge';
import ReferencePriceBadge from './ReferencePriceBadge';

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
  whoRef?: { price_snippet?: string; source_title?: string; source_url?: string; highlights?: string[] } | null;
}

type SortKey = 'price' | 'unit_price' | 'source' | 'name';

const SOURCE_COLORS: Record<string, string> = {
  long_chau: '#3B82F6',
  pharmacity: '#22C55E',
  an_khang: '#F97316',
  than_thien: '#A855F7',
  medicare: '#14B8A6',
};

export default function PriceGrid({ results, bestPrice, variantProducts = [], whoRef = null }: PriceGridProps) {
  const [sortBy, setSortBy] = useState<SortKey>('price');

  const allProducts: (Product & { source_id: string; source_name: string; variant_of?: string })[] = [];
  for (const [sourceId, result] of Object.entries(results)) {
    if (result.status === 'success') {
      for (const product of result.products) {
        allProducts.push({ ...product, source_id: sourceId, source_name: result.source_name });
      }
    }
  }

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

  const validPrices = allProducts.map(p => p.price).filter(p => p > 0);
  const mean = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : 0;
  const stdDev = validPrices.length > 1
    ? Math.sqrt(validPrices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / validPrices.length)
    : 0;

  function getAnomalyLabel(price: number): { label: string; color: string } | null {
    if (stdDev === 0 || validPrices.length < 3) return null;
    if (price < mean - 2 * stdDev) return { label: 'Low', color: 'text-alert-red' };
    if (price > mean + 2 * stdDev) return { label: 'High', color: 'text-warn' };
    return null;
  }

  if (allProducts.length === 0) return null;

  return (
    <div className="panel overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xs text-t1 font-medium">
            {allProducts.length} products
          </h3>
          {whoRef && bestPrice && <ReferencePriceBadge whoRef={whoRef} currentPrice={bestPrice} />}
        </div>
        <div className="flex gap-0.5 text-[11px]">
          {(['price', 'unit_price', 'source', 'name'] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-2.5 py-1 rounded transition-colors ${
                sortBy === key ? 'bg-cyan/10 text-cyan' : 'text-t3 hover:text-t2'
              }`}
            >
              {key === 'unit_price' ? 'Unit' : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-4 text-[10px] text-t3 font-normal">Product</th>
              <th className="text-left py-2 px-4 text-[10px] text-t3 font-normal">Source</th>
              <th className="text-right py-2 px-4 text-[10px] text-t3 font-normal">Price</th>
              <th className="text-right py-2 px-4 text-[10px] text-t3 font-normal">Unit</th>
              <th className="text-center py-2 px-4 text-[10px] text-t3 font-normal">Stock</th>
            </tr>
          </thead>
          <tbody>
            {allProducts.map((p, i) => {
              const anomaly = getAnomalyLabel(p.price);
              const isBest = p.price === bestPrice;
              return (
                <tr
                  key={i}
                  className="border-b border-border/30 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {isBest && <MegalodonBadge status="best" label="BEST" />}
                      <span className={`text-t1 ${isBest ? 'font-medium' : ''}`}>
                        {p.product_url ? (
                          <a href={p.product_url} target="_blank" rel="noopener noreferrer" className="hover:text-cyan transition-colors">{p.product_name}</a>
                        ) : p.product_name}
                      </span>
                      {anomaly && <span className={`text-[9px] ${anomaly.color}`}>{anomaly.label}</span>}
                    </div>
                    {p.manufacturer && <div className="text-[10px] text-t3 mt-0.5">{p.manufacturer}</div>}
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SOURCE_COLORS[p.source_id] || '#64748B' }} />
                      <span className="text-t2">{p.source_name}</span>
                    </div>
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-t1">
                    {p.price.toLocaleString()}
                    {p.original_price && p.original_price > p.price && (
                      <span className="ml-1.5 text-t3 line-through text-[10px]">{p.original_price.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-t3">
                    {p.unit_price ? `${Math.round(p.unit_price).toLocaleString()}/u` : '—'}
                  </td>
                  <td className="py-2 px-4 text-center">
                    <span className={`text-[10px] ${p.in_stock ? 'text-success' : 'text-t3'}`}>
                      {p.in_stock ? 'In Stock' : 'Out'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
