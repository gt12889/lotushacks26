'use client';

import { useState } from 'react';

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

interface PriceGridProps {
  results: Record<string, PharmacyResult>;
  bestPrice: number | null;
}

type SortKey = 'price' | 'unit_price' | 'source' | 'name';

export default function PriceGrid({ results, bestPrice }: PriceGridProps) {
  const [sortBy, setSortBy] = useState<SortKey>('price');

  // Flatten all products with source info
  const allProducts: (Product & { source_id: string; source_name: string })[] = [];
  for (const [sourceId, result] of Object.entries(results)) {
    if (result.status === 'success') {
      for (const product of result.products) {
        allProducts.push({ ...product, source_id: sourceId, source_name: result.source_name });
      }
    }
  }

  // Sort
  allProducts.sort((a, b) => {
    switch (sortBy) {
      case 'price': return a.price - b.price;
      case 'unit_price': return (a.unit_price || Infinity) - (b.unit_price || Infinity);
      case 'source': return a.source_name.localeCompare(b.source_name);
      case 'name': return a.product_name.localeCompare(b.product_name);
      default: return 0;
    }
  });

  if (allProducts.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            Price Comparison ({allProducts.length} products)
          </h3>
          <div className="flex gap-2 text-sm">
            <span className="text-gray-500">Sort by:</span>
            {(['price', 'unit_price', 'source', 'name'] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-1 rounded-full ${
                  sortBy === key ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {key === 'unit_price' ? 'Unit Price' : key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600"></th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Product</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Pharmacy</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">Price (VND)</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">Unit Price</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Manufacturer</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-600">Stock</th>
            </tr>
          </thead>
          <tbody>
            {allProducts.map((p, i) => (
              <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 ${p.price === bestPrice ? 'bg-green-50' : ''}`}>
                <td className="py-3 px-4">
                  {p.price === bestPrice && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                      BEST
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-900 font-medium">
                  {p.product_url ? (
                    <a href={p.product_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                      {p.product_name}
                    </a>
                  ) : p.product_name}
                </td>
                <td className="py-3 px-4 text-gray-600">{p.source_name}</td>
                <td className="py-3 px-4 text-right font-mono text-gray-900 font-medium">
                  {p.price.toLocaleString()}
                  {p.original_price && p.original_price > p.price && (
                    <span className="ml-2 text-gray-400 line-through text-xs">
                      {p.original_price.toLocaleString()}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-mono text-gray-600">
                  {p.unit_price ? `${Math.round(p.unit_price).toLocaleString()}/unit` : '-'}
                </td>
                <td className="py-3 px-4 text-gray-600">{p.manufacturer || '-'}</td>
                <td className="py-3 px-4 text-center">
                  {p.in_stock ? (
                    <span className="text-green-600 text-xs font-medium">In Stock</span>
                  ) : (
                    <span className="text-red-500 text-xs font-medium">Out</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
