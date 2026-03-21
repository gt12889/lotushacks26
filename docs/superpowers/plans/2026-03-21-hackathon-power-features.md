# Hackathon Power Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 high-impact demo features — NL search, multi-drug comparison, landing page video, Exa reference pricing badges, and sparkline charts — to maximize sponsor prize eligibility and demo wow-factor.

**Architecture:** Backend gets 2 new endpoints (NL search orchestrator, reference pricing) plus modifications to existing search/optimize. Frontend gets new components for each feature integrated into existing pages. All features are additive — no existing functionality is modified or broken.

**Tech Stack:** FastAPI, OpenRouter (LLM parsing), TinyFish (agents), Exa (reference pricing), Recharts (sparklines), Next.js 16, React 19, Tailwind v4

---

## File Structure

### Backend (new files)
- `backend/routers/nl_search.py` — Natural language search endpoint
- `backend/services/nl_parser.py` — LLM prompt to parse NL queries into drug lists

### Backend (modified files)
- `backend/routers/search.py` — Add WHO reference badge data to search_complete
- `backend/routers/prices.py` — Add sparkline endpoint
- `backend/main.py` — Register new router
- `backend/config.py` — Add CORS origin for port 3333

### Frontend (new files)
- `frontend/src/components/NLSearchBar.tsx` — Natural language input with parsed drug chips
- `frontend/src/components/ComparisonMatrix.tsx` — Multi-drug sourcing matrix table
- `frontend/src/components/ReferencePriceBadge.tsx` — WHO reference price badge
- `frontend/src/components/SparklineChart.tsx` — Tiny inline sparkline via Recharts

### Frontend (modified files)
- `frontend/src/app/trends/page.tsx` — Add NL search bar + comparison view
- `frontend/src/components/PriceGrid.tsx` — Add reference price badges + sparklines
- `frontend/src/app/page.tsx` — Add video background option
- `frontend/src/app/globals.css` — Video background styles

### Docs (modified files)
- `PLAN.md` — Add Phase 9 with these features
- `PRD.md` — Add NL search, comparison, reference pricing sections
- `SPONSORS.md` — Update OpenRouter and Exa scores
- `README.md` — Update feature list and endpoints

---

## Task 1: NL Search — Backend Parser Service

**Files:**
- Create: `backend/services/nl_parser.py`

- [ ] **Step 1: Create the NL parser service**

```python
# backend/services/nl_parser.py
"""Parse natural language queries into structured drug search lists via OpenRouter."""
import json
import logging
from services.qwen import _call_openrouter

logger = logging.getLogger(__name__)


async def parse_nl_query(text: str, api_key: str) -> dict:
    """Parse a natural language drug request into structured search plan.

    Returns: {"drugs": ["Metformin 500mg", ...], "preferences": {"generic": bool}, "summary": "..."}
    """
    if not api_key or not text:
        return {"drugs": [], "preferences": {}, "summary": text}

    messages = [
        {
            "role": "system",
            "content": (
                "You are a pharmaceutical assistant. Parse the user's natural language request "
                "into specific drug names to search for in Vietnamese pharmacies.\n\n"
                "Return JSON:\n"
                '{"drugs": ["DrugName Dosage", ...], "preferences": {"generic": true/false, "brand": "preferred brand or null"}, '
                '"summary": "Brief 1-line summary of what user needs"}\n\n'
                "Rules:\n"
                "- Extract 1-5 specific drug names with common dosages\n"
                "- If user mentions a condition (diabetes, hypertension), map to standard first-line drugs\n"
                "- If user says 'generic preferred', set generic: true\n"
                "- Always include dosage if inferrable (e.g., Metformin 500mg, Amlodipine 5mg)\n"
                "- Return ONLY valid JSON, no markdown"
            ),
        },
        {"role": "user", "content": text},
    ]

    result = await _call_openrouter(messages, api_key, max_tokens=300)
    if not result:
        return {"drugs": [], "preferences": {}, "summary": text}

    try:
        clean = result.strip()
        if clean.startswith("```"):
            lines = clean.split("\n")
            lines = [l for l in lines[1:] if not l.strip().startswith("```")]
            clean = "\n".join(lines).strip()
        parsed = json.loads(clean)
        if isinstance(parsed, dict) and "drugs" in parsed:
            return parsed
    except (ValueError, json.JSONDecodeError):
        logger.warning(f"NL parser failed to parse: {result[:200]}")

    return {"drugs": [], "preferences": {}, "summary": text}
