# MediScrape "The Abyss" — Full Retheme Design Spec

## Context

MediScrape is a pharmaceutical price intelligence platform for LotusHack 2026. The current frontend is a light-mode gray/white prototype with standard blue accents. The entire UI needs to be rebuilt with a deep-ocean "Abyss" dark theme — a data-dense, cyberpunk-pharmaceutical aesthetic with navy backgrounds, cyan accents, and dramatic red alerts.

**Important**: This retheme applies the Abyss visual treatment to existing functionality. Where the design references data fields that don't exist in the current backend (AWP/WAC, NDC, sparklines), these are rendered with the existing data mapped to the new labels, or shown as mock/placeholder data for demo purposes. This is a hackathon — presentation matters more than perfect data purity.

## Routes

| Route | Page Title | Status | Notes |
|-------|-----------|--------|-------|
| `/` | Dashboard | Retheme + enhance | Search + live streaming results + agent feed. Existing SSE search stays. |
| `/trends` | Price Trends | Retheme | Replace CSS bar chart with Recharts line chart. |
| `/alerts` | Alerts & Monitors | Retheme | Existing CRUD preserved with new styling. |
| `/optimize` | Prescription Optimizer | Retheme | Existing functionality including OCR upload preserved. |
| `/architecture` | How It Works | **New page** | Static/presentational architecture diagram for judges. No backend dependency. |

## NavBar

```
[MediScrape logo]  Dashboard | Trends | Alerts | Optimize | How It Works    [VN/EN]
```

**Changes from current NavBar** (which has: Search | Trends | Optimizer | Alerts):
- "Search" → "Dashboard" (search is now embedded in the dashboard)
- "Optimizer" → "Optimize"
- Reordered: Alerts before Optimize
- New: "How It Works" link
- New: VN/EN toggle (decorative for demo — no i18n implementation, just toggles a class)

**Styling**:
- Dark navy background `#0D1C32`, bottom border `rgba(0,219,231,0.1)`
- MediScrape logo: styled icon + text, cyan accent
- Active link: cyan text `#00DBE7` with subtle underline or bg highlight
- Inactive links: `#94A3B8`, hover → `#D6E3FF`
- Fixed at top

## Design System

### Colors

Register in `globals.css` using Tailwind v4 `@theme` block:

```css
@theme inline {
  --color-abyss: #0D1C32;
  --color-deep: #010E24;
  --color-card: #1C2A41;
  --color-accent-cyan: #00DBE7;
  --color-accent-red: #EE4042;
  --color-accent-green: #2DD4BF;
  --color-accent-orange: #F97316;
  --color-text-primary: #D6E3FF;
  --color-text-secondary: #94A3B8;
  --color-text-muted: #64748B;
  --color-alert-bg: #3C0004;
}
```

| Token | Hex | Usage |
|-------|-----|-------|
| `abyss` | `#0D1C32` | Primary page background |
| `deep` | `#010E24` | Input fields, nested panels, table rows |
| `card` | `#1C2A41` | Cards, sidebar, elevated surfaces |
| `accent-cyan` | `#00DBE7` | Primary accent, active states, chart lines |
| `accent-red` | `#EE4042` | Alerts, critical status, price spikes |
| `accent-green` | `#2DD4BF` | Success, stable, positive changes |
| `accent-orange` | `#F97316` | Warnings, moderate changes |
| `text-primary` | `#D6E3FF` | Headings, drug names, primary content |
| `text-secondary` | `#94A3B8` | Prices, data values |
| `text-muted` | `#64748B` | Labels, timestamps, metadata |
| `border-subtle` | `rgba(0,219,231,0.1)` | Table rows, section dividers |
| `alert-bg` | `#3C0004` | Megalodon alert bar background |

### Typography

- **Headings**: Geist Sans, `#D6E3FF`, bold
- **Data/numbers**: Geist Mono, `#94A3B8`
- **Labels**: Geist Sans, 9-11px uppercase, `#64748B`
- **Status pills**: 8-9px, uppercase, monospace, colored border + tinted bg

### Status Pills

| Status | Text Color | Border | Background |
|--------|-----------|--------|------------|
| TINYFISH (stable) | `#2DD4BF` | `rgba(20,184,166,0.3)` | `rgba(20,184,166,0.2)` |
| CRITICAL | `#EE4042` | `rgba(238,64,66,0.3)` | `rgba(238,64,66,0.2)` |
| MONITOR | `#3B82F6` | `rgba(59,130,246,0.3)` | `rgba(59,130,246,0.2)` |

