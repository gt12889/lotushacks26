# Megladon MD "The Abyss" Retheme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retheme the entire Megladon MD frontend from light-mode gray/white to the dark "Abyss" cyberpunk-pharmaceutical design, and add a new `/architecture` page.

**Architecture:** Replace all 5 existing components and restyle all 4 existing pages in-place. Add Recharts for the trends chart. Add one new static page. All API integrations preserved unchanged. No backend modifications.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Recharts, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-21-abyss-retheme-design.md`

**Working directory:** `/home/gt120/projects/lotushacks26/frontend`

---

## File Map

### New files to create
- `src/components/StatusPill.tsx` — reusable colored status badge
- `src/components/AbyssFooter.tsx` — bottom bar with sync timestamp
- `src/components/MegalodonAlert.tsx` — conditional price spike alert bar
- `src/components/PricingChart.tsx` — Recharts line chart wrapper
- `src/components/SonarFilters.tsx` — client-side result filter sidebar
- `src/app/architecture/page.tsx` — static architecture diagram page

### Existing files to modify
- `src/app/globals.css` — add Abyss color theme tokens
- `src/app/layout.tsx` — dark bg, add AbyssFooter, update metadata
- `src/components/NavBar.tsx` — full retheme to dark nav
- `src/components/SearchBar.tsx` — dark input styling
- `src/components/PharmacyCards.tsx` — dark agent status cards
- `src/components/PriceGrid.tsx` — dark data table with status pills
- `src/components/SavingsBanner.tsx` — dark intel summary
- `src/app/page.tsx` — dashboard layout with sidebar, alert bar, header
- `src/app/trends/page.tsx` — replace CSS bar chart with Recharts, dark theme
- `src/app/alerts/page.tsx` — dark theme with tripwire/probe cards
- `src/app/optimize/page.tsx` — dark theme, preserve OCR

---

### Task 1: Install Recharts + Set Up Abyss Theme Tokens

**Files:**
- Modify: `src/app/globals.css`
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install recharts**

```bash
cd /home/gt120/projects/lotushacks26/frontend
npm install recharts
```

- [ ] **Step 2: Replace globals.css with Abyss theme**

Replace the entire contents of `src/app/globals.css` with:

```css
@import "tailwindcss";

@theme inline {
  --color-abyss: #0D1C32;
  --color-deep: #010E24;
  --color-card: #1C2A41;
  --color-cyan: #00DBE7;
  --color-alert-red: #EE4042;
  --color-alert-bg: #3C0004;
  --color-success: #2DD4BF;
  --color-warn: #F97316;
  --color-t1: #D6E3FF;
  --color-t2: #94A3B8;
  --color-t3: #64748B;
  --color-border: rgba(0, 219, 231, 0.1);
  --font-mono: 'Geist Mono', ui-monospace, monospace;
}

body {
  background-color: #0D1C32;
  color: #D6E3FF;
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: install recharts, add Abyss theme tokens to globals.css"
```

---

### Task 2: Retheme Layout + NavBar

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/NavBar.tsx`
- Create: `src/components/AbyssFooter.tsx`

- [ ] **Step 1: Rewrite NavBar.tsx**

Replace the entire file `src/components/NavBar.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/trends', label: 'Trends' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/optimize', label: 'Optimize' },
  { href: '/architecture', label: 'How It Works' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="bg-abyss border-b border-border sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-cyan rounded-lg flex items-center justify-center">
            <span className="text-abyss font-bold text-base">M</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-t1 leading-tight">MediScrape</h1>
            <p className="text-[10px] text-t3 leading-tight">Pharmaceutical Price Intelligence</p>
          </div>
        </Link>
        <nav className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'text-cyan bg-cyan/10'
                  : 'text-t2 hover:text-t1 hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button className="text-xs text-t3 border border-border rounded px-2 py-1 hover:text-t1 hover:border-cyan/30 transition-colors">
          VN / EN
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create AbyssFooter.tsx**

Create `src/components/AbyssFooter.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';

export default function AbyssFooter() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }) + ' UTC');
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="border-t border-border bg-deep px-6 py-3">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between text-[10px] text-t3 font-mono">
        <div className="flex gap-6">
          <span className="hover:text-t2 cursor-pointer">Privacy Protocol</span>
          <span className="hover:text-t2 cursor-pointer">Abyssal Methodology</span>
          <span className="hover:text-t2 cursor-pointer">Source Oracle</span>
        </div>
        <span>System Synchronized: {time}</span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Update layout.tsx**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import AbyssFooter from "@/components/AbyssFooter";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MediScrape — The Abyss",
  description: "AI-powered pharmaceutical price intelligence across Vietnamese pharmacy chains",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-abyss text-t1 min-h-screen flex flex-col`}>
        <NavBar />
        <main className="flex-1">{children}</main>
        <AbyssFooter />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify** — `npm run dev`, visit `http://localhost:3000`. Should see dark nav, dark background, footer with live UTC clock.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: retheme layout, NavBar, and footer to Abyss dark theme"