```

- [ ] **Step 2: Commit**

```bash
git add backend/services/nl_parser.py
git commit -m "feat: add NL query parser service via OpenRouter"
```

---

## Task 2: NL Search — Backend Endpoint

**Files:**
- Create: `backend/routers/nl_search.py`
- Modify: `backend/main.py`

- [ ] **Step 1: Create the NL search router**

```python
# backend/routers/nl_search.py
"""Natural language search — parses NL query, dispatches parallel drug searches, synthesizes results."""
import asyncio
import json
import logging
import time
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from services.nl_parser import parse_nl_query
from services.tinyfish import search_all_pharmacies
from services.qwen import _call_openrouter
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.post("/nl-search")
async def nl_search(
    query: str = Query(..., description="Natural language drug request"),
):
    """Parse NL query into drugs, search all in parallel, return SSE stream with synthesis."""

    async def event_generator():
        # Step 1: Parse NL query
        parse_start = time.time()
        parsed = await parse_nl_query(query, settings.openrouter_api_key)
        parse_ms = int((time.time() - parse_start) * 1000)

        yield f"data: {json.dumps({'type': 'nl_parsed', 'drugs': parsed['drugs'], 'preferences': parsed.get('preferences', {}), 'summary': parsed.get('summary', ''), 'latency_ms': parse_ms})}\n\n"
        yield f"data: {json.dumps({'type': 'model_used', 'step': 'nl_parse', 'model': 'qwen/qwen-2.5-72b-instruct', 'provider': 'OpenRouter', 'latency_ms': parse_ms})}\n\n"

        drugs = parsed.get("drugs", [])
        if not drugs:
            yield f"data: {json.dumps({'type': 'nl_complete', 'error': 'Could not extract drug names from query', 'drugs': [], 'results': {}})}\n\n"
            return

        # Step 2: Parallel search for all drugs
        all_drug_results = {}
        search_tasks = {}
        for drug in drugs:
            search_tasks[drug] = asyncio.create_task(
                search_all_pharmacies(drug, settings.tinyfish_api_key)
            )
            yield f"data: {json.dumps({'type': 'drug_search_started', 'drug': drug})}\n\n"

        for drug, task in search_tasks.items():
            try:
                results = await task
                best_price = None
                best_source = ""
                best_product = ""
                total_products = 0

                drug_sources = {}
                for sid, result in results.items():
                    if result.status == "success":
                        total_products += result.result_count
                        for p in result.products:
                            if best_price is None or p.price < best_price:
                                best_price = p.price
                                best_source = result.source_name
                                best_product = p.product_name
                        drug_sources[sid] = {
                            "source_name": result.source_name,
                            "products": [{"product_name": p.product_name, "price": p.price, "source_name": result.source_name} for p in result.products[:3]],
                            "lowest_price": result.lowest_price,
                        }

                all_drug_results[drug] = {
                    "best_price": best_price,
                    "best_source": best_source,
                    "best_product": best_product,
                    "total_products": total_products,
                    "sources": drug_sources,
                }

                yield f"data: {json.dumps({'type': 'drug_search_complete', 'drug': drug, 'best_price': best_price, 'best_source': best_source, 'total_products': total_products})}\n\n"
            except Exception as e:
                logger.error(f"NL search failed for {drug}: {e}")
                all_drug_results[drug] = {"best_price": None, "best_source": "", "error": str(e)}
                yield f"data: {json.dumps({'type': 'drug_search_complete', 'drug': drug, 'error': str(e)})}\n\n"

        # Step 3: Build sourcing matrix
        matrix = _build_sourcing_matrix(drugs, all_drug_results)

        # Step 4: LLM synthesis/recommendation
        recommendation = await _synthesize_recommendation(
            query, parsed, all_drug_results, matrix, settings.openrouter_api_key
        )

        yield f"data: {json.dumps({'type': 'nl_complete', 'drugs': drugs, 'results': all_drug_results, 'matrix': matrix, 'recommendation': recommendation}, default=str)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