### Pharmacy Source Colors

| Source | Color | Matches existing `SOURCE_COLORS` |
|--------|-------|---|
| Long Chau | `#3B82F6` (blue) | Yes |
| Pharmacity | `#22C55E` (green) | Yes |
| An Khang | `#F97316` (orange) | Yes |
| Than Thien | `#A855F7` (purple) | Yes |
| Medicare | `#14B8A6` (teal) | Yes |

## Page Designs

### `/` — Dashboard

The main page. Combines search, live agent streaming, and results display.

**Megalodon Alert Bar** (conditional — shown when any pharmacy result has a large price delta):
- Full width, `#3C0004` bg, left border `4px solid #EE4042`
- Warning icon + "MEGALODON SIGNAL DETECTED" + drug name + spike info
- "INTERCEPT" button on right (red bg) — scrolls to that result
- Data source: computed client-side from search results (compare prices across sources, flag if spread > 100%)

**Header Section**:
- Title: "Price Tracker: The Abyss"
- Subtitle: "Surfacing deep market trajectories and molecular cost-signals."
- Action buttons: "Export Intel" (export results as CSV), "Deploy New Probe" (triggers new search)

**Layout**: Two-column — main content (left) + Sonar Filters sidebar (right, 222px). Sidebar collapses below content on screens < 1024px.

**Main Content — retheme of existing search flow**:
- **Search bar**: replaces current `SearchBar` component. "Scan molecular signals..." placeholder, `bg-deep` background, cyan border on focus
- **Agent status cards**: retheme of existing `PharmacyCards`. Each pharmacy gets a dark card showing agent status, response time, result count. Uses pharmacy source colors.
- **Results table**: retheme of existing `PriceGrid`. Columns adapted to Abyss naming:
  - "Drug Name / NDC" → product_name (NDC shown as product code if available, else "—")
  - "Price" → uses existing `price` field, labeled as "AWP" for presentation
  - "Unit Price" → labeled as "WAC" for presentation
  - "24H" → price delta vs cheapest source (computed client-side)
  - "Status" → colored pill based on stock_status or computed from price spread
- **Savings banner**: retheme of existing `SavingsBanner` with Abyss colors
- **Footer bar**: new static element — "Privacy Protocol | Abyssal Methodology | Source Oracle" + "System Synchronized: HH:MM:SS UTC" (uses `new Date()`)

**Sonar Filters Sidebar** (new — client-side filtering of displayed results):
- "Selected Molecule" — text input filtering results by drug name
- Source toggles — show/hide results from specific pharmacies
- Price range — filter displayed results by price bracket
- "Clear All Filters" link
- These all filter the already-fetched results client-side. No new API calls.

### `/trends` — Price Trends (Depth Analysis)

Retheme of existing trends page. Functional changes:
- Replace CSS bar chart with Recharts `<LineChart>` with one line per pharmacy source
- Each line uses its pharmacy source color
- Source legend below chart with colored dots
- **Price summary table**: same data, Abyss styling — dark rows, muted borders, pharmacy source color dots
- Search input and time range pills restyled to Abyss theme
- Data source: existing `GET /api/trends/:query?days=N` — no changes

### `/alerts` — Alerts & Monitors (Megalodon Alert System)

Retheme of existing alerts page. Same CRUD functionality, new visual treatment.

**API endpoints** (existing, preserved as-is):
- `GET /api/alerts` — list alerts
- `POST /api/alerts` — create alert (body: `{ drug_query, price_threshold }`)
- `DELETE /api/alerts/:id` — delete alert
- `GET /api/monitors` — list monitors
- `POST /api/monitor` — create monitor (note: singular, existing backend convention)

**Active Tripwires** (price alerts):
- Each alert: dark card (`bg-deep`), drug name in primary text, threshold in orange, "ARMED" green status pill
- Delete button styled as subtle red text

**Sonar Probes** (recurring monitors):
- Each monitor: dark card, drug name, interval, last run timestamp, green heartbeat dot
- Create form: drug name input + interval select + "DEPLOY" cyan button

