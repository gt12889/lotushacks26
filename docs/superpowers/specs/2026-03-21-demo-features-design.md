# Demo Features Spec — MediScrape LotusHacks 2026

**Date**: 2026-03-21
**Scope**: 5 features to build: Wire AgentCascade, Exa auto-spawn (scout-spawn), Government ceiling panel, Model router panel, Optimize page agent feed

---

## 1. Wire AgentCascade Tree Visualization

**Status**: Component exists (`AgentCascade.tsx`, 107 lines), never imported.

**Placement**: Above PharmacyCards, below MetricsBar. Flow becomes:
```
MetricsBar → AgentCascade tree → PharmacyCards → ActivityFeed → SavingsBanner → PriceGrid
```

**Data source**: AgentCascade already accepts props for tier status. Derive from existing state:
- `tier0Active`: true when OCR is running (optimize page only)
- `tier1Active`: `isSearching && pharmaciesComplete < 5`
- `tier1Complete`: `pharmaciesComplete`
- `tier1Total`: 5
- `tier2Variants`: count of variant agent events
- `visible`: `isSearching || hasResults`

**Work**: One import + one `<AgentCascade>` render in `page.tsx` with derived props. ~5 min.

---

## 2. Exa Scout-Spawn (Tier 3 Auto-Search)

**Current state**: Tier 2 variant discovery returns variant names in summary. Frontend shows clickable chips. No auto-search.

### Backend changes (`routers/search.py`)

After Tier 2 variant tasks complete and `all_variants` is populated:

1. **Determine successful pharmacies** from Tier 1 results (only pharmacies with `status == "success"`).
2. **For each variant** in `all_variants`, spawn Tier 3 search agents against only successful pharmacies. These are new `asyncio.create_task` calls to `search_single_pharmacy_safe()`.
3. **Emit SSE events** for each Tier 3 agent: `agent_spawn` (tier=3), then `agent_complete`/`agent_fail` with results.
4. **Emit pharmacy results** for Tier 3 as they complete — same format as Tier 1 but with an added `"variant_of": "metformin"` field to distinguish from original results.
5. **Add variant-discovered products to a separate list** that gets merged into the final summary.
6. After all Tier 3 agents complete, emit an updated `search_complete` summary with combined totals.

### SSE event additions

New fields on existing events:
- `agent_spawn`: add `"variant_of": "original_query"` for Tier 3 agents
- Pharmacy result events from Tier 3: add `"is_variant_result": true` and `"variant_of": "Glucophage"`

### Frontend changes (`page.tsx`)

- Parse Tier 3 pharmacy results from SSE. Add to `results` state with a `_variant` suffix on source_id to avoid overwriting Tier 1 results (e.g., `long_chau_glucophage`).
- Or better: accumulate variant products in a separate `variantProducts` state array.
- Agent events for Tier 3 feed into `AgentActivityFeed` naturally (they have the same shape).
- MetricsBar: `agentsSpawned` count increases as Tier 3 agents spawn.

### PriceGrid changes

- Variant-discovered products mixed into the same table, sorted by price.
- Products from Tier 3 get an `[Exa Discovery]` badge via `SponsorBadge`.
- New rows animate in with a slide-in CSS transition on mount.
- Implementation: track which product indices are "new" via a ref, apply `animate-[fadeSlideIn_0.3s_ease-out]` class for 1 render cycle.

### Cancellation

- On new search (`handleSearch`), cancel all in-flight tasks. Use an `AbortController` ref — abort it on new search, create a new one. Backend: wrap the SSE generator in a try/finally that checks for client disconnect.

### Timing

- Tier 3 agents only search pharmacies that returned results for the original query (not all 5).
- If original search found results at 3 pharmacies and Exa returned 3 variants: 3 × 3 = 9 Tier 3 agents.
- Expected additional latency: 2-5s (mock mode) or 30-60s (live TinyFish).

---

## 3. Government Ceiling Cross-Reference Panel

**Current state**: `database.py` has `gov_prices` table with 5 hardcoded drugs and `check_price_compliance()` function. Neither is called.

### Backend

**New endpoint**: `GET /api/compliance/{drug_query}`

