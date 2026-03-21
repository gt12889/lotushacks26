# Dashboard Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove dead code, mock US data, and non-functional UI from the dashboard; wire up ComparisonBanner; remove orphaned components; fix duplicate footer; update PRD to match reality.

**Architecture:** All changes are in the frontend. No backend changes. DashboardHome.tsx is the main target — removing ~160 lines of mock data/UI, removing SonarFilters sidebar, removing duplicate footer, adding ComparisonBanner. Two orphaned components get deleted. PRD gets updated to remove references to deleted components and SonarFilters.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4

---

### Task 1: Remove MOCK_CHART_DATA, MOCK_TABLE_DATA, and their render blocks

**Files:**
- Modify: `frontend/src/components/DashboardHome.tsx`

These are hardcoded US drug pricing displays (Atorvastatin, Lisinopril, NDC codes, AWP/WAC) that always render and have nothing to do with the Vietnamese pharmacy app.

- [ ] **Step 1: Remove MOCK_CHART_DATA constant** (lines 91-103)

Delete the entire `const MOCK_CHART_DATA = [...]` array.

- [ ] **Step 2: Remove MOCK_TABLE_DATA constant** (lines 105-145)

Delete the entire `const MOCK_TABLE_DATA = [...]` array.

- [ ] **Step 3: Remove the mock chart render block** (lines 735-799)

Delete from the AWP/WAC chart legend `<div className="flex items-center gap-6 text-[10px]">` through the closing `</div>` of the `<ResponsiveContainer>` wrapper. This is the unconditional ComposedChart using MOCK_CHART_DATA.

- [ ] **Step 4: Remove the mock table render block** (lines 801-895)

Delete from `<div className="bg-abyss">` (the "Pricing Index" header) through the end of the `MOCK_TABLE_DATA.map()` block, including the "Distributed Net" agent status rows.

- [ ] **Step 5: Remove unused recharts imports**

After removing the mock chart, these imports from recharts are no longer needed (the real trend chart uses PricingChart component):

```typescript
// Remove from the recharts import block:
Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, ComposedChart
```

Also remove the `MegalodonBadge` import (line 19) — it was only used in MOCK_TABLE_DATA rows.

- [ ] **Step 6: Verify build**

Run: `cd frontend && npx next build 2>&1 | tail -10`
Expected: Build succeeds with no type errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/DashboardHome.tsx
git commit -m "fix: remove hardcoded US drug mock data from dashboard

MOCK_CHART_DATA and MOCK_TABLE_DATA showed Atorvastatin/Lisinopril
with NDC codes and AWP/WAC USD pricing — irrelevant to Vietnamese
pharmacy app. These rendered unconditionally below real results."
```

---

### Task 2: Remove SonarFilters sidebar

**Files:**
- Modify: `frontend/src/components/DashboardHome.tsx`
- Delete: `frontend/src/components/SonarFilters.tsx`

SonarFilters is purely cosmetic — it declares local state but never communicates with DashboardHome. No filter selections affect results. US-centric labels (AWP/WAC, USD price threshold). Remove entirely.

- [ ] **Step 1: Remove SonarFilters import from DashboardHome.tsx**

Delete: `import SonarFilters from '@/components/SonarFilters';`

- [ ] **Step 2: Remove SonarFilters render from DashboardHome.tsx**

Delete line: `<SonarFilters />`  (near end of component, line ~910 after Task 1 removals)

- [ ] **Step 3: Remove flex wrapper that existed for sidebar layout**

The outer `<div className="flex flex-1 max-w-[1400px] mx-auto w-full">` and its child `<div className="flex-1 min-w-0">` were a two-column layout for content + sidebar. Simplify to just the content div since there's no sidebar:

Change:
```tsx
<div className="flex flex-1 max-w-[1400px] mx-auto w-full">
  <div className="flex-1 min-w-0">
    <div className="p-6 space-y-5">
