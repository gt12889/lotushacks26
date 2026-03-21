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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const addDrug = () => setDrugs([...drugs, '']);
  const removeDrug = (i: number) => setDrugs(drugs.filter((_, idx) => idx !== i));
  const updateDrug = (i: number, val: string) => { const u = [...drugs]; u[i] = val; setDrugs(u); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_URL}/api/ocr`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.drugs?.length > 0) setDrugs(data.drugs);
    } catch (e) { console.error('OCR error:', e); }
    finally { setOcrLoading(false); }
  };

  const optimize = async () => {
    const validDrugs = drugs.filter((d) => d.trim());
    if (validDrugs.length === 0) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/optimize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drugs: validDrugs }) });
      setResult(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-t1">Prescription Optimizer</h2>
          <p className="text-xs text-t3 mt-1">Optimal sourcing routes across pharmacy networks</p>
        </div>

        <div className="bg-deep border border-border rounded-lg p-6 space-y-4">
          <div className="border-b border-border pb-6">
            <h4 className="text-[10px] uppercase tracking-wider text-t3 font-mono mb-3">Upload Prescription Photo</h4>
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-cyan/30 transition-colors">
                {imagePreview ? (
                  <img src={imagePreview} alt="Prescription" className="max-h-32 mx-auto rounded mb-2" />
                ) : (
                  <div className="text-t3">
                    <div className="text-3xl mb-2">📷</div>
                    <p className="text-xs">Click to upload prescription photo</p>
                    <p className="text-[10px] text-t3 mt-1">AI will extract drug names automatically</p>
                  </div>
                )}
                {ocrLoading && <p className="text-xs text-cyan animate-pulse mt-2 font-mono">Extracting molecules from image...</p>}
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          <h4 className="text-[10px] uppercase tracking-wider text-t3 font-mono">Prescription Manifest</h4>
          {drugs.map((drug, i) => (
            <div key={i} className="flex gap-3 items-center">
              <span className="text-xs font-mono text-t3 w-6">{i + 1}.</span>
              <input type="text" value={drug} onChange={(e) => updateDrug(i, e.target.value)} placeholder="e.g. Metformin 500mg" className="flex-1 px-4 py-2.5 bg-abyss border border-border rounded-lg text-t1 font-mono placeholder-t3 focus:ring-1 focus:ring-cyan focus:border-cyan outline-none text-sm" />
              {drugs.length > 1 && (
                <button onClick={() => removeDrug(i)} className="px-3 py-2.5 text-alert-red text-xs hover:bg-alert-red/10 rounded-lg transition-colors">Remove</button>
              )}
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={addDrug} className="px-4 py-2 text-xs text-cyan hover:bg-cyan/10 rounded-lg font-mono transition-colors">+ Add Drug</button>
            <button onClick={optimize} disabled={loading || drugs.every((d) => !d.trim())} className="px-6 py-2 bg-cyan text-abyss font-bold rounded-lg text-sm hover:bg-cyan/80 disabled:bg-t3/30 disabled:text-t3 transition-colors">
              {loading ? 'Optimizing...' : 'Calculate Optimal Route'}
            </button>
          </div>
        </div>

        {result && (
          <>
            {result.savings && result.savings > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-deep border border-success/30 rounded-lg p-6 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">Optimized Total</p>
                  <p className="text-3xl font-bold font-mono text-success">{result.total_optimized.toLocaleString()} ₫</p>
                </div>
                <div className="bg-deep border border-alert-red/30 rounded-lg p-6 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">Savings vs {result.best_single_source}</p>
                  <p className="text-3xl font-bold font-mono text-alert-red">-{result.savings.toLocaleString()} ₫</p>
                  <p className="text-xs text-t3 font-mono line-through">{result.total_single_source?.toLocaleString()} ₫</p>
                </div>
              </div>
            )}

            <div className="bg-deep border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-3 border-b border-border">
                <h3 className="text-xs font-bold text-t1 uppercase tracking-wider">Optimized Sourcing Plan</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Drug</th>
                    <th className="text-left py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Best Source</th>
                    <th className="text-left py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Product</th>
                    <th className="text-right py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Price (VND)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                      <td className="py-2.5 px-6 font-medium text-t1">{item.drug}</td>
                      <td className="py-2.5 px-6 text-cyan text-xs font-mono">{item.best_source}</td>
                      <td className="py-2.5 px-6 text-t2 text-xs">{item.product_name}</td>
                      <td className="py-2.5 px-6 text-right font-mono text-t1">{item.best_price.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-card/50 font-bold">
                    <td className="py-2.5 px-6 text-t1" colSpan={3}>Total (Optimized)</td>
                    <td className="py-2.5 px-6 text-right font-mono text-success">{result.total_optimized.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