```python
@router.get("/api/compliance/{drug_query}")
async def check_compliance(drug_query: str):
    """Check product prices against DAV government ceiling prices."""
    db = await get_db()
    # Fuzzy match: normalize drug_query, search gov_prices
    ceiling = await db.execute(
        "SELECT * FROM gov_prices WHERE LOWER(drug_name) LIKE ?",
        (f"%{drug_query.lower().split()[0]}%",)
    )
    row = await ceiling.fetchone()
    if not row:
        return {"has_ceiling": False, "drug_query": drug_query}
    return {
        "has_ceiling": True,
        "drug_name": row["drug_name"],
        "ceiling_price": row["ceiling_price"],
        "unit": row["unit"],
        "source": row["source"],
        "effective_date": row["effective_date"],
    }
```

**Also**: Add ceiling data to `search_complete` summary event. After computing `all_prices`, call `check_price_compliance()` for each product and include results.

### SSE addition

Add to `search_complete` event:
```json
"compliance": {
  "has_ceiling": true,
  "drug_name": "Metformin 500mg",
  "ceiling_price_per_unit": 1500,
  "violations": [
    {"product": "Glucophage XR 500mg", "unit_price": 4500, "delta_percent": 200, "source": "An Khang"}
  ],
  "compliant_count": 6,
  "violation_count": 2
}
```

### Frontend component: `CeilingPanel.tsx`

**Always visible** below SavingsBanner when search results exist.

Layout:
```
┌─────────────────────────────────────────────────┐
│ DAV PRICE CEILING ANALYSIS                      │
│                                                 │
│ Drug: Metformin 500mg                           │
│ Government Ceiling: ₫1,500/tablet               │
│ Source: dav.gov.vn │ Effective: 2024-01-01      │
│                                                 │
│ ✅ 6 products below ceiling                     │
│ ❌ 2 products above ceiling                     │
│                                                 │
│ Violations:                                     │
│  🔴 Glucophage XR 500mg — ₫4,500/unit (+200%)  │
│  🟡 Glucophage 500mg    — ₫1,780/unit (+19%)   │
└─────────────────────────────────────────────────┘
```

When `has_ceiling` is false:
```
┌─────────────────────────────────────────────────┐
│ DAV PRICE CEILING ANALYSIS                      │
│                                                 │
│ No DAV ceiling data registered for "losartan"   │
│ Submit inquiry → dav.gov.vn                     │
└─────────────────────────────────────────────────┘
```

**Color-coded severity**:
- Green (`text-success`): unit price below ceiling
- Yellow (`text-warn`): 1-50% above ceiling
- Red (`text-alert-red`): >50% above ceiling

**Unit price comparison**: Divide `product.price` by `product.pack_size`, compare to `ceiling_price`. If `pack_size == 1` (default/unknown), show a small warning icon noting pack size was estimated.

---

## 4. Model Router Panel

**Approach**: Backend-driven. Each service emits a `model_used` SSE event when it completes an LLM/API call.

### Backend SSE event

New event type emitted from services:

```json
{
  "type": "model_used",
  "step": "normalize",
  "model": "qwen/qwen-2.5-72b-instruct",
  "provider": "OpenRouter",
  "latency_ms": 1100
}
```

Steps that emit:
| Step | Service | Model | Provider |
|------|---------|-------|----------|
| `normalize` | `qwen.py` | `qwen/qwen-2.5-72b-instruct` | OpenRouter |
| `search` | `tinyfish.py` | TinyFish Agent | TinyFish |
| `discovery` | `exa.py` | Neural Search | Exa |
| `ocr` | `ocr.py` | `gpt-4o` | OpenAI |

**Implementation**: The search router yields `model_used` events at appropriate points:
- After Qwen normalization completes (before Tier 1 spawn)
- Alongside each Tier 1 pharmacy result (TinyFish)
- Alongside each Tier 2 variant result (Exa)
- On OCR calls (optimize page only)

### Frontend component: `ModelRouterPanel.tsx`

Collapsible panel showing pipeline steps with real-time status.