```

To:
```tsx
<div className="max-w-[1400px] mx-auto w-full">
  <div className="p-6 space-y-5">
```

And remove the corresponding extra `</div>` that closed the `flex-1 min-w-0` wrapper.

- [ ] **Step 4: Delete SonarFilters.tsx file**

```bash
rm frontend/src/components/SonarFilters.tsx
```

- [ ] **Step 5: Verify build**

Run: `cd frontend && npx next build 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/DashboardHome.tsx
git add frontend/src/components/SonarFilters.tsx
git commit -m "fix: remove non-functional SonarFilters sidebar

Purely cosmetic — local state never communicated to parent,
filter selections had zero effect on results. US-centric
labels (AWP/WAC, USD thresholds) didn't fit Vietnamese app."
```

---

### Task 3: Remove duplicate inline footer from DashboardHome

**Files:**
- Modify: `frontend/src/components/DashboardHome.tsx`

DashboardHome has an inline footer (privacy/methodology/oracle links + UTC sync clock) that duplicates AbyssFooter which already renders in layout.tsx. Also remove the `syncTime` state and its `useEffect` interval since they only served this footer.

- [ ] **Step 1: Remove the inline footer block**

Delete the block (after Task 1/2 removals, near bottom of the render):
```tsx
<div className="flex items-center justify-between pt-3 border-t border-border/30">
  <div className="flex gap-5 text-[9px] text-t3 font-mono">
    <span className="hover:text-t2 cursor-pointer transition-colors">{t('footer.privacy')}</span>
    <span className="hover:text-t2 cursor-pointer transition-colors">{t('footer.methodology')}</span>
    <span className="hover:text-t2 cursor-pointer transition-colors">{t('footer.oracle')}</span>
  </div>
  <span className="text-[9px] text-t3 font-mono">
    {t('footer.sync')} {syncTime} UTC
  </span>
</div>
```

- [ ] **Step 2: Remove syncTime state and its useEffect**

Delete:
```tsx
const [syncTime, setSyncTime] = useState('');
```

And the useEffect:
```tsx
useEffect(() => {
  const update = () =>
    setSyncTime(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }));
  update();
  const id = setInterval(update, 1000);
  return () => clearInterval(id);
}, []);
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npx next build 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/DashboardHome.tsx
git commit -m "fix: remove duplicate footer from DashboardHome

AbyssFooter in layout.tsx already renders the same UTC clock
and protocol links on every page."
```

---

### Task 4: Remove "Export Intel" non-functional button

**Files:**
- Modify: `frontend/src/components/DashboardHome.tsx`

The "Export Intel" button has no onClick handler — it does nothing when clicked.

- [ ] **Step 1: Remove the Export Intel button**

Delete:
```tsx
<button className="px-3 py-1.5 text-[10px] border border-cyan/40 text-cyan rounded hover:bg-cyan/10 transition-all hover:border-cyan font-mono uppercase tracking-wider">
  {t('dash.exportIntel')}
</button>
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx next build 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/DashboardHome.tsx
git commit -m "fix: remove non-functional Export Intel button"
```

---

### Task 5: Wire up ComparisonBanner on dashboard

**Files:**
- Modify: `frontend/src/components/DashboardHome.tsx`

ComparisonBanner shows a "Manual search: 15 min vs MegalodonMD: 4.2s — 214× faster" speed comparison. It's already built but never used. Wire it into the dashboard after search completes, right after SavingsBanner.

- [ ] **Step 1: Add ComparisonBanner import**

Add to imports:
```typescript
import ComparisonBanner from '@/components/ComparisonBanner';
```

- [ ] **Step 2: Track total search time**

Add state variable:
```typescript
const [searchTimeMs, setSearchTimeMs] = useState<number | null>(null);
```

At the start of `handleSearch`, record the start time:
```typescript
const searchStart = Date.now();
```

In the `finally` block of handleSearch, after `setIsSearching(false)`:
```typescript
setSearchTimeMs(Date.now() - searchStart);
```

Also reset it at the start of handleSearch alongside other state resets:
```typescript
setSearchTimeMs(null);
```

- [ ] **Step 3: Render ComparisonBanner after SavingsBanner**

Inside the `{scanSummary && ( <> ... </> )}` block, after `<VoiceSummary ... />`, add:

```tsx
<ComparisonBanner
  searchTimeMs={searchTimeMs}
  pharmacyCount={pharmaciesComplete}
  productCount={productsFound}
