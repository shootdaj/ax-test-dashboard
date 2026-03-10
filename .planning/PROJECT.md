# AX Test Dashboard

## What This Is

A stunning, data-rich real-time analytics dashboard inspired by Datadog and Grafana. It provides simulated metrics visualization (CPU, memory, requests/sec, error rate, response time) with a dark-themed, glassmorphism UI featuring neon accent colors. Built as a Node.js web app deployed to Vercel.

## Core Value

Users can monitor system health through beautiful, real-time visualizations that update live — the kind of dashboard that makes people say "wow."

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Simulated time-series data sources (CPU, memory, requests/sec, error rate, response time)
- [ ] Configurable data retention (1h, 6h, 24h, 7d)
- [ ] Metric aggregation (min, max, avg, p50, p95, p99 percentiles)
- [ ] Alert rules (threshold-based: warn/critical)
- [ ] Alert history with triggered/resolved timestamps
- [ ] Dashboard configurations (save/load custom layouts)
- [ ] Live polling endpoint for real-time updates
- [ ] Multi-tenant: multiple dashboards with own metric sources
- [ ] In-memory storage with seed data generator
- [ ] Dark theme with neon accent colors (cyan, magenta, green)
- [ ] Glassmorphism cards with blur and glow effects
- [ ] Real-time animated line charts (canvas-based, 60fps feel)
- [ ] Sparkline mini-charts in metric cards
- [ ] Gauge/donut charts for CPU and memory
- [ ] Heat map for request distribution by hour
- [ ] Alert banner that pulses when alerts fire
- [ ] Responsive CSS Grid layout
- [ ] Smooth transitions and hover effects
- [ ] Status indicators with animated pulse dots (green/yellow/red)
- [ ] Monospace numbers, clean sans-serif labels
- [ ] Loading skeleton animations

### Out of Scope

- Authentication/login — single-user demo dashboard
- Persistent database — in-memory storage only
- Real infrastructure monitoring — simulated data only
- Mobile native apps — responsive web only
- WebSocket protocol — polling-based live updates suffice

## Context

This is a demonstration/test project for the AX build system. The focus is on visual polish and a complete backend API. The dashboard should look production-quality with attention to animation, typography, and color. All data is simulated via a seed generator.

## Constraints

- **Stack**: Node.js (Express) backend, vanilla HTML/CSS/JS frontend (no React/Vue — keep it simple)
- **Deployment**: Vercel serverless
- **Storage**: In-memory only (no database)
- **Data**: Simulated metrics — no real infrastructure integration

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vanilla JS over React | Simpler deployment, no build step needed for Vercel | — Pending |
| In-memory storage | No database dependency, simpler Vercel deployment | — Pending |
| Canvas-based charts | Better performance for real-time animation than SVG | — Pending |
| Polling over WebSockets | Vercel serverless doesn't support persistent connections | — Pending |

---
*Last updated: 2026-03-10 after initialization*
