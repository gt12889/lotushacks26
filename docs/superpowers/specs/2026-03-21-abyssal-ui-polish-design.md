# Abyssal UI Polish — Design Spec

**Date**: 2026-03-21
**Scope**: Visual polish for Dashboard (page.tsx) and Architecture (/architecture/page.tsx)
**Approach**: Pure CSS/Tailwind — zero new dependencies
**Priority**: Demo-first, maximum visual impact (hackathon presentation)

---

## Overview

Five visual enhancements layered onto the existing MegalodonMD deep-sea theme:

1. Bioluminescent Data Cards
2. Sonar Pulse Animations
3. Interactive Terminal Feed
4. Refined AI Model Pipeline
5. Enhanced Architecture Flow

All changes are purely visual. No logic, data flow, or API changes.

---

## 1. Bioluminescent Data Cards

**Affected components**: PharmacyCards, LiveMetricsBar, CeilingPanel, and card-like containers on both dashboard and architecture pages.

### New CSS class: `.bioluminescent-card` (in `globals.css`)

**Glassmorphism base**:
- Background: `rgba(1, 14, 36, 0.85)` (semi-transparent)
- Border: `1px solid rgba(0, 219, 231, 0.15)`
- No `backdrop-filter` — the page background is solid `bg-deep`, so blur has nothing to act on. The visual depth comes from the semi-transparent background + border + animated glow instead.

**Animated glow**:
- New keyframe `@keyframes bioGlow`:
  ```css
  @keyframes bioGlow {
    0%, 100% { box-shadow: 0 0 0px 0px var(--bio-color, rgba(0, 219, 231, 0.05)); }
    50% { box-shadow: 0 0 8px 4px var(--bio-color, rgba(0, 219, 231, 0.05)); }
  }
  ```
- 4s cycle, `ease-in-out`. Subtle, ambient — not attention-grabbing

**Hover state**:
- Border opacity: 0.15 → 0.3
- Shadow spread: +2px
- Transition: 0.3s ease

**PharmacyCards color-matching**:
- Each pharmacy card's glow uses its pharmacy color instead of uniform cyan:
  - Long Chau: `#3B82F6` (blue)
  - Pharmacity: `#22C55E` (green)
  - An Khang: `#F97316` (orange)
  - Than Thien: `#A855F7` (purple)
  - Medicare: `#14B8A6` (teal)
- Implemented via CSS custom property `--bio-color` set inline per card

---

## 2. Sonar Pulse Animations

**Affected components**: AgentActivityFeed status dots, AgentCascade tier status dots.

**Note**: LiveMetricsBar shows numeric values, not status dots — sonar dots do not apply there. LiveMetricsBar gets `.bioluminescent-card` treatment only (Section 1).

### New CSS class: `.sonar-dot` (in `globals.css`)

**Structure**:
- Base element: solid dot (current behavior)
- `::before` and `::after` pseudo-elements: expanding concentric rings
- Ring animation: `@keyframes sonarPulse` — scale 1x → 2.5x, opacity 40% → 0%, 2s cycle
- `::after` delayed by 0.7s for staggered overlap

**Color variants via `--sonar-color`**:
- Cyan: spawn events
- Orange: searching/active
- Green: success/complete
- Red: error/fail
- Purple: variant discovery

**Behavior**:
- Rings animate only during active/searching states
- Completed states: solid dot, no pulse

**"LIVE" badge**:
- Added to AgentActivityFeed header
- Small pill with sonar-pulsing dot + "LIVE" text in cyan
- Own sonar pulse to signal real-time streaming

---

## 3. Interactive Terminal Feed

**Affected component**: AgentActivityFeed

### Terminal chrome (top bar)
- Three window dots (red `#EE4042`, yellow `#FFBD2E`, green `#2DD4BF`), 6px circles
- Title: `MEGALODON :: AGENT_FEED v2.1` in muted monospace

### CRT/scanline overlay
- Repeating `linear-gradient` overlay: 2px horizontal lines at 3% opacity
- Applied via `::after` pseudo-element on the feed container, `pointer-events: none`

### Text treatment
- Phosphor glow: `text-shadow: 0 0 4px rgba(0, 255, 204, 0.3)` on log text
- Subtle green-cyan tint blended with existing event colors
- Left-side `>` prompt characters for each log entry