### `/optimize` — Prescription Optimizer

Retheme of existing optimize page. **Preserves OCR prescription upload feature** (existing `POST /api/ocr`).

- **Prescription Manifest**: drug list with quantity, best price, best source
- Add drug input row
- OCR upload button (camera icon) — rethemed with Abyss colors
- **Summary cards** (2-column grid):
  - Optimized Total (green border, large price in VND)
  - Savings vs Single Source (red border, large percentage)
- **"CALCULATE OPTIMAL ROUTE"** full-width cyan CTA
- Data source: existing `POST /api/optimize` with `{ drugs: [...] }` body

### `/architecture` — How It Works (NEW PAGE)

Brand new static page. No backend dependency.

- Architecture diagram showing: User → Frontend → Backend API → TinyFish Agents → Pharmacy Websites
- Built with CSS/HTML (no external diagramming library)
- Styled as dark "system diagram" with cyan connection lines and animated flow dots
- Key metrics displayed: "5 parallel agents", "30s average response", "5 pharmacy chains"
- Brief text explanation of TinyFish technology for judges

## Component Migration

| Existing Component | Action | Replacement |
|---|---|---|
| `NavBar` | **Replace** | `AbyssNavBar` |
| `SearchBar` | **Replace** | Inline in dashboard page (Abyss-styled input) |
| `PharmacyCards` | **Retheme** | `AgentStatusCards` (same data, dark theme) |
| `PriceGrid` | **Replace** | `AbyssDataTable` |
| `SavingsBanner` | **Retheme** | `IntelSummary` (same data, dark theme) |

### New Components

| Component | Used On | Purpose |
|-----------|---------|---------|
| `AbyssNavBar` | All pages (layout.tsx) | Top navigation with MediScrape branding |
| `MegalodonAlert` | Dashboard | Conditional price spike warning bar |
| `PricingChart` | Trends | Recharts line chart with gradient fill and multi-source overlay |
| `AbyssDataTable` | Dashboard | Drug pricing table with status pills |
| `StatusPill` | Tables, Alerts | Reusable colored status badge |
| `AgentStatusCards` | Dashboard | Rethemed pharmacy agent cards |
| `IntelSummary` | Dashboard | Rethemed savings/summary banner |
| `SonarFilters` | Dashboard | Client-side result filter sidebar |
| `TripwireCard` | Alerts | Individual price alert card |
| `SonarProbeCard` | Alerts | Individual monitor card |
| `AbyssFooter` | All pages (layout.tsx) | Static bottom bar — sync timestamp, protocol links. Not sticky, just bottom of page content. |
| `ArchitectureDiagram` | Architecture | CSS/HTML system diagram |

## Dependencies to Add

- `recharts` — line charts with gradient fills
- `next/font` — Geist Mono (for data display, may need explicit import)

## Loading / Empty / Error States

All states use Abyss theme:
- **Loading**: Pulsing cyan dots animation on `bg-deep` background. Agent cards show "Scanning..." with animated border.
- **Empty**: Centered message on `bg-abyss` — "Deploy a probe to begin scanning" with muted text
- **Error**: Red-tinted card (`border-accent-red`) with error message and retry button

## Data Flow

All pages fetch from the existing backend at `API_URL` (`http://localhost:8000`):

- **`/`**: `POST /api/search?query=...` — SSE readable stream (not EventSource). Read with `response.body.getReader()`. Parse `data:` lines as JSON.
- **`/trends`**: `GET /api/trends/:query?days=N`
- **`/alerts`**: `GET/POST /api/alerts`, `DELETE /api/alerts/:id`, `GET /api/monitors`, `POST /api/monitor` (singular)
- **`/optimize`**: `POST /api/optimize` with `{ drugs: [...] }`, `POST /api/ocr` for prescription image upload
- **`/architecture`**: No backend calls — static page

## Verification

1. `npm run dev` — all 5 routes render without errors
2. Search on dashboard streams results with Abyss styling
3. Trends chart renders with Recharts, correct pharmacy colors and gradient fills
4. Alert/monitor CRUD still works with new UI
5. Optimize page preserves OCR upload functionality
6. Architecture page renders clean diagram
7. Responsive: two-column layout at 1280px+, single column below 1024px
8. No light-mode artifacts — entire app is dark-only
9. All existing API integrations work unchanged
