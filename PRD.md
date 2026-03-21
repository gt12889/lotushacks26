# GhostDriver - Product Requirements Document

## Overview

GhostDriver is a Vietnamese traffic incident analysis platform that takes a license plate number, vehicle type, and incident photo as input, runs three parallel data fetches, synthesizes the results with AI, and outputs a structured evidence package with violation history, scene analysis, legal references, fault assessment, and a shareable PDF report.

---

## Problem Statement

After a traffic incident in Vietnam, gathering evidence is manual, slow, and fragmented. Drivers must separately check violation history on government portals (csgt.vn), interpret scene damage, and look up relevant traffic laws. GhostDriver automates all three in a single query.

---

## User Flow

1. User enters a license plate number, selects vehicle type (motorbike/car/truck), and uploads an incident photo
2. Optionally adds free-text for location, time, and description
3. Hits "Analyze" -- a live progress bar shows which of three parallel fetches have completed
4. Dashboard populates with violation history, scene analysis, risk score, and legal references
5. ElevenLabs reads the Vietnamese summary aloud
6. User exports a PDF evidence package for police or insurance

---

## Architecture

### Pipeline

Linear and clean: one user input triggers 3 parallel data fetches, feeds into a synthesis engine, and outputs a structured evidence package.

```
User Input
    |
    +---> Task 1: TinyFish (violation history)
    +---> Task 2: Fal.AI (scene analysis)
    +---> Task 3: Exa (legal search)
    |
    v
Synthesis (GPT-4o + Qwen)
    |
    v
Formatting (JigsawStack)
    |
    +---> Dashboard UI
    +---> ElevenLabs Voice
    +---> PDF Export
```

---

## Components

### Frontend -- Next.js + Tailwind

- **Inputs**: License plate number, vehicle type selector (motorbike/car/truck matching csgt.vn's form), incident photo upload
- **Optional fields**: Location, time, description (free-text)
- **Layout**: Clean single-page design
- **Progress**: Live progress bar showing completion status of each parallel fetch

### Backend -- FastAPI + asyncio

Single `/analyze` endpoint that fans out three async tasks simultaneously using `asyncio.gather()`. Total latency equals the slowest task, not their sum.

#### Task 1: TinyFish Agent (Violation History)

- Pass license plate number and vehicle type to TinyFish
- Goal: "Navigate csgt.vn, enter this license plate, solve the CAPTCHA, and return all violation records as JSON"
- TinyFish handles CAPTCHA natively as part of its anti-bot infrastructure
- Simultaneously hit vr.org.vn for registration and inspection validity
- **This is the core Enterprise Track argument** -- native CAPTCHA handling

#### Task 2: Fal.AI (Scene Analysis)

- Send uploaded incident image to a vision model
- Prompt identifies: visible damage, point of impact, road conditions, vehicle positions, visible license plate confirmation
- Returns structured JSON

#### Task 3: Exa (Legal Search)

- Search for relevant Vietnamese traffic law articles based on incident description
- Returns cited legal references embedded in the final report

### Synthesis -- OpenAI GPT-4o + Qwen

- Feed all three task outputs into a single GPT-4o prompt
- System prompt: act as a Vietnamese traffic incident analyst
- Produces structured evidence report with:
  - Violation history summary
  - Scene analysis findings
  - Applicable legal codes
  - Fault assessment
  - Recommended next steps
- Qwen runs as a parallel call specifically for parsing Vietnamese-language text returned from csgt.vn (superior Vietnamese comprehension for government portal output)

### Formatting -- JigsawStack

- Structures synthesis output into a clean JSON evidence package
- Handles PDF generation for shareable export
- Natural fit: JigsawStack has document structuring built in

### Caching -- Redis

- Cache csgt.vn lookup results by plate number with 24-hour TTL
- Same plate queried twice in a day hits cache, not TinyFish
- Keeps costs down and demo speed high

### Output Layer

Three simultaneous outputs:

1. **Dashboard UI** -- renders risk score and violation history visually
2. **ElevenLabs Voice** -- reads summary aloud in Vietnamese
3. **PDF Export** -- packages everything for sharing with police or insurance

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js + Tailwind |
| Backend | FastAPI + asyncio |
| Web Agent | TinyFish (csgt.vn + vr.org.vn) |
| Vision | Fal.AI |
| Legal Search | Exa |
| Synthesis | OpenAI GPT-4o + Qwen |
| Formatting | JigsawStack |
| Caching | Redis |
| Voice | ElevenLabs |
| IDE | Trae |

---

## Demo Script (for Judges)

1. Type in a real Vietnamese plate number (prepare one with known violations)
2. Upload a sample incident photo
3. Hit Analyze -- show the live progress bar hitting all three fetches
4. Dashboard populates with violation history, scene analysis, risk score
5. ElevenLabs reads the Vietnamese summary aloud
6. Export the PDF

---

## Security Considerations

- CAPTCHA solving is handled natively by TinyFish (no third-party CAPTCHA services)
- Uploaded images should be validated and sanitized server-side
- Redis cache should not store sensitive personal data beyond plate lookups
- API keys for all services stored in environment variables, never committed

---

## Success Metrics

- End-to-end analysis completes in under 15 seconds
- All three parallel fetches resolve successfully
- PDF export contains all five report sections
- Vietnamese voice output is intelligible and accurate
- Cache hit rate reduces TinyFish calls by 50%+ during demo