def _build_sourcing_matrix(drugs: list[str], results: dict) -> dict:
    """Build optimal sourcing matrix: which drugs to buy from which pharmacy."""
    # For each pharmacy, calculate total cost if buying all drugs there
    source_totals: dict[str, dict] = {}  # source_name -> {total, drugs}

    # Optimized route: cheapest per drug
    optimized = []
    optimized_total = 0
    for drug in drugs:
        dr = results.get(drug, {})
        if dr.get("best_price"):
            optimized.append({"drug": drug, "source": dr["best_source"], "price": dr["best_price"], "product": dr.get("best_product", "")})
            optimized_total += dr["best_price"]

        # Aggregate single-source totals
        for sid, src_data in dr.get("sources", {}).items():
            sname = src_data["source_name"]
            if sname not in source_totals:
                source_totals[sname] = {"total": 0, "drugs_available": 0}
            lp = src_data.get("lowest_price")
            if lp is not None:
                source_totals[sname]["total"] += lp
                source_totals[sname]["drugs_available"] += 1

    # Best single-source
    best_single = None
    best_single_total = None
    for sname, data in source_totals.items():
        if data["drugs_available"] == len(drugs):
            if best_single_total is None or data["total"] < best_single_total:
                best_single = sname
                best_single_total = data["total"]

    return {
        "optimized_route": optimized,
        "optimized_total": optimized_total,
        "best_single_source": best_single,
        "best_single_total": best_single_total,
        "savings_vs_single": (best_single_total - optimized_total) if best_single_total else None,
        "source_totals": {k: v["total"] for k, v in source_totals.items()},
    }


async def _synthesize_recommendation(
    original_query: str, parsed: dict, results: dict, matrix: dict, api_key: str
) -> str:
    """Use LLM to generate a human-readable recommendation from results."""
    if not api_key:
        return ""

    drugs_summary = []
    for drug, dr in results.items():
        if dr.get("best_price"):
            drugs_summary.append(f"- {drug}: best {dr['best_price']:,} VND at {dr['best_source']}")
        else:
            drugs_summary.append(f"- {drug}: not found")

    context = f"""User asked: "{original_query}"
Parsed drugs: {', '.join(parsed.get('drugs', []))}
Preferences: {'generic preferred' if parsed.get('preferences', {}).get('generic') else 'no preference'}

Search results:
{chr(10).join(drugs_summary)}

Optimized total: {matrix.get('optimized_total', 0):,} VND (buying cheapest per drug)
Best single source: {matrix.get('best_single_source', 'N/A')} at {matrix.get('best_single_total', 0):,} VND
Savings from multi-source: {matrix.get('savings_vs_single', 0):,} VND"""

    messages = [
        {
            "role": "system",
            "content": (
                "You are a pharmaceutical procurement advisor for Vietnamese pharmacies. "
                "Give a concise 3-5 sentence recommendation based on the search results. "
                "Mention specific savings, recommend the optimal sourcing strategy, "
                "and note any drugs that weren't found. Be practical and direct. English only."
            ),
        },
        {"role": "user", "content": context},
    ]

    result = await _call_openrouter(messages, api_key, max_tokens=300)
    return result.strip() if result else ""
