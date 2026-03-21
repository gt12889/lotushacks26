'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface OptimizeResult {
  items: { drug: string; best_source: string; best_price: number; product_name: string }[];
  total_optimized: number;
  total_single_source: number | null;
  savings: number | null;
  best_single_source: string | null;
}

export default function OptimizePage() {
  const [drugs, setDrugs] = useState(['']);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const addDrug = () => setDrugs([...drugs, '']);
  const removeDrug = (i: number) => setDrugs(drugs.filter((_, idx) => idx !== i));
  const updateDrug = (i: number, val: string) => {
    const updated = [...drugs];
    updated[i] = val;
    setDrugs(updated);
  };

  const optimize = async () => {
    const validDrugs = drugs.filter((d) => d.trim());
    if (validDrugs.length === 0) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugs: validDrugs }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Prescription Optimizer</h2>
        <p className="text-gray-500">Enter multiple drugs to find the cheapest sourcing plan across all pharmacies.</p>

        {/* Drug input rows */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-3">
          {drugs.map((drug, i) => (
            <div key={i} className="flex gap-3 items-center">
              <span className="text-sm font-medium text-gray-400 w-6">{i + 1}.</span>
              <input
                type="text"
                value={drug}
                onChange={(e) => updateDrug(i, e.target.value)}
                placeholder="e.g. Metformin 500mg"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
              />
              {drugs.length > 1 && (
                <button
                  onClick={() => removeDrug(i)}
                  className="px-3 py-3 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button
              onClick={addDrug}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
            >
              + Add Drug
            </button>
            <button
              onClick={optimize}
              disabled={loading || drugs.every((d) => !d.trim())}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Optimizing...' : 'Optimize Sourcing'}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Savings banner */}
            {result.savings && result.savings > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-700">Optimized Total</p>
                    <p className="text-3xl font-bold text-green-900">{result.total_optimized.toLocaleString()} VND</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">vs {result.best_single_source}</p>
                    <p className="text-lg text-gray-500 line-through">{result.total_single_source?.toLocaleString()} VND</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-orange-600">You Save</p>
                    <p className="text-2xl font-bold text-orange-700">{result.savings.toLocaleString()} VND</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sourcing plan table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Optimized Sourcing Plan</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-6 font-semibold text-gray-600">Drug</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-600">Best Source</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-600">Product</th>
                    <th className="text-right py-3 px-6 font-semibold text-gray-600">Price (VND)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-3 px-6 font-medium text-gray-900">{item.drug}</td>
                      <td className="py-3 px-6 text-blue-600 font-medium">{item.best_source}</td>
                      <td className="py-3 px-6 text-gray-700">{item.product_name}</td>
                      <td className="py-3 px-6 text-right font-mono text-gray-900">{item.best_price.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td className="py-3 px-6 text-gray-900" colSpan={3}>Total (Optimized)</td>
                    <td className="py-3 px-6 text-right font-mono text-green-700">{result.total_optimized.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