/>
```

- [ ] **Step 4: Verify build**

Run: `cd frontend && npx next build 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/DashboardHome.tsx
git commit -m "feat: wire ComparisonBanner into dashboard after search

Shows speed comparison: manual search time vs MegalodonMD time
with speedup multiplier. Previously built but never rendered."
```

---

### Task 6: Delete orphaned SupermemoryStatusBadge

**Files:**
- Delete: `frontend/src/components/SupermemoryStatusBadge.tsx`

Not imported or used anywhere in the app.

- [ ] **Step 1: Verify it's truly unused**

```bash
cd frontend && grep -r "SupermemoryStatusBadge" src/ --include="*.tsx" --include="*.ts"
```

Expected: Only the file itself shows up.

- [ ] **Step 2: Delete the file**

```bash
rm frontend/src/components/SupermemoryStatusBadge.tsx
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npx next build 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/SupermemoryStatusBadge.tsx
git commit -m "chore: remove orphaned SupermemoryStatusBadge component"
```

---

### Task 7: Update PRD to match reality

**Files:**
- Modify: `docs/PRD.md`

Remove references to deleted/non-functional items so the PRD accurately reflects the codebase.

- [ ] **Step 1: Remove SonarFilters from Key Components table**

Delete the row:
```
| `SonarFilters` | Right sidebar: molecule selector, AWP/WAC toggle, time range, drug class chips |
```

Also delete the duplicate `SonarFilters` entry further down (line ~361).

- [ ] **Step 2: Remove SupermemoryStatusBadge from Key Components table**

Delete the row:
```
| `SupermemoryStatusBadge` | Supermemory connection status indicator |
```

- [ ] **Step 3: Add ComparisonBanner to Key Components table**

Add row:
```
| `ComparisonBanner` | Speed comparison banner: manual search vs MegalodonMD with speedup multiplier |
```

- [ ] **Step 4: Remove Zalo share reference**

In Flow 1 step 13, delete: "Results shareable via **Zalo deep link**"

Also remove from the architecture diagram box: "Voice input → Prescription OCR → Zalo share" → change to "Voice input → Prescription OCR"

And in Design Decisions Log, remove entry 11 about Zalo share.

- [ ] **Step 5: Verify no broken references**

Skim through PRD for any remaining mentions of SonarFilters, SupermemoryStatusBadge, Zalo, or "Export Intel".

- [ ] **Step 6: Commit**

```bash
git add docs/PRD.md
git commit -m "docs: update PRD to match dashboard reality

Remove SonarFilters, SupermemoryStatusBadge, Zalo share.
Add ComparisonBanner. All changes reflect actual codebase state."
```

---

## Summary

| Task | What | Lines removed | Lines added |
|------|------|:------------:|:-----------:|
| 1 | Remove mock US data (chart + table) | ~170 | 0 |
| 2 | Remove SonarFilters sidebar | ~5 | 0 |
| 3 | Remove duplicate footer | ~20 | 0 |
| 4 | Remove Export Intel button | ~3 | 0 |
| 5 | Wire ComparisonBanner | 0 | ~10 |
| 6 | Delete SupermemoryStatusBadge | 61 (file) | 0 |
| 7 | Update PRD | ~10 | ~2 |

**Net effect:** ~270 lines of dead/mock code removed, 1 orphaned component deleted, 1 useful component wired up, PRD matches reality.