```

- [ ] **Step 2: Register the router in main.py**

In `backend/main.py`, add after the existing router imports:
```python
from routers.nl_search import router as nl_search_router
```
And add to the `app.include_router()` calls:
```python
app.include_router(nl_search_router)
```

- [ ] **Step 3: Add port 3333 to CORS origins in config.py**

In `backend/config.py`, change:
```python
cors_origins: str = "http://localhost:3005,http://localhost:3000,http://localhost:3001"
```
to:
```python
cors_origins: str = "http://localhost:3005,http://localhost:3000,http://localhost:3001,http://localhost:3333"
```

- [ ] **Step 4: Commit**

```bash
git add backend/routers/nl_search.py backend/main.py backend/config.py
git commit -m "feat: NL search endpoint with LLM parsing and parallel dispatch"
```

---

## Task 3: NL Search — Frontend Components

**Files:**
- Create: `frontend/src/components/NLSearchBar.tsx`
- Create: `frontend/src/components/ComparisonMatrix.tsx`
- Modify: `frontend/src/app/trends/page.tsx`

- [ ] **Step 1: Create NLSearchBar component**

```tsx
// frontend/src/components/NLSearchBar.tsx
'use client';

import { useState } from 'react';

interface NLSearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

const EXAMPLE_QUERIES = [
  'I need diabetes and blood pressure meds for a clinic, generic preferred',
  'Antibiotics and pain relief for a rural pharmacy',
  'Common cardiovascular drugs, cheapest options',
];

export default function NLSearchBar({ onSearch, loading }: NLSearchBarProps) {
  const [query, setQuery] = useState('');

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">
          Describe what you need
        </label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (query.trim()) onSearch(query.trim());
            }
          }}
          placeholder="e.g. I need diabetes and blood pressure medications for a clinic, generic preferred..."
          rows={2}
          className="w-full px-4 py-3 bg-deep border border-border rounded-lg text-t1 font-mono text-sm placeholder-t3 focus:ring-1 focus:ring-cyan focus:border-cyan outline-none resize-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => query.trim() && onSearch(query.trim())}
          disabled={loading || !query.trim()}
          className="px-6 py-2.5 bg-cyan text-abyss font-bold rounded-lg hover:bg-cyan/80 disabled:bg-t3/30 disabled:text-t3 transition-colors text-sm"
        >
          {loading ? 'Analyzing...' : 'AI Search'}
        </button>
        <span className="text-[10px] text-t3 font-mono">POWERED BY OPENROUTER</span>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-[10px] uppercase tracking-wider text-t3 font-mono">Try:</span>
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => { setQuery(q); onSearch(q); }}
            disabled={loading}
            className="px-3 py-1 text-xs bg-card text-t2 rounded border border-border hover:border-cyan/30 hover:text-cyan transition-colors disabled:opacity-50 text-left"
          >
            {q.length > 50 ? q.slice(0, 50) + '...' : q}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ComparisonMatrix component**