```
┌─────────────────────────────────────────────────┐
│ ▼ MODEL ROUTER          [OpenRouter] [OpenAI]   │
│                                                 │
│  Normalize ── qwen-2.5-72b ──── 1.1s  ✓        │
│  Search ───── TinyFish Agent ── 2.5s  ✓ (×5)   │
│  Discovery ── Exa Neural ────── 0.7s  ✓ (×5)   │
│  OCR ──────── gpt-4o ────────── —     ○        │
└─────────────────────────────────────────────────┘
```

- Each row: step name, model name, latency, status (✓ done / ● running / ○ not used)
- Steps light up as `model_used` events arrive
- OCR row only shows ✓ if prescription upload was used
- Collapsible via click on header (default: expanded during demo)
- Sponsor badges in header: `[OpenRouter]` `[OpenAI]` `[Exa]` `[TinyFish]`

### Frontend state

```typescript
interface ModelStep {
  step: string;
  model: string;
  provider: string;
  latency_ms: number | null;
  status: 'pending' | 'active' | 'done';
  count: number; // how many times this step ran
}
```

Parse `model_used` SSE events, update `modelSteps` state. Initialize with all 4 steps as `pending`.

---

## 5. Optimize Page — Batch with Progress SSE

**Current state**: `POST /api/optimize` returns all results at once. No streaming.

### Backend changes (`routers/optimize.py`)

Convert optimize to SSE streaming with progress events:

1. Emit `{"type": "optimize_start", "drugs": ["Metformin", "Amoxicillin"], "total_drugs": 2}`
2. For each drug as it completes, emit `{"type": "drug_complete", "drug": "Metformin", "best_price": 38000, "best_source": "FPT Long Chau", "products_found": 8}`
3. Final event: `{"type": "optimize_complete", "total_optimized": 83000, "savings": 52000, ...}`

### Frontend changes (`optimize/page.tsx`)

- Replace `fetch` + JSON parse with SSE reader (same pattern as main page).
- Reuse `AgentActivityFeed`, `LiveMetricsBar`, `AgentCascade` components.
- Show progress per drug: "Metformin: ✓ | Amoxicillin: Searching..."
- `tier0Active = true` during OCR phase, transitions to `tier1Active` during search.

---

## Implementation Order

1. **Wire AgentCascade** (5 min) — one import, immediate visual impact
2. **Model Router Panel** (30 min) — backend events + new component, proves OpenRouter to judges
3. **Government Ceiling Panel** (30 min) — endpoint + component, data already in DB
4. **Exa Scout-Spawn** (45 min) — Tier 3 backend + frontend row animation + cancellation
5. **Optimize SSE Progress** (45 min) — refactor optimize to SSE + reuse existing components

Total estimated: ~2.5 hours

---

## Decision Log

| Question | Decision | Rationale |
|----------|----------|-----------|
| OCR optimize page UX | Full agent feed | Maximum visual impact — 25+ agents from one photo |
| Exa scout-spawn pattern | Auto-spawn Tier 3 | Auto-search all variants. Dynamic agent spawning = demo differentiator |
| Missing ceiling data | Show "No ceiling data" | Panel always visible to judges |
| Variant results in grid | Mixed + [Exa Discovery] badge | Cheapest floats to top AND judges see Exa attribution |
| Model router data source | Backend-driven | Each SSE event includes model used. Authentic, not hardcoded |
| AgentCascade placement | Above PharmacyCards | Logical flow: metrics → tree → cards → results |
| Qwen timing | Block until response | Guarantees normalized query. Accept 1-3s latency |
| Ceiling panel trigger | Always visible | Judges always see it, even for uncovered drugs |
| Tier 3 pharmacy scope | Only successful pharmacies | Faster, less waste, still multiple agents |
| Router detail level | Model + step + latency | Shows performance characteristics, technical depth |
| Optimize page streaming | Batch with progress events | Moderate effort, still shows activity per drug |
| Ceiling price comparison | Unit price | Divide pack price by pack_size, compare to ceiling |
| Tier 3 grid animation | Animate new rows | Slide-in + [Exa Discovery] badge. Visual "aha" moment |
| Model event granularity | Per-service event | New `model_used` SSE event type. Clean separation |
| Cancellation on new search | Cancel all | Clean slate prevents stale Tier 3 mixing with new search |
| Ceiling severity visual | Color-coded | Green/yellow/red based on % above ceiling |
