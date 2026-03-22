'use client';

import { useState, useCallback, useRef } from 'react';
import { Camera } from 'lucide-react';
import AgentActivityFeed from '@/components/AgentActivityFeed';
import LiveMetricsBar from '@/components/LiveMetricsBar';
import AgentCascade from '@/components/AgentCascade';
import { ApiErrorBanner } from '@/components/ApiErrorBanner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useLocale } from '@/components/LocaleProvider';
import MagicRings from '@/components/MagicRings';
import SponsorBadge from '@/components/SponsorBadge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface AgentEvent {
  id: string;
  timestamp: number;
  type: 'spawn' | 'searching' | 'success' | 'error' | 'variant';
  agent: string;
  message: string;
  source_id?: string;
}

interface OptimizeResult {
  items: { drug: string; best_source: string; best_price: number; product_name: string }[];
  total_optimized: number;
  total_single_source: number | null;
  savings: number | null;
  best_single_source: string | null;
}

export default function OptimizePage() {
  const { t } = useLocale();
  const [drugs, setDrugs] = useState(['']);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [drugsTotal, setDrugsTotal] = useState(0);
  const [drugsComplete, setDrugsComplete] = useState(0);
  const [productsFound, setProductsFound] = useState(0);
  const [streamActive, setStreamActive] = useState(false);
  const eventIdRef = useRef(0);

  const addDrug = () => setDrugs([...drugs, '']);
  const removeDrug = (i: number) => setDrugs(drugs.filter((_, idx) => idx !== i));
  const updateDrug = (i: number, val: string) => { const u = [...drugs]; u[i] = val; setDrugs(u); };

  const addAgentEvent = useCallback((type: AgentEvent['type'], agent: string, message: string) => {
    const evt: AgentEvent = {
      id: String(++eventIdRef.current),
      timestamp: Date.now(),
      type,
      agent,
      message,
    };
    setAgentEvents(prev => [...prev, evt]);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Reset state
    setPageError(null);
    setOcrLoading(true);
    setResult(null);
    setAgentEvents([]);
    setDrugsTotal(0);
    setDrugsComplete(0);
    setProductsFound(0);
    setStreamActive(true);
    eventIdRef.current = 0;

    addAgentEvent('spawn', 'OCR Agent', 'Extracting molecules from prescription image...');

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_URL}/api/ocr`, { method: 'POST', body: formData });
      if (!res.ok) {
        setPageError(t('error.server', { status: res.status }));
        setStreamActive(false);
        setOcrLoading(false);
        return;
      }
      const data = await res.json();

      if (data.drugs?.length > 0) {
        setDrugs(data.drugs);
        addAgentEvent('success', 'OCR Agent', `Extracted ${data.drugs.length} drug(s): ${data.drugs.join(', ')}`);
      } else {
        addAgentEvent('error', 'OCR Agent', 'No drugs detected in image');
        setStreamActive(false);
        setOcrLoading(false);
        return;
      }
      setOcrLoading(false);

      // Now stream optimize
      setLoading(true);
      addAgentEvent('spawn', 'Orchestrator', `Deploying pharmacy agents for ${data.drugs.length} drug(s)`);

      const sseRes = await fetch(`${API_URL}/api/optimize/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugs: data.drugs }),
      });

      if (!sseRes.ok || !sseRes.body) {
        setPageError(t('error.server', { status: sseRes.status }));
        return;
      }

      const sseReader = sseRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await sseReader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const dataMatch = line.match(/^data: (.+)$/m);
          if (!dataMatch) continue;
          try {
            const event = JSON.parse(dataMatch[1]);

            if (event.type === 'optimize_start') {
              setDrugsTotal(event.total_drugs);
            } else if (event.type === 'drug_started') {
              addAgentEvent('searching', `${event.drug} Agent`, `Scanning pharmacies for ${event.drug}...`);
            } else if (event.type === 'drug_complete') {
              setDrugsComplete(prev => prev + 1);
              setProductsFound(prev => prev + (event.products_found || 0));
              if (event.best_price !== null) {
                addAgentEvent('success', `${event.drug} Agent`, `Best: ${event.best_price.toLocaleString()} VND @ ${event.best_source} (${event.products_found} products)`);
              } else {
                addAgentEvent('error', `${event.drug} Agent`, 'No results found');
              }
            } else if (event.type === 'optimize_complete') {
              setResult({
                items: event.items,
                total_optimized: event.total_optimized,
                total_single_source: event.total_single_source,
                savings: event.savings,
                best_single_source: event.best_single_source,
              });
              addAgentEvent('success', 'Orchestrator', `Optimization complete — saved ${event.savings?.toLocaleString() ?? 0} VND`);
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      console.error('Optimize stream error:', err);
      const msg = err instanceof TypeError ? t('error.network') : t('error.optimize');
      setPageError(msg);
      addAgentEvent('error', 'System', 'Stream connection lost');
    } finally {
      setOcrLoading(false);
      setLoading(false);
      setStreamActive(false);
    }
  };

  const optimize = async () => {
    const validDrugs = drugs.filter((d) => d.trim());
    if (validDrugs.length === 0) return;
    setPageError(null);
    setLoading(true);
    setResult(null);
    setAgentEvents([]);
    setDrugsTotal(validDrugs.length);
    setDrugsComplete(0);
    setProductsFound(0);
    setStreamActive(true);
    eventIdRef.current = 0;

    addAgentEvent('spawn', 'Orchestrator', `Deploying pharmacy agents for ${validDrugs.length} drug(s)`);

    try {
      const sseRes = await fetch(`${API_URL}/api/optimize/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugs: validDrugs }),
      });

      if (!sseRes.ok || !sseRes.body) {
        setPageError(t('error.server', { status: sseRes.status }));
        return;
      }

      const sseReader = sseRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await sseReader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const dataMatch = line.match(/^data: (.+)$/m);
          if (!dataMatch) continue;
          try {
            const event = JSON.parse(dataMatch[1]);

            if (event.type === 'optimize_start') {
              setDrugsTotal(event.total_drugs);
            } else if (event.type === 'drug_started') {
              addAgentEvent('searching', `${event.drug} Agent`, `Scanning pharmacies for ${event.drug}...`);
            } else if (event.type === 'drug_complete') {
              setDrugsComplete(prev => prev + 1);
              setProductsFound(prev => prev + (event.products_found || 0));
              if (event.best_price !== null) {
                addAgentEvent('success', `${event.drug} Agent`, `Best: ${event.best_price.toLocaleString()} VND @ ${event.best_source} (${event.products_found} products)`);
              } else {
                addAgentEvent('error', `${event.drug} Agent`, 'No results found');
              }
            } else if (event.type === 'optimize_complete') {
              setResult({
                items: event.items,
                total_optimized: event.total_optimized,
                total_single_source: event.total_single_source,
                savings: event.savings,
                best_single_source: event.best_single_source,
              });
              addAgentEvent('success', 'Orchestrator', `Optimization complete — saved ${event.savings?.toLocaleString() ?? 0} VND`);
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      console.error('Optimize stream error:', err);
      const msg = err instanceof TypeError ? t('error.network') : t('error.optimize');
      setPageError(msg);
      addAgentEvent('error', 'System', 'Stream connection lost');
    } finally {
      setLoading(false);
      setStreamActive(false);
    }
  };

  const isActive = ocrLoading || loading || streamActive;
  const agentsSpawned = agentEvents.filter(e => e.type === 'spawn').length;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <MagicRings
          color="#fc42ff"
          colorTwo="#42fcff"
          ringCount={6}
          speed={1}
          attenuation={10}
          lineThickness={2}
          baseRadius={0.35}
          radiusStep={0.1}
          scaleRate={0.1}
          opacity={1}
          blur={0}
          noiseAmount={0.1}
          rotation={0}
          ringGap={1.5}
          fadeIn={0.7}
          fadeOut={0.5}
          followMouse={false}
          mouseInfluence={0.2}
          hoverScale={1.2}
          parallax={0.05}
          clickBurst={false}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-abyss/60 via-abyss/50 to-abyss/60 pointer-events-none"
          aria-hidden
        />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-t1">Prescription Optimizer</h2>
          <p className="text-xs text-t3 mt-1">Optimal sourcing routes across pharmacy networks</p>
        </div>

        {pageError && (
          <ApiErrorBanner message={pageError} onDismiss={() => setPageError(null)} />
        )}

        <div className="bg-deep border border-border rounded-lg p-6 space-y-4">
          <div className="border-b border-border pb-6">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-xs uppercase tracking-wider text-t3 font-mono">Upload Prescription Photo</h4>
              <SponsorBadge sponsors={['OpenAI']} />
            </div>
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-cyan/30 transition-colors">
                {imagePreview ? (
                  <img src={imagePreview} alt="Prescription" className="max-h-32 mx-auto rounded mb-2" />
                ) : (
                  <div className="text-t3">
                    <Camera size={28} className="text-t3 mx-auto mb-2" />
                    <p className="text-xs">Click to upload prescription photo</p>
                    <p className="text-xs text-t3 mt-1">AI will extract drug names automatically</p>
                  </div>
                )}
                {ocrLoading && (
                  <div className="flex items-center justify-center gap-2 mt-3 text-xs text-cyan font-mono">
                    <LoadingSpinner size="sm" />
                    <span>Reading prescription…</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <h4 className="text-xs uppercase tracking-wider text-t3 font-mono">Prescription Manifest</h4>
            <SponsorBadge sponsors={['TinyFish']} />
          </div>
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
            <button
              onClick={optimize}
              disabled={loading || drugs.every((d) => !d.trim())}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-cyan text-abyss font-bold rounded-lg text-sm hover:bg-cyan/80 disabled:bg-t3/30 disabled:text-t3 transition-colors"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="[&_span]:border-abyss/30 [&_span]:border-t-abyss" />
                  Optimizing...
                </>
              ) : (
                'Calculate Optimal Route'
              )}
            </button>
          </div>
        </div>

        {/* Agent Cascade Pipeline */}
        <AgentCascade
          tier0Active={ocrLoading}
          tier1Active={loading ? drugsTotal - drugsComplete : 0}
          tier1Complete={drugsComplete}
          tier1Total={drugsTotal}
          tier2Variants={0}
          tier3ScoutSpawnCount={0}
          tier4AnalystActive={false}
          tier4AnalystComplete={false}
          tier5InvestigationCount={0}
          visible={isActive || !!result}
        />

        {/* Live Metrics Bar */}
        {(isActive || result) && (
          <LiveMetricsBar
            agentsSpawned={agentsSpawned}
            pharmaciesComplete={drugsComplete}
            pharmaciesTotal={drugsTotal}
            productsFound={productsFound}
            savingsVnd={result?.savings ?? null}
            isActive={isActive}
          />
        )}

        {/* Agent Activity Feed */}
        {agentEvents.length > 0 && (
          <AgentActivityFeed events={agentEvents} isActive={isActive} />
        )}

        {result && (
          <>
            {result.savings && result.savings > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-deep border border-success/30 rounded-lg p-6 text-center">
                  <p className="text-xs uppercase tracking-wider text-t3 font-mono mb-1">Optimized Total</p>
                  <p className="text-3xl font-bold font-mono text-success">{result.total_optimized.toLocaleString()} ₫</p>
                </div>
                <div className="bg-deep border border-alert-red/30 rounded-lg p-6 text-center">
                  <p className="text-xs uppercase tracking-wider text-t3 font-mono mb-1">Savings vs {result.best_single_source}</p>
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
                    <th className="text-left py-2.5 px-6 text-xs uppercase tracking-wider text-t3 font-mono">Drug</th>
                    <th className="text-left py-2.5 px-6 text-xs uppercase tracking-wider text-t3 font-mono">Best Source</th>
                    <th className="text-left py-2.5 px-6 text-xs uppercase tracking-wider text-t3 font-mono">Product</th>
                    <th className="text-right py-2.5 px-6 text-xs uppercase tracking-wider text-t3 font-mono">Price (VND)</th>
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