```tsx
// frontend/src/components/ComparisonMatrix.tsx
'use client';

interface MatrixData {
  optimized_route: { drug: string; source: string; price: number; product: string }[];
  optimized_total: number;
  best_single_source: string | null;
  best_single_total: number | null;
  savings_vs_single: number | null;
  source_totals: Record<string, number>;
}

interface DrugResult {
  best_price: number | null;
  best_source: string;
  best_product?: string;
  total_products: number;
  error?: string;
}

interface ComparisonMatrixProps {
  drugs: string[];
  results: Record<string, DrugResult>;
  matrix: MatrixData;
  recommendation: string;
}

export default function ComparisonMatrix({ drugs, results, matrix, recommendation }: ComparisonMatrixProps) {
  if (!drugs.length) return null;

  return (
    <div className="space-y-4">
      {/* Sourcing Matrix */}
      <div className="bg-deep border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-bold text-t1 uppercase tracking-wider">Optimal Sourcing Matrix</h3>
          {matrix.savings_vs_single != null && matrix.savings_vs_single > 0 && (
            <span className="px-3 py-1 bg-success/10 text-success text-xs font-mono rounded-full border border-success/20">
              Save {matrix.savings_vs_single.toLocaleString()}₫ vs single-source
            </span>
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Drug</th>
              <th className="text-left py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Best Source</th>
              <th className="text-left py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Product</th>
              <th className="text-right py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Price</th>
            </tr>
          </thead>
          <tbody>
            {matrix.optimized_route.map((item) => (
              <tr key={item.drug} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                <td className="py-2.5 px-6 text-t1 text-xs font-bold">{item.drug}</td>
                <td className="py-2.5 px-6 text-cyan text-xs">{item.source}</td>
                <td className="py-2.5 px-6 text-t2 text-xs">{item.product}</td>
                <td className="py-2.5 px-6 text-right font-mono text-t1">{item.price.toLocaleString()}₫</td>
              </tr>
            ))}
            {drugs.filter(d => !results[d]?.best_price).map((drug) => (
              <tr key={drug} className="border-b border-border/50 opacity-50">
                <td className="py-2.5 px-6 text-t1 text-xs">{drug}</td>
                <td colSpan={3} className="py-2.5 px-6 text-alert-red text-xs font-mono">Not found</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-cyan/20 bg-cyan/5">
              <td colSpan={3} className="py-3 px-6 text-xs font-bold text-cyan uppercase">Optimized Total</td>
              <td className="py-3 px-6 text-right font-mono font-bold text-cyan text-base">{matrix.optimized_total.toLocaleString()}₫</td>
            </tr>
            {matrix.best_single_source && matrix.best_single_total && (
              <tr className="bg-card/30">
                <td colSpan={3} className="py-2 px-6 text-[10px] text-t3 font-mono">
                  vs. best single source ({matrix.best_single_source})
                </td>
                <td className="py-2 px-6 text-right font-mono text-t3 text-xs">{matrix.best_single_total.toLocaleString()}₫</td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      {/* AI Recommendation */}
      {recommendation && (
        <div className="bg-deep border border-cyan/20 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-cyan font-mono font-bold">AI Recommendation</span>
            <span className="text-[10px] text-t3 font-mono ml-auto">via OpenRouter</span>
          </div>
          <p className="text-sm text-t2 leading-relaxed">{recommendation}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Integrate NL search into trends page**

In `frontend/src/app/trends/page.tsx`, add a new "AI Search" tab/section above the existing search. Add imports at top:
```tsx
import NLSearchBar from '@/components/NLSearchBar';
import ComparisonMatrix from '@/components/ComparisonMatrix';
```

Add state variables inside `TrendsContent`:
```tsx
const [mode, setMode] = useState<'single' | 'ai'>('single');
const [nlLoading, setNlLoading] = useState(false);
const [nlDrugs, setNlDrugs] = useState<string[]>([]);
const [nlResults, setNlResults] = useState<Record<string, any>>({});
const [nlMatrix, setNlMatrix] = useState<any>(null);
const [nlRecommendation, setNlRecommendation] = useState('');
```

Add the NL search handler:
```tsx
const handleNLSearch = async (nlQuery: string) => {
  setNlLoading(true);
  setNlDrugs([]);
  setNlResults({});
  setNlMatrix(null);
  setNlRecommendation('');

  try {
    const res = await fetch(`${API_URL}/api/nl-search?query=${encodeURIComponent(nlQuery)}`, { method: 'POST' });
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === 'nl_parsed') {
            setNlDrugs(event.drugs || []);
          } else if (event.type === 'drug_search_complete') {
            setNlResults(prev => ({ ...prev, [event.drug]: event }));
          } else if (event.type === 'nl_complete') {
            setNlResults(event.results || {});
            setNlMatrix(event.matrix || null);
            setNlRecommendation(event.recommendation || '');
          }
        } catch {}
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    setNlLoading(false);
  }
};
```

Add mode toggle and NL search UI at the top of the JSX return, replacing the current `<div>` header:
```tsx
{/* Mode Toggle */}
<div className="flex items-center gap-2">
  <button
    onClick={() => setMode('single')}
    className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${mode === 'single' ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'bg-card text-t2 border border-border hover:border-cyan/30'}`}
  >
    Single Drug
  </button>
  <button
    onClick={() => setMode('ai')}
    className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${mode === 'ai' ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'bg-card text-t2 border border-border hover:border-cyan/30'}`}
  >
    AI Multi-Search
  </button>