```

---

### Task 3: Create Shared Components (StatusPill, MegalodonAlert)

**Files:**
- Create: `src/components/StatusPill.tsx`
- Create: `src/components/MegalodonAlert.tsx`

- [ ] **Step 1: Create StatusPill.tsx**

```tsx
const STATUS_STYLES: Record<string, { text: string; border: string; bg: string }> = {
  best: { text: 'text-success', border: 'border-success/30', bg: 'bg-success/20' },
  critical: { text: 'text-alert-red', border: 'border-alert-red/30', bg: 'bg-alert-red/20' },
  monitor: { text: 'text-blue-400', border: 'border-blue-400/30', bg: 'bg-blue-400/20' },
  active: { text: 'text-success', border: 'border-success/30', bg: 'bg-success/20' },
  searching: { text: 'text-warn', border: 'border-warn/30', bg: 'bg-warn/20' },
  error: { text: 'text-alert-red', border: 'border-alert-red/30', bg: 'bg-alert-red/20' },
  'out-of-stock': { text: 'text-t3', border: 'border-t3/30', bg: 'bg-t3/20' },
};

interface StatusPillProps {
  status: string;
  label?: string;
}

export default function StatusPill({ status, label }: StatusPillProps) {
  const s = STATUS_STYLES[status.toLowerCase()] || STATUS_STYLES.monitor;
  return (
    <span className={`inline-block px-2 py-0.5 text-[9px] uppercase font-mono font-bold border rounded ${s.text} ${s.border} ${s.bg}`}>
      {label || status}
    </span>
  );
}
```

- [ ] **Step 2: Create MegalodonAlert.tsx**

```tsx
'use client';

interface MegalodonAlertProps {
  drugName: string;
  message: string;
  onIntercept?: () => void;
}

