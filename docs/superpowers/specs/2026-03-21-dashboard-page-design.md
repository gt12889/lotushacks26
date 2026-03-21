# Dashboard Page Design

> **SUPERSEDED — NOT IMPLEMENTED.** This spec describes a separate `/dashboard` route and components that were never built. The actual dashboard lives at `/` (root route) with the existing component set. The API endpoints described here (`/api/competitors`, `/api/movements`, `/api/analytics`) do not exist.

**Date:** 2026-03-21
**Route:** `/dashboard`
**Status:** Superseded — never implemented

## Overview

New dashboard page for Megladon MD providing competitive pharmaceutical pricing intelligence at a glance. Matches the Figma "Abyss" dark-theme design with cyan (#00DAF3), green (#48DDBC), and slate gray accents on a #0F172A background.

## Page Sections

### 1. Header Label
- Small uppercase label: "INTELLIGENCE CENTRE"
- Cyan (#00DAF3) horizontal accent line
- Positioned top-left

### 2. Hero / Title Area
- Large heading: "Competition Deep-Dive"
- Subtitle descriptive text (2-3 lines) about the competitive landscape
- Two CTA buttons side-by-side:
  - **"Explore Intel"** — outlined/ghost button with rounded corners, border color #45474C
  - **"Refreshes"** — gradient-filled button (#00DAF3 → dark), white text

### 3. Three Stat Cards (horizontal row)
Each card is a rounded rectangle with a colored left/top border accent:

| Card | Border Color | Company | Main Metric | Secondary Stat | Progress Bar | Tag |
|------|-------------|---------|-------------|----------------|-------------|-----|
| 1 | #00DAF3 (cyan) | GlaxoSmithKline | 24.8% | +4.2 | ~78% filled (cyan) | APEX |
| 2 | #48DDBC (green) | Prize Inc. | 19.2% | -1.4 | ~54% filled (green) | MEDIUM |
| 3 | #475569 (gray) | Merck & Co. | 12.5% | +0.8 | ~31% filled (gray) | LOW |

Card contents:
- Company name (large text)
- Subtitle text (small, muted)
- Main percentage metric (prominent)
- Secondary stat with +/- indicator
- Progress bar with colored fill
- Additional detail rows (key-value pairs)
- Status tag (colored badge)

Card backgrounds: `white/1%` with subtle border (`#45474C/30%` or colored accent)

### 4. Two Content Panels (side-by-side)
- **Left — "Critical Alert"**: Cyan border, icon + title, paragraph of alert text, sub-metrics, action items
- **Right — "Movement Detected"**: Green border, icon + title, timeline/event log entries with timestamps

Both panels: dark semi-transparent background, 12px rounded corners, colored left border

### 5. Analytics Section
- Donut/pie chart showing market share breakdown (3 segments matching card colors)
- Large center number (e.g., "100")
- Legend with color dots, labels, and percentage values
- Supplementary metric cards alongside

### 6. Diamond Radar Graphic
- Concentric diamond shapes (rotated squares) with decreasing opacity
- Crosshair lines (horizontal + vertical)
- Center dot (white fill)
- Inner/outer diamonds with colored strokes (#00DAF3, #48DDBC)
- Decorative element positioned in lower section

## Component Structure

```
src/app/dashboard/
  page.tsx                    # Main page (server component shell)

src/components/dashboard/
  DashboardHeader.tsx         # "INTELLIGENCE CENTRE" label + accent line
  DashboardHero.tsx           # Title, subtitle, CTA buttons
  StatCard.tsx                # Reusable stat card (props: color, company, metrics)
  StatCardsRow.tsx            # Horizontal row of 3 StatCards
  ContentPanel.tsx            # Reusable panel (alert / movement)
  AlertPanel.tsx              # Critical Alert content
  MovementPanel.tsx           # Movement Detected content
  AnalyticsChart.tsx          # Donut chart + legend + metrics
  DiamondRadar.tsx            # Decorative diamond radar SVG
```

## Data Shape (Static Mock)

```typescript
interface StatCardData {
  company: string;
  subtitle: string;
  mainMetric: number;       // e.g. 24.8
  secondaryStat: number;    // e.g. +4.2
  progress: number;         // 0-100
  tag: string;              // "APEX" | "MEDIUM" | "LOW"
  accentColor: "cyan" | "green" | "gray";
  details: { label: string; value: string }[];
}

interface AlertData {
  title: string;
  description: string;
  metrics: { label: string; value: string }[];
}

interface MovementEntry {
  timestamp: string;
  description: string;
  type: "info" | "warning" | "success";
}

interface ChartSegment {
  label: string;
  value: number;
  color: string;
}
```

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | #0F172A | Page background |
| `--bg-card` | rgba(255,255,255,0.01) | Card backgrounds |
| `--accent-cyan` | #00DAF3 | Primary accent |
| `--accent-green` | #48DDBC | Secondary accent |
| `--accent-red` | #FFB4AB | Warning/negative |
| `--text-primary` | #DCE2F3 | Main text |
| `--text-secondary` | #64748B | Muted text |
| `--text-tertiary` | #94A3B8 | Subtle text |
| `--border-subtle` | rgba(69,71,76,0.3) | Card borders |
| `--border-muted` | #1E293B | Dividers |

## Styling Approach

- Tailwind CSS utility classes throughout
- No external chart library — donut chart via SVG/CSS
- Diamond radar as inline SVG component
- Responsive: 3-column cards → 1-column on mobile; 2-panel row → stacked on mobile
- All text uses existing Tailwind font stack

## API Integration (PENDING)

> **TODO:** Wire static mock data to real backend endpoints:
> - `GET /api/competitors` — stat card data
> - `GET /api/alerts` — critical alerts
> - `GET /api/movements` — movement timeline
> - `GET /api/analytics` — chart data
>
> This is tracked in `tasks/todo.md`.

## File Location

- Page: `src/app/dashboard/page.tsx`
- Components: `src/components/dashboard/`
- NavBar update: add `/dashboard` link to `src/components/NavBar.tsx`