</div>
```

Then conditionally render:
```tsx
{mode === 'ai' ? (
  <>
    <NLSearchBar onSearch={handleNLSearch} loading={nlLoading} />
    {nlDrugs.length > 0 && (
      <div className="flex gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-t3 font-mono">Searching:</span>
        {nlDrugs.map(d => (
          <span key={d} className="px-3 py-1 text-xs bg-cyan/10 text-cyan rounded border border-cyan/30 font-mono">{d}</span>
        ))}
      </div>
    )}
    {nlMatrix && <ComparisonMatrix drugs={nlDrugs} results={nlResults} matrix={nlMatrix} recommendation={nlRecommendation} />}
  </>
) : (
  /* existing single drug search JSX */
)}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/NLSearchBar.tsx frontend/src/components/ComparisonMatrix.tsx frontend/src/app/trends/page.tsx
git commit -m "feat: NL multi-drug search with AI parsing and comparison matrix"
```

---

## Task 4: Exa International Reference Pricing Badge

**Files:**
- Create: `frontend/src/components/ReferencePriceBadge.tsx`
- Modify: `frontend/src/components/PriceGrid.tsx`

- [ ] **Step 1: Create ReferencePriceBadge component**

```tsx
// frontend/src/components/ReferencePriceBadge.tsx
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

  // Try to extract a numeric price from the snippet for comparison
  const priceMatch = whoRef.price_snippet.match(/[\$USD]\s*([\d.]+)/i);
  const refUSD = priceMatch ? parseFloat(priceMatch[1]) : null;
  // Approximate VND conversion (1 USD ≈ 25,500 VND)
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
```

- [ ] **Step 2: Add whoRef prop to PriceGrid**

In `frontend/src/components/PriceGrid.tsx`:

Add import at top:
```tsx
import ReferencePriceBadge from './ReferencePriceBadge';
```

Add `whoRef` to the props interface:
```tsx
interface PriceGridProps {
  results: Record<string, PharmacyResult>;
  bestPrice: number | null;
  variantProducts?: VariantProduct[];
  whoRef?: { price_snippet?: string; source_title?: string; source_url?: string; highlights?: string[] } | null;
}
```

Update the function signature:
```tsx
export default function PriceGrid({ results, bestPrice, variantProducts = [], whoRef = null }: PriceGridProps) {
```

Add the badge in the table header area, after the product count span inside the `px-6 py-4` header div:
```tsx
{whoRef && bestPrice && <ReferencePriceBadge whoRef={whoRef} currentPrice={bestPrice} />}
```

- [ ] **Step 3: Wire whoRef from DashboardHome to PriceGrid**

In `frontend/src/components/DashboardHome.tsx`:

Add `who_reference` to the `ScanSummary` interface:
```tsx
interface ScanSummary {
  // ... existing fields ...
  who_reference?: { price_snippet?: string; source_title?: string; source_url?: string; highlights?: string[] } | null;
}
```

The `search_complete` SSE event already includes `who_reference`. Find the line rendering `<PriceGrid>` and add the prop:
```tsx
<PriceGrid
  results={results}
  bestPrice={scanSummary?.best_price ?? null}
  variantProducts={variantProducts}
  whoRef={scanSummary?.who_reference ?? null}
/>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ReferencePriceBadge.tsx frontend/src/components/PriceGrid.tsx
git commit -m "feat: WHO reference pricing badge via Exa on price grid"
```

---

## Task 5: Historical Price Sparkline Charts

**Files:**
- Create: `frontend/src/components/SparklineChart.tsx`
- Modify: `backend/routers/prices.py` — Add batch sparkline endpoint
- Modify: `frontend/src/components/PharmacyCards.tsx` — Add sparklines

- [ ] **Step 1: Add sparkline endpoint to backend**

In `backend/routers/prices.py`, add a new endpoint after the existing ones:

```python
@router.get("/sparklines/{drug_query}")
async def get_sparklines(drug_query: str, days: int = Query(7, ge=1, le=90)):
    """Return per-source price history for sparkline rendering."""
    db = await get_db()
    try:
        rows = await db.execute_fetchall(
            """SELECT p.source_id, s.name as source_name, p.price, p.observed_at
               FROM prices p
               JOIN sources s ON p.source_id = s.id
               WHERE p.drug_query = ?
               AND p.observed_at >= datetime('now', ?)
               ORDER BY p.source_id, p.observed_at""",
            (drug_query, f'-{days} days'),
        )
        # Group by source
        sparklines: dict = {}
        for row in rows:
            sid = row[0]
            if sid not in sparklines:
                sparklines[sid] = {"source_name": row[1], "points": []}
            sparklines[sid]["points"].append({"price": row[2], "time": row[3]})
        return {"drug_query": drug_query, "sparklines": sparklines}
    finally:
        await db.close()
```

- [ ] **Step 2: Create SparklineChart component**

```tsx
// frontend/src/components/SparklineChart.tsx
'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineChartProps {
  data: { price: number; time: string }[];
  color?: string;
  width?: number;
  height?: number;
}