### Entry animation
- Migrate `fadeSlideIn` from the component's `<style jsx>` block into `globals.css` for consistency (all keyframes live in one place)
- Replace `fadeSlideIn`'s opacity transition with a `typewriter` flicker: opacity stutters 0 → 0.5 → 1 over 0.15s, then holds. The `translateY` slide is kept. Combined as a single animation, not two competing ones:
  ```css
  @keyframes terminalSlideIn {
    0% { opacity: 0; transform: translateY(6px); }
    30% { opacity: 0.5; transform: translateY(3px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  ```
- Also migrate `fadeSlideIn` from PriceGrid's `<style jsx>` block into `globals.css`. PriceGrid keeps using the original `fadeSlideIn`; AgentActivityFeed switches to `terminalSlideIn`.

### Blinking cursor
- `█` character rendered as a separate `<div>` after the event list, inside the scrollable container
- Scrolls with the list (not fixed-positioned) — auto-scroll keeps it visible
- Only rendered when `isSearching` is true
- `@keyframes blink`: opacity toggles 0/1 at 1s interval

### Scrollbar
- Styled via raw CSS in `globals.css` (not Tailwind plugin — avoid dependency):
  ```css
  .terminal-feed::-webkit-scrollbar { width: 4px; }
  .terminal-feed::-webkit-scrollbar-thumb { background: rgba(0, 219, 231, 0.2); border-radius: 2px; }
  .terminal-feed::-webkit-scrollbar-track { background: transparent; }
  ```

**No logic changes**: same 50-event buffer, auto-scroll, event types.

---

## 4. Refined AI Model Pipeline

**Affected component**: ModelRouterPanel

### Animated latency bars

**Active state**:
- `@keyframes gradientShift`: slides `linear-gradient(90deg, cyan, teal, cyan)` via `background-position` animation, 1.5s loop
- `background-size: 200% 100%` to enable the sliding effect

**Completion**:
- Gradient freezes at final width
- Brief glow flash: 0.2s `box-shadow` bloom then fade via `@keyframes completionFlash`

**Pending**:
- Empty bar with dim border, no gradient

**Bar container**:
- Inner shadow: `inset 0 1px 3px rgba(0,0,0,0.4)` for depth

### Sponsor/provider branding

- Keep existing `SponsorBadge` in the collapsible header as-is
- Add `⚡ Routed via OpenRouter` label below the header, in t2 text with 2px orange left-border accent
- Per-step sponsor attribution: dim t3 text beneath model name:
  - Normalize step: "Qwen 2.5 72B"
  - Search step: "Powered by TinyFish"
  - Discovery step: "Exa Neural Search"
  - OCR step: "OpenAI GPT-4o"

### Status indicator upgrades

Refactor the `StatusIndicator` inline function: replace text characters (`○`, `◉`, `✓`) with styled `<span>` elements so pseudo-element animations can be applied:

- **Pending**: 6px hollow ring (`border: 1px solid` in t3 color, `border-radius: 50%`)
- **Active**: 6px solid dot with `.sonar-dot` class (reuse from Section 2, `--sonar-color: var(--color-cyan)`)
- **Done**: 6px solid green dot + brief flash via `@keyframes completionFlash`, then static checkmark `✓` in green

---

## 5. Enhanced Architecture Flow

**Affected page**: `/architecture/page.tsx` — visual rewrite of layout, keeping existing content.

### DOM structure

```
<div class="arch-flow"> <!-- CSS grid: 3 columns, position: relative -->
  <!-- Column 1: Input -->
  <div class="arch-col">
    <ArchNode icon="👤" name="User" desc="Drug search query" />
    <ArchConnector direction="down" />
    <ArchNode icon="⚛️" name="Next.js Frontend" desc="Real-time SSE dashboard" badge="React 19" />
  </div>

  <!-- Column 2: Orchestration -->
  <div class="arch-col">
    <ArchNode icon="⚡" name="FastAPI Backend" desc="Async orchestration hub" badge="Python" />
  </div>

  <!-- Column 3: Services (vertical stack) -->
  <div class="arch-col arch-services">
    <ArchNode icon="🐟" name="TinyFish" desc="5 parallel stealth agents" badge="tinyfish.ai" />
    <ArchNode icon="🌐" name="BrightData" desc="Proxy + anti-bot" badge="brightdata.com" />
    <ArchNode icon="🔍" name="Exa" desc="Drug intelligence" badge="exa.ai" />
    <ArchNode icon="🤖" name="OpenRouter" desc="Qwen / OpenAI routing" badge="openrouter.ai" />
    <ArchNode icon="🔊" name="ElevenLabs" desc="Voice alerts" badge="elevenlabs.io" />
    <ArchNode icon="💬" name="Discord" desc="Webhook notifications" badge="discord.com" />
  </div>

  <!-- Horizontal connectors between columns: simple div bars -->
  <div class="arch-connector-h col1-to-col2" />
  <div class="arch-connector-h col2-to-col3" />
</div>
```

