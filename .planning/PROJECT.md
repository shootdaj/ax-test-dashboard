# AX Test Dashboard

## What This Is

A stunning, data-rich real-time analytics dashboard inspired by Datadog and Grafana. It provides simulated metrics visualization (CPU, memory, requests/sec, error rate, response time) with a dark-themed, glassmorphism UI featuring neon accent colors, canvas-based charts, and a complete alert system. Built as a Node.js web app deployed to Vercel.

## Current State

**Version:** v1.0 (shipped 2026-03-10)
**Deployed to:** Vercel (pending deployment)
**Codebase:** 3,124 LOC JavaScript, 615 LOC CSS, 94 LOC HTML
**Stack:** Node.js (Express 5), vanilla HTML/CSS/JS, Canvas API

## Core Value

Users can monitor system health through beautiful, real-time visualizations that update live -- the kind of dashboard that makes people say "wow."

## Requirements

### Validated

- Simulated time-series data sources (CPU, memory, requests/sec, error rate, response time) -- v1.0
- Configurable data retention (1h, 6h, 24h, 7d) -- v1.0
- Metric aggregation (min, max, avg, p50, p95, p99 percentiles) -- v1.0
- Alert rules (threshold-based: warn/critical) -- v1.0
- Alert history with triggered/resolved timestamps -- v1.0
- Dashboard configurations (save/load custom layouts) -- v1.0
- Live polling endpoint for real-time updates -- v1.0
- Multi-tenant: multiple dashboards with own metric sources -- v1.0
- In-memory storage with seed data generator -- v1.0
- Dark theme with neon accent colors (cyan, magenta, green) -- v1.0
- Glassmorphism cards with blur and glow effects -- v1.0
- Real-time animated line charts (canvas-based, 60fps feel) -- v1.0
- Sparkline mini-charts in metric cards -- v1.0
- Gauge/donut charts for CPU and memory -- v1.0
- Heat map for request distribution by hour -- v1.0
- Alert banner that pulses when alerts fire -- v1.0
- Responsive CSS Grid layout -- v1.0
- Smooth transitions and hover effects -- v1.0
- Status indicators with animated pulse dots (green/yellow/red) -- v1.0
- Monospace numbers, clean sans-serif labels -- v1.0
- Loading skeleton animations -- v1.0

### Active

(No active requirements -- v1.0 complete)

### Out of Scope

- Authentication/login -- single-user demo dashboard
- Persistent database -- in-memory storage only
- Real infrastructure monitoring -- simulated data only
- Mobile native apps -- responsive web only
- WebSocket protocol -- polling-based live updates suffice

## Context

This is a demonstration/test project for the AX build system. The focus is on visual polish and a complete backend API. The dashboard looks production-quality with attention to animation, typography, and color. All data is simulated via a seed generator. In-memory storage resets on Vercel cold starts, which is acceptable for a demo.

## Constraints

- **Stack**: Node.js (Express) backend, vanilla HTML/CSS/JS frontend (no React/Vue -- keep it simple)
- **Deployment**: Vercel serverless
- **Storage**: In-memory only (no database)
- **Data**: Simulated metrics -- no real infrastructure integration

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vanilla JS over React | Simpler deployment, no build step needed for Vercel | Good -- zero build config, fast deploys |
| In-memory storage | No database dependency, simpler Vercel deployment | Good -- cold starts reseed data automatically |
| Canvas-based charts | Better performance for real-time animation than SVG | Good -- smooth rendering with gradient fills and glow effects |
| Polling over WebSockets | Vercel serverless doesn't support persistent connections | Good -- 3s polling provides adequate real-time feel |
| Express 5 | Latest version with modern features | Good -- route patterns work, no issues |

---
*Last updated: 2026-03-10 after v1.0 milestone*