export default function SparklineChart({ data, color = '#00DBE7', width = 80, height = 24 }: SparklineChartProps) {
  if (!data || data.length < 2) return null;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 3: Integrate sparklines into PharmacyCards**

In `frontend/src/components/PharmacyCards.tsx`, import SparklineChart and add a `sparklines` prop:
```tsx
import SparklineChart from './SparklineChart';
```

Add to props interface:
```tsx
sparklines?: Record<string, { source_name: string; points: { price: number; time: string }[] }>;
```

Render inside each pharmacy card after the price display (after the `response_time_ms` div):
```tsx
{sparklines?.[id]?.points && sparklines[id].points.length >= 2 && (
  <SparklineChart data={sparklines[id].points} color={color} />
)}
```

- [ ] **Step 4: Wire sparkline data from DashboardHome**

In `frontend/src/components/DashboardHome.tsx`:

Add state for sparklines:
```tsx
const [sparklineData, setSparklineData] = useState<Record<string, { source_name: string; points: { price: number; time: string }[] }>>({});
```

Add a `useEffect` that fetches sparkline data when a search completes (after `scanSummary` is set):
```tsx
useEffect(() => {
  if (!scanSummary?.query) return;
  const q = scanSummary.query;
  (async () => {
    try {
      const res = await fetch(`${API_URL}/api/sparklines/${encodeURIComponent(q)}?days=7`);
      const json = await res.json();
      if (json.sparklines) setSparklineData(json.sparklines);
    } catch (e) {
      console.warn('Sparkline fetch failed:', e);
    }
  })();
}, [scanSummary?.query]);
```

Pass sparklines to PharmacyCards:
```tsx
<PharmacyCards results={results} sparklines={sparklineData} />
```

- [ ] **Step 5: Commit**

```bash
git add backend/routers/prices.py frontend/src/components/SparklineChart.tsx frontend/src/components/PharmacyCards.tsx
git commit -m "feat: sparkline price history charts on pharmacy cards"
```

---

## Task 6: Ocean Video Landing Page

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Add video background styles to globals.css**

Append to `frontend/src/app/globals.css`:
```css
.video-bg-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.video-bg-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.3;
}

.video-bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(13,28,50,0.7) 0%, rgba(1,14,36,0.95) 100%);
  z-index: 1;
}
```

- [ ] **Step 2: Update landing page hero with video background**

In `frontend/src/app/page.tsx`, replace the hero section's background elements with:
```tsx
{/* Video Background */}
<div className="video-bg-container">
  <video autoPlay muted loop playsInline>
    <source src="/ocean-bg.mp4" type="video/mp4" />
  </video>
  <div className="video-bg-overlay" />
</div>
```

This is a progressive enhancement — if no video file exists at `public/ocean-bg.mp4`, the page still renders perfectly with the existing gradient background. The video file can be added later without code changes.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/page.tsx frontend/src/app/globals.css
git commit -m "feat: ocean video background on landing page (progressive enhancement)"
```

---

## Task 7: Update Documentation

**Files:**
- Modify: `PLAN.md`
- Modify: `PRD.md`
- Modify: `SPONSORS.md`
- Modify: `README.md`

- [ ] **Step 1: Update PLAN.md**

Add a new Phase 9 section:
```markdown
## Phase 9: Hackathon Power Features (Demo-Day Differentiators)

### 9.1 — NL Multi-Drug Search via OpenRouter
- `POST /api/nl-search` — LLM parses NL query → parallel drug searches → sourcing matrix
- New frontend: NLSearchBar, ComparisonMatrix on Trends page
- Qualifies for OpenRouter sponsor prize

### 9.2 — Exa International Reference Pricing
- WHO reference price badges on PriceGrid products
- Shows multiplier vs global benchmark (e.g., "1.2× WHO price")
- Qualifies for Exa sponsor prize

### 9.3 — Historical Price Sparklines
- `GET /api/sparklines/{drug}` — per-source price history
- SparklineChart component on PharmacyCards
- Visual proof of monitoring capability

### 9.4 — Ocean Video Landing Page
- Progressive enhancement: video bg on hero section
- No dependency on video file existing

### 9.5 — Multi-Drug Comparison Matrix
- Optimal sourcing route table with savings calculation
- AI-generated procurement recommendation via OpenRouter
```

- [ ] **Step 2: Update PRD.md**

Add under a new "Phase 9 Features" section the NL search flow description, reference pricing badge spec, and sparkline chart spec.

- [ ] **Step 3: Update SPONSORS.md**

Update OpenRouter score from 6/10 → 8/10 with:
- ✅ NL query parsing with multi-drug dispatch
- ✅ AI synthesis/recommendation for procurement
- ✅ Demonstrates AI orchestration on top of AI agents

Update Exa score from 7/10 → 8/10 with:
- ✅ WHO international reference pricing badges
- ✅ Visual multiplier comparison (x× global benchmark)

- [ ] **Step 4: Update README.md**

Add new endpoints to the API table:
- `POST /api/nl-search` — Natural language multi-drug search
- `GET /api/sparklines/{drug}` — Price history sparklines

Add to feature list:
- NL multi-drug search with AI orchestration
- WHO reference pricing badges
- Historical price sparkline charts

- [ ] **Step 5: Commit**

```bash
git add PLAN.md PRD.md SPONSORS.md README.md
git commit -m "docs: add Phase 9 power features to all project docs"
```

---

## Execution Order

Tasks should be executed in this order for maximum incremental value:

1. **Task 1** — NL parser service (standalone, no deps)
2. **Task 2** — NL search endpoint (depends on Task 1)
3. **Task 3** — NL search frontend (depends on Task 2)
4. **Task 4** — Reference pricing badge (standalone)
5. **Task 5** — Sparkline charts (standalone)
6. **Task 6** — Video landing page (standalone, 5 min)
7. **Task 7** — Documentation updates (after all features)

Tasks 4, 5, and 6 are independent and can run in parallel.