export default function MegalodonAlert({ drugName, message, onIntercept }: MegalodonAlertProps) {
  return (
    <div className="bg-alert-bg border-l-4 border-alert-red px-6 py-3 flex items-center gap-4">
      <span className="text-alert-red text-lg">⚠</span>
      <div className="flex-1">
        <span className="text-alert-red font-bold text-xs uppercase tracking-wider">Megalodon Signal Detected</span>
        <span className="text-alert-red text-xs ml-3">{drugName} — {message}</span>
      </div>
      {onIntercept && (
        <button
          onClick={onIntercept}
          className="bg-alert-red text-alert-bg px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-alert-red/80 transition-colors"
        >
          Intercept
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add StatusPill and MegalodonAlert shared components"
```

---

### Task 4: Retheme SearchBar + PharmacyCards + SavingsBanner + PriceGrid

**Files:**
- Modify: `src/components/SearchBar.tsx`
- Modify: `src/components/PharmacyCards.tsx`
- Modify: `src/components/SavingsBanner.tsx`
- Modify: `src/components/PriceGrid.tsx`

- [ ] **Step 1: Retheme SearchBar.tsx**

Replace `src/components/SearchBar.tsx`:

```tsx
'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export default function SearchBar({ onSearch, isSearching }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const quickSearches = ['Metformin 500mg', 'Amoxicillin 500mg', 'Paracetamol 500mg', 'Losartan 50mg', 'Omeprazole 20mg'];

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Scan molecular signals..."
            className="w-full px-5 py-3.5 text-base bg-deep border border-border rounded-lg focus:ring-1 focus:ring-cyan focus:border-cyan text-t1 placeholder-t3 font-mono outline-none transition-colors"
            disabled={isSearching}
          />
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-t3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="px-6 py-3.5 bg-cyan text-abyss font-bold rounded-lg hover:bg-cyan/80 disabled:bg-t3/30 disabled:text-t3 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isSearching ? 'Scanning...' : 'Deploy Probe'}
        </button>
      </form>
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-t3">Quick scan:</span>
        {quickSearches.map((drug) => (
          <button
            key={drug}
            onClick={() => { setQuery(drug); onSearch(drug); }}
            disabled={isSearching}
            className="px-3 py-1 text-xs bg-card text-t2 rounded border border-border hover:border-cyan/30 hover:text-cyan transition-colors disabled:opacity-50"
          >
            {drug}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Retheme PharmacyCards.tsx**

Replace `src/components/PharmacyCards.tsx`:

```tsx
'use client';

import StatusPill from './StatusPill';

interface PharmacyResult {
  source_id: string;
  source_name: string;
  status: string;
  products: any[];
  lowest_price: number | null;
  result_count: number;
  response_time_ms: number | null;
  error: string | null;
}

interface PharmacyCardsProps {
  results: Record<string, PharmacyResult>;
}

const SOURCE_COLORS: Record<string, string> = {
  long_chau: '#3B82F6',
  pharmacity: '#22C55E',
  an_khang: '#F97316',
  than_thien: '#A855F7',
  medicare: '#14B8A6',
};

const PHARMACY_INITIALS: Record<string, string> = {
  long_chau: 'LC',
  pharmacity: 'PC',
  an_khang: 'AK',
  than_thien: 'TT',
  medicare: 'MC',
};

export default function PharmacyCards({ results }: PharmacyCardsProps) {
  const pharmacies = ['long_chau', 'pharmacity', 'an_khang', 'than_thien', 'medicare'];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {pharmacies.map((id) => {
        const result = results[id];
        const color = SOURCE_COLORS[id] || '#64748B';
        const statusType = result?.status === 'success' ? 'active' : result?.status === 'error' ? 'error' : result?.status === 'searching' ? 'searching' : 'monitor';

        return (
          <div
            key={id}
            className="bg-deep border border-border rounded-lg p-4 transition-all duration-500"
            style={{ borderLeftColor: result ? color : undefined, borderLeftWidth: result ? 3 : 1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold font-mono text-t1">{PHARMACY_INITIALS[id]}</span>
              {result && <StatusPill status={statusType} />}
            </div>
            <div className="text-[10px] text-t3 mb-2">{result?.source_name || id}</div>
            {result?.status === 'searching' && (
              <div className="text-xs text-warn animate-pulse font-mono">Scanning...</div>
            )}
            {result?.status === 'success' && (
              <>
                <div className="text-xs text-t2 font-mono">{result.result_count} results</div>
                {result.lowest_price && (
                  <div className="text-base font-bold font-mono text-t1 mt-1">
                    {result.lowest_price.toLocaleString()}đ
                  </div>
                )}
                {result.response_time_ms && (
                  <div className="text-[10px] text-t3 font-mono">{(result.response_time_ms / 1000).toFixed(1)}s latency</div>
                )}
              </>
            )}
            {result?.status === 'error' && (
              <div className="text-[10px] text-alert-red font-mono">Signal lost</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Retheme SavingsBanner.tsx**

Replace `src/components/SavingsBanner.tsx`:

```tsx
'use client';

interface SavingsBannerProps {
  bestPrice: number | null;
  bestSource: string | null;
  priceRange: string | null;
  potentialSavings: number | null;
  totalResults: number;
}

export default function SavingsBanner({ bestPrice, bestSource, priceRange, potentialSavings, totalResults }: SavingsBannerProps) {
  if (!bestPrice) return null;

  return (
    <div className="bg-deep border border-border rounded-lg p-6">
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">Best Price Detected</p>
          <p className="text-2xl font-bold font-mono text-success">{bestPrice.toLocaleString()} VND</p>
          <p className="text-xs text-t3">at <span className="text-cyan">{bestSource}</span></p>
        </div>
        {priceRange && (
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">Price Range</p>
            <p className="text-sm font-mono text-t1">{priceRange}</p>
          </div>
        )}
        {potentialSavings && potentialSavings > 0 && (
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">Potential Savings</p>
            <p className="text-xl font-bold font-mono text-warn">
              {potentialSavings.toLocaleString()} VND
              <span className="text-sm ml-1">({Math.round((potentialSavings / (bestPrice + potentialSavings)) * 100)}%)</span>
            </p>
          </div>
        )}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">Total Results</p>
          <p className="text-xl font-bold font-mono text-t1">{totalResults}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Retheme PriceGrid.tsx**

Replace `src/components/PriceGrid.tsx`:

```tsx
'use client';

import { useState } from 'react';
import StatusPill from './StatusPill';

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

const SOURCE_COLORS: Record<string, string> = {
  long_chau: '#3B82F6',
  pharmacity: '#22C55E',
  an_khang: '#F97316',
  than_thien: '#A855F7',
  medicare: '#14B8A6',
};

export default function PriceGrid({ results, bestPrice }: PriceGridProps) {
  const [sortBy, setSortBy] = useState<SortKey>('price');

  const allProducts: (Product & { source_id: string; source_name: string })[] = [];
  for (const [sourceId, result] of Object.entries(results)) {
    if (result.status === 'success') {
      for (const product of result.products) {
        allProducts.push({ ...product, source_id: sourceId, source_name: result.source_name });
      }
    }
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

  if (allProducts.length === 0) return null;

  return (
    <div className="bg-deep border border-border rounded-lg overflow-hidden">
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
            </tr>
          </thead>
          <tbody>
            {allProducts.map((p, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                <td className="py-2.5 px-4">
                  {p.price === bestPrice && <StatusPill status="best" label="BEST" />}
                </td>
                <td className="py-2.5 px-4">
                  <div className="text-t1 font-medium">
                    {p.product_url ? (
                      <a href={p.product_url} target="_blank" rel="noopener noreferrer" className="hover:text-cyan transition-colors">{p.product_name}</a>
                    ) : p.product_name}
                  </div>
                  {p.manufacturer && <div className="text-[10px] text-t3 font-mono">{p.manufacturer}</div>}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify** — `npm run dev`, search for a drug. Cards, table, savings banner should all be dark themed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: retheme SearchBar, PharmacyCards, PriceGrid, SavingsBanner to Abyss"
```

---

### Task 5: Retheme Dashboard Page (/)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite page.tsx**

Replace `src/app/page.tsx`. Keep all the existing search/SSE logic, restyle the JSX:

```tsx
'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import PharmacyCards from '@/components/PharmacyCards';
import PriceGrid from '@/components/PriceGrid';
import SavingsBanner from '@/components/SavingsBanner';
import MegalodonAlert from '@/components/MegalodonAlert';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PharmacyResult {
  source_id: string;
  source_name: string;
  status: string;
  products: any[];
  lowest_price: number | null;
  result_count: number;
  response_time_ms: number | null;
  error: string | null;
}

interface Summary {
  query: string;
  best_price: number | null;
  best_source: string | null;
  price_range: string | null;
  potential_savings: number | null;
  total_results: number;
  variants?: string[];
}

export default function Home() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Record<string, PharmacyResult>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setResults({});
    setSummary(null);
    setCurrentQuery(query);

    try {
      const response = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(query)}`, {
        method: 'POST',
      });

      if (!response.ok || !response.body) throw new Error('Search failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const dataMatch = line.match(/^data: (.+)$/m);
          if (!dataMatch) continue;

          try {
            const event = JSON.parse(dataMatch[1]);
            if (event.task === 'summary') {
              setSummary(event);
            } else if (event.source_id) {
              setResults(prev => ({ ...prev, [event.source_id]: event }));
            }
          } catch (parseErr) {
            console.warn('Parse error:', parseErr);
          }
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const hasResults = Object.keys(results).length > 0;
  const hasMegalodon = summary && summary.potential_savings && summary.best_price && summary.potential_savings > summary.best_price;

  return (
    <div className="min-h-screen">
      {hasMegalodon && summary && (
        <MegalodonAlert
          drugName={summary.query}
          message={`Price spread of ${summary.potential_savings?.toLocaleString()} VND detected across sources`}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-t1">Price Tracker: The Abyss</h2>
          <p className="text-xs text-t3 mt-1">Surfacing deep market trajectories and molecular cost-signals.</p>
          {hasResults && (
            <div className="flex gap-3 mt-3">
              <button className="px-3 py-1.5 text-xs border border-cyan text-cyan rounded hover:bg-cyan/10 transition-colors">
                Export Intel
              </button>
              <button onClick={() => handleSearch(currentQuery)} className="px-3 py-1.5 text-xs border border-cyan text-cyan rounded hover:bg-cyan/10 transition-colors">
                Deploy New Probe
              </button>
            </div>
          )}
        </div>

        {/* Empty state */}
        {!hasResults && !isSearching && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-t1 mb-3">Compare Drug Prices Across Vietnam</h2>
            <p className="text-sm text-t3 mb-8 max-w-2xl mx-auto">
              Deploy parallel AI agents across 5+ pharmacy chains. Results in under 30 seconds.
            </p>
          </div>
        )}

        <SearchBar onSearch={handleSearch} isSearching={isSearching} />

        {(hasResults || isSearching) && (
          <div className="space-y-6">
            {currentQuery && (
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-mono text-t2">
                  Scanning: <span className="text-cyan">&ldquo;{currentQuery}&rdquo;</span>
                </h3>
                {isSearching && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan rounded-full animate-pulse" />
                    <span className="text-xs text-t3 font-mono">Agents active</span>
                  </div>
                )}
              </div>
            )}

            <PharmacyCards results={results} />

            {summary && (
              <SavingsBanner
                bestPrice={summary.best_price}
                bestSource={summary.best_source}
                priceRange={summary.price_range}
                potentialSavings={summary.potential_savings}
                totalResults={summary.total_results}
              />
            )}

            {summary?.variants && summary.variants.length > 0 && (
              <div className="bg-deep border border-cyan/20 rounded-lg p-4">
                <p className="text-xs font-mono text-cyan mb-2">Generic alternatives detected:</p>
                <div className="flex gap-2 flex-wrap">
                  {summary.variants.map((v) => (
                    <button
                      key={v}
                      onClick={() => handleSearch(v)}
                      disabled={isSearching}
                      className="px-3 py-1.5 text-xs bg-card text-cyan border border-cyan/30 rounded hover:bg-cyan/10 transition-colors disabled:opacity-50"
                    >
                      Scan &ldquo;{v}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}

            <PriceGrid results={results} bestPrice={summary?.best_price ?? null} />
          </div>
        )}

        {/* Feature cards (empty state) */}
        {!hasResults && !isSearching && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              { icon: '⚡', title: 'Parallel Agents', desc: '5 AI agents search pharmacy websites simultaneously in under 30 seconds.', color: 'cyan' },
              { icon: '📊', title: 'Price Intelligence', desc: 'Track price trends, set alerts, and find savings of up to 300%.', color: 'success' },
              { icon: '💊', title: 'Prescription Optimizer', desc: 'Optimize sourcing across pharmacies for entire prescriptions.', color: 'warn' },
            ].map((card) => (
              <div key={card.title} className="bg-deep border border-border rounded-lg p-6 hover:border-cyan/30 transition-colors">
                <div className="text-2xl mb-3">{card.icon}</div>
                <h3 className="font-bold text-t1 text-sm mb-2">{card.title}</h3>
                <p className="text-xs text-t3">{card.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify** — full dashboard flow: empty state → search → streaming results → savings banner → price grid. All dark.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: retheme dashboard page with Abyss design"
```

---

### Task 6: Retheme Trends Page with Recharts

**Files:**
- Modify: `src/app/trends/page.tsx`
- Create: `src/components/PricingChart.tsx`

- [ ] **Step 1: Create PricingChart.tsx**

```tsx
'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PricePoint {
  source_id: string;
  source_name: string;
  product_name: string;
  price: number;
  observed_at: string;
}

interface PricingChartProps {
  data: PricePoint[];
}

const SOURCE_COLORS: Record<string, string> = {
  long_chau: '#3B82F6',
  pharmacity: '#22C55E',
  an_khang: '#F97316',
  than_thien: '#A855F7',
  medicare: '#14B8A6',
};

export default function PricingChart({ data }: PricingChartProps) {
  if (data.length === 0) return null;

  // Group by date, pivot by source
  const byDate: Record<string, Record<string, number>> = {};
  const sources = new Set<string>();

  for (const p of data) {
    const date = new Date(p.observed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!byDate[date]) byDate[date] = {};
    byDate[date][p.source_id] = p.price;
    sources.add(p.source_id);
  }

  const chartData = Object.entries(byDate).map(([date, prices]) => ({ date, ...prices }));
  const sourceNames: Record<string, string> = {};
  for (const p of data) sourceNames[p.source_id] = p.source_name;

  return (
    <div className="bg-deep border border-border rounded-lg p-6">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={{ stroke: 'rgba(0,219,231,0.1)' }} tickLine={false} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#010E24', border: '1px solid rgba(0,219,231,0.2)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#D6E3FF' }}
            itemStyle={{ color: '#94A3B8' }}
            formatter={(value: number) => [`${value.toLocaleString()} VND`]}
          />
          <Legend
            formatter={(value) => <span style={{ color: '#94A3B8', fontSize: 11 }}>{sourceNames[value] || value}</span>}
          />
          {Array.from(sources).map((sourceId) => (
            <Line
              key={sourceId}
              type="monotone"
              dataKey={sourceId}
              stroke={SOURCE_COLORS[sourceId] || '#64748B'}
              strokeWidth={2}
              dot={{ r: 3, fill: SOURCE_COLORS[sourceId] || '#64748B' }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite trends/page.tsx**

Replace `src/app/trends/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import PricingChart from '@/components/PricingChart';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PricePoint {
  source_id: string;
  source_name: string;
  product_name: string;
  price: number;
  observed_at: string;
}

const TIME_RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

export default function TrendsPage() {
  const [query, setQuery] = useState('');
  const [days, setDays] = useState(7);
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrends = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/trends/${encodeURIComponent(query)}?days=${days}`);
      const json = await res.json();
      setData(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const bySource: Record<string, PricePoint[]> = {};
  for (const p of data) {
    if (!bySource[p.source_id]) bySource[p.source_id] = [];
    bySource[p.source_id].push(p);
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-t1">Depth Analysis</h2>
          <p className="text-xs text-t3 mt-1">Molecular price trajectory over time</p>
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">Drug Name</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTrends()}
              placeholder="Scan molecular signals..."
              className="w-full px-4 py-3 bg-deep border border-border rounded-lg text-t1 font-mono placeholder-t3 focus:ring-1 focus:ring-cyan focus:border-cyan outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-t3 font-mono mb-1">Time Range</label>
            <div className="flex gap-1">
              {TIME_RANGES.map((r) => (
                <button
                  key={r.days}
                  onClick={() => setDays(r.days)}
                  className={`px-4 py-3 rounded-lg text-xs font-mono font-bold transition-colors ${
                    days === r.days ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'bg-card text-t2 border border-border hover:border-cyan/30'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={fetchTrends}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-cyan text-abyss font-bold rounded-lg hover:bg-cyan/80 disabled:bg-t3/30 disabled:text-t3 transition-colors"
          >
            {loading ? 'Scanning...' : 'Analyze'}
          </button>
        </div>

        {data.length > 0 && (
          <>
            <PricingChart data={data} />

            <div className="bg-deep border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-3 border-b border-border">
                <h3 className="text-xs font-bold text-t1 uppercase tracking-wider">Price Summary — {query} ({days} days)</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Pharmacy</th>
                    <th className="text-left py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Product</th>
                    <th className="text-right py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Latest Price</th>
                    <th className="text-right py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Observations</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(bySource).map(([sourceId, points]) => {
                    const latest = points[points.length - 1];
                    return (
                      <tr key={sourceId} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                        <td className="py-2.5 px-6 text-t1 text-xs">{latest?.source_name}</td>
                        <td className="py-2.5 px-6 text-t2 text-xs">{latest?.product_name}</td>
                        <td className="py-2.5 px-6 text-right font-mono text-t1">{latest?.price.toLocaleString()} VND</td>
                        <td className="py-2.5 px-6 text-right text-t3 font-mono">{points.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {data.length === 0 && !loading && (
          <div className="bg-deep border border-border rounded-lg p-16 text-center">
            <p className="text-sm text-t3">Search a drug and select a time range to view price trajectories</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify** — `/trends` renders dark, Recharts chart appears with colored lines per pharmacy.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: retheme trends page with Recharts and Abyss design"
```

---

### Task 7: Retheme Alerts Page

**Files:**
- Modify: `src/app/alerts/page.tsx`

- [ ] **Step 1: Rewrite alerts/page.tsx**

Replace `src/app/alerts/page.tsx`. Keep all existing API logic, restyle JSX:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import StatusPill from '@/components/StatusPill';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Alert { id: number; drug_query: string; price_threshold: number; is_active: number; created_at: string; }
interface Monitor { id: number; drug_query: string; interval_minutes: number; is_active: number; last_run_at: string | null; created_at: string; }

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [newAlertDrug, setNewAlertDrug] = useState('');
  const [newAlertThreshold, setNewAlertThreshold] = useState('');
  const [newMonitorDrug, setNewMonitorDrug] = useState('');
  const [newMonitorInterval, setNewMonitorInterval] = useState('15');

  const fetchAlerts = useCallback(async () => { try { const res = await fetch(`${API_URL}/api/alerts`); setAlerts(await res.json()); } catch (e) { console.error(e); } }, []);
  const fetchMonitors = useCallback(async () => { try { const res = await fetch(`${API_URL}/api/monitors`); setMonitors(await res.json()); } catch (e) { console.error(e); } }, []);
  useEffect(() => { fetchAlerts(); fetchMonitors(); }, [fetchAlerts, fetchMonitors]);

  const createAlert = async () => { if (!newAlertDrug.trim() || !newAlertThreshold) return; await fetch(`${API_URL}/api/alerts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drug_query: newAlertDrug, price_threshold: parseInt(newAlertThreshold) }) }); setNewAlertDrug(''); setNewAlertThreshold(''); fetchAlerts(); };
  const deleteAlert = async (id: number) => { await fetch(`${API_URL}/api/alerts/${id}`, { method: 'DELETE' }); fetchAlerts(); };
  const createMonitor = async () => { if (!newMonitorDrug.trim()) return; await fetch(`${API_URL}/api/monitor`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drug_query: newMonitorDrug, interval_minutes: parseInt(newMonitorInterval) }) }); setNewMonitorDrug(''); setNewMonitorInterval('15'); fetchMonitors(); };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-t1">Megalodon Alert System</h2>
          <p className="text-xs text-t3 mt-1">Configuring deep-sea price tripwires</p>
        </div>

        {/* Active Tripwires */}
        <div className="bg-deep border border-border rounded-lg p-6">
          <h3 className="text-xs font-bold text-cyan uppercase tracking-wider mb-4">Active Tripwires</h3>
          <p className="text-xs text-t3 mb-4">Get notified on Discord when a drug drops below your threshold.</p>

          <div className="flex gap-3 mb-6">
            <input type="text" value={newAlertDrug} onChange={(e) => setNewAlertDrug(e.target.value)} placeholder="Drug name" className="flex-1 px-4 py-2.5 bg-abyss border border-border rounded-lg text-t1 font-mono placeholder-t3 focus:ring-1 focus:ring-cyan focus:border-cyan outline-none text-sm" />
            <input type="number" value={newAlertThreshold} onChange={(e) => setNewAlertThreshold(e.target.value)} placeholder="Threshold (VND)" className="w-48 px-4 py-2.5 bg-abyss border border-border rounded-lg text-t1 font-mono placeholder-t3 focus:ring-1 focus:ring-cyan focus:border-cyan outline-none text-sm" />
            <button onClick={createAlert} className="px-5 py-2.5 bg-cyan text-abyss rounded-lg font-bold text-sm hover:bg-cyan/80 transition-colors">Deploy</button>
          </div>

          {alerts.length === 0 ? (
            <p className="text-t3 text-xs font-mono">No active tripwires</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between py-3 px-4 bg-abyss border border-alert-red/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-t1 text-sm">{alert.drug_query}</span>
                    <span className="text-warn text-xs font-mono">below {alert.price_threshold.toLocaleString()} VND</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status="active" label="ARMED" />
                    <button onClick={() => deleteAlert(alert.id)} className="text-xs text-alert-red hover:text-alert-red/80 transition-colors">Disarm</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sonar Probes */}
        <div className="bg-deep border border-border rounded-lg p-6">
          <h3 className="text-xs font-bold text-cyan uppercase tracking-wider mb-4">Sonar Probes</h3>
          <p className="text-xs text-t3 mb-4">Automatically track prices at regular intervals.</p>

          <div className="flex gap-3 mb-6">
            <input type="text" value={newMonitorDrug} onChange={(e) => setNewMonitorDrug(e.target.value)} placeholder="Drug name" className="flex-1 px-4 py-2.5 bg-abyss border border-border rounded-lg text-t1 font-mono placeholder-t3 focus:ring-1 focus:ring-cyan focus:border-cyan outline-none text-sm" />
            <select value={newMonitorInterval} onChange={(e) => setNewMonitorInterval(e.target.value)} className="w-48 px-4 py-2.5 bg-abyss border border-border rounded-lg text-t1 font-mono focus:ring-1 focus:ring-cyan focus:border-cyan outline-none text-sm">
              <option value="5">Every 5 min</option>
              <option value="15">Every 15 min</option>
              <option value="30">Every 30 min</option>
              <option value="60">Every 1 hour</option>
              <option value="360">Every 6 hours</option>
              <option value="1440">Every 24 hours</option>
            </select>
            <button onClick={createMonitor} className="px-5 py-2.5 bg-cyan text-abyss rounded-lg font-bold text-sm hover:bg-cyan/80 transition-colors">Deploy</button>
          </div>

          {monitors.length === 0 ? (
            <p className="text-t3 text-xs font-mono">No active probes</p>
          ) : (
            <div className="space-y-2">
              {monitors.map((mon) => (
                <div key={mon.id} className="flex items-center justify-between py-3 px-4 bg-abyss border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-t1 text-sm">{mon.drug_query}</span>
                    <span className="text-t3 text-xs font-mono">every {mon.interval_minutes}min</span>
                    {mon.last_run_at && <span className="text-[10px] text-t3 font-mono">last: {new Date(mon.last_run_at).toLocaleString()}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <StatusPill status="active" label="ACTIVE" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: retheme alerts page to Megalodon Alert System"
```

---

### Task 8: Retheme Optimize Page

**Files:**
- Modify: `src/app/optimize/page.tsx`

- [ ] **Step 1: Rewrite optimize/page.tsx**

Replace `src/app/optimize/page.tsx`. Keep all existing logic (including OCR), restyle:

```tsx
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
          {/* OCR Upload */}
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
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: retheme optimize page to Abyss with OCR preserved"
```

---

### Task 9: Create Architecture Page

**Files:**
- Create: `src/app/architecture/page.tsx`

- [ ] **Step 1: Create architecture/page.tsx**

```tsx
export default function ArchitecturePage() {
  const steps = [
    { icon: '👤', label: 'User', desc: 'Searches for a drug', color: '#D6E3FF' },
    { icon: '🖥️', label: 'Next.js Frontend', desc: 'Sends SSE request', color: '#00DBE7' },
    { icon: '⚙️', label: 'FastAPI Backend', desc: 'Orchestrates parallel agents', color: '#00DBE7' },
    { icon: '🐟', label: 'TinyFish Agents ×5', desc: 'Navigate pharmacy websites', color: '#F97316' },
    { icon: '🏪', label: 'Pharmacy Websites', desc: 'Long Chau, Pharmacity, An Khang, Than Thien, Medicare', color: '#22C55E' },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
        <div className="text-center">
          <h2 className="text-xl font-bold text-t1">How It Works</h2>
          <p className="text-xs text-t3 mt-1">Architecture overview for the MediScrape platform</p>
        </div>

        {/* Pipeline */}
        <div className="flex flex-col items-center gap-0">
          {steps.map((step, i) => (
            <div key={step.label} className="flex flex-col items-center">
              <div className="bg-deep border border-border rounded-lg p-6 w-80 text-center hover:border-cyan/30 transition-colors">
                <div className="text-3xl mb-2">{step.icon}</div>
                <h3 className="font-bold text-sm" style={{ color: step.color }}>{step.label}</h3>
                <p className="text-xs text-t3 mt-1">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="flex flex-col items-center py-2">
                  <div className="w-0.5 h-6 bg-cyan/30" />
                  <div className="text-cyan text-xs">▼</div>
                  <div className="w-0.5 h-2 bg-cyan/30" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: '5', label: 'Parallel Agents', desc: 'Simultaneous pharmacy searches' },
            { value: '<30s', label: 'Average Response', desc: 'Full results from all sources' },
            { value: '5', label: 'Pharmacy Chains', desc: '3,700+ stores covered' },
          ].map((m) => (
            <div key={m.label} className="bg-deep border border-border rounded-lg p-6 text-center">
              <div className="text-3xl font-bold font-mono text-cyan">{m.value}</div>
              <div className="text-xs font-bold text-t1 mt-2">{m.label}</div>
              <div className="text-[10px] text-t3 mt-1">{m.desc}</div>
            </div>
          ))}
        </div>

        {/* Tech explanation */}
        <div className="bg-deep border border-border rounded-lg p-6">
          <h3 className="text-xs font-bold text-cyan uppercase tracking-wider mb-4">Technology Stack</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-t1 font-bold">Frontend:</span>
              <span className="text-t2 ml-2">Next.js 16, React 19, Tailwind CSS v4, Recharts</span>
            </div>
            <div>
              <span className="text-t1 font-bold">Backend:</span>
              <span className="text-t2 ml-2">FastAPI, Server-Sent Events, SQLite</span>
            </div>
            <div>
              <span className="text-t1 font-bold">AI Agents:</span>
              <span className="text-t2 ml-2">TinyFish parallel web agents with structured extraction</span>
            </div>
            <div>
              <span className="text-t1 font-bold">OCR:</span>
              <span className="text-t2 ml-2">Prescription image → drug list extraction via vision AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify** — `/architecture` renders clean diagram with metrics.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add architecture page for judges"
```

---

### Task 10: Final Verification

- [ ] **Step 1: Run full build check**

```bash
cd /home/gt120/projects/lotushacks26/frontend
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Manual smoke test all routes**

Visit each route and verify dark theme:
- `http://localhost:3000/` — Dashboard with search, agent cards, price grid
- `http://localhost:3000/trends` — Recharts chart, dark table
- `http://localhost:3000/alerts` — Tripwires and probes, dark forms
- `http://localhost:3000/optimize` — OCR upload, dark table, savings cards
- `http://localhost:3000/architecture` — Pipeline diagram, metrics

- [ ] **Step 3: Verify no light-mode artifacts**

Grep for old gray colors that shouldn't exist:

```bash
grep -r "bg-gray-50\|bg-white\|text-gray-900\|border-gray-200\|shadow-lg\|from-blue-600\|bg-blue-600" src/ --include="*.tsx"
```

Expected: No matches (all replaced with Abyss tokens).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final verification — all pages rethemed to Abyss"
```