### Node design (`ArchNode` — inline component, not a separate file)
- Reuse `.bioluminescent-card` class
- Content stacked vertically: emoji (24px), name (bold, `text-shadow` glow), description (t2), badge (t3, dim)
- Hover: glow intensifies (same as Section 1 hover behavior)

### Connectors (simplified — no `:has()` or sibling selectors)

**Vertical connectors** (`ArchConnector`): A simple `<div>` between nodes in the same column:
- `width: 2px; height: 24px; margin: 0 auto`
- `background: linear-gradient(to bottom, transparent, var(--color-cyan), transparent)`

**Horizontal connectors** (between columns): Absolutely positioned `<div>` bars:
- `height: 2px; background: linear-gradient(to right, transparent, var(--color-cyan), transparent)`
- Positioned via `top`/`left`/`right` to connect column centers
- Animated: `@keyframes flowPulse` — `background-position` shifts left-to-right (reuses `gradientShift` pattern from Section 4, but horizontal)

**No hover-based connector highlighting** — descoped to avoid fragile CSS. The bioluminescent card hover glow is sufficient visual feedback.

### Stats row
- Bottom of page: existing metrics (5 parallel agents, <30s response, 5 pharmacy chains)
- Rendered as `.bioluminescent-card` cards in a `grid-cols-3` layout

### Tech stack section
- Keep existing tech stack display, apply `.bioluminescent-card` to each tech item

---

## Files Modified

| File | Change |
|------|--------|
| `frontend/src/app/globals.css` | New keyframes (`bioGlow`, `sonarPulse`, `gradientShift`, `completionFlash`, `blink`, `terminalSlideIn`, `fadeSlideIn` migrated from components), new utility classes (`.bioluminescent-card`, `.sonar-dot`, `.terminal-feed`, `.scanlines`), raw scrollbar styles |
| `frontend/src/components/PharmacyCards.tsx` | Apply `.bioluminescent-card` with per-pharmacy `--bio-color` |
| `frontend/src/components/LiveMetricsBar.tsx` | Apply `.bioluminescent-card` (no sonar dots — this component shows numeric values, not status dots) |
| `frontend/src/components/CeilingPanel.tsx` | Apply `.bioluminescent-card` |
| `frontend/src/components/AgentActivityFeed.tsx` | Terminal chrome, scanlines, prompt chars, cursor, LIVE badge, sonar dots, remove `<style jsx>` block (migrated to globals.css) |
| `frontend/src/components/AgentCascade.tsx` | Sonar dots on active tier indicators |
| `frontend/src/components/ModelRouterPanel.tsx` | Animated gradient bars, sponsor labels, sonar status dots |
| `frontend/src/app/architecture/page.tsx` | Visual rewrite: 3-column node-connector diagram with bioluminescent cards, inline ArchNode/ArchConnector components |
| `frontend/src/components/PriceGrid.tsx` | Remove `<style jsx>` block (migrated `fadeSlideIn` to globals.css) |

## Files NOT Modified

- `backend/*` — no backend changes
- `frontend/src/app/page.tsx` — dashboard layout/logic unchanged (components handle their own styling)
- No new dependencies added to `package.json`

---

## Success Criteria

- All 5 enhancements visually present and smooth at 60fps
- No layout shifts or content jumps from animation additions
- Existing functionality (SSE streaming, search, results) completely unaffected
- Architecture page clearly shows data flow path with all sponsor credits
- Demo-ready: impressive on first impression, holds up under presenter scrutiny
