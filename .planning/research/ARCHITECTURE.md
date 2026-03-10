# Architecture Research: Real-Time Analytics Dashboard

## Component Overview

```
┌─────────────────────────────────────────┐
│              Frontend (public/)          │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Charts  │ │ Metrics  │ │ Alerts   │ │
│  │ Engine  │ │ Cards    │ │ Banner   │ │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ │
│       └──────┬────┘────────────┘        │
│         Polling Service (fetch)          │
└──────────────┬──────────────────────────┘
               │ HTTP (polling)
┌──────────────┴──────────────────────────┐
│           Express API (src/)             │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Metrics │ │ Alerts   │ │Dashboard │ │
│  │ Routes  │ │ Routes   │ │ Routes   │ │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ │
│       └──────┬────┘────────────┘        │
│         Data Layer (in-memory)           │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Metrics │ │ Alert    │ │Dashboard │ │
│  │ Store   │ │ Engine   │ │ Store    │ │
│  └─────────┘ └──────────┘ └──────────┘ │
│         Seed Data Generator              │
└──────────────────────────────────────────┘
```

## Data Flow
1. **Seed generator** creates historical time-series data on startup
2. **Metric simulator** adds new data points periodically (every 5s)
3. **API routes** expose current and historical metric data
4. **Frontend polling** fetches latest data every 2-5 seconds
5. **Chart engine** renders updates with smooth animations
6. **Alert engine** evaluates rules against latest values, triggers/resolves alerts

## File Structure (Recommended)
```
src/
  app.js            — Express app setup, middleware, routes
  data/
    metrics.js      — In-memory metrics store + seed generator
    alerts.js       — Alert rules engine + history
    dashboards.js   — Dashboard configurations store
  routes/
    metrics.js      — GET /api/metrics, /api/metrics/live, /api/metrics/:name
    alerts.js       — GET/POST /api/alerts, /api/alerts/history
    dashboards.js   — GET/POST/PUT /api/dashboards
api/
  index.js          — Vercel serverless entry point
public/
  index.html        — Main dashboard page
  css/
    styles.css      — Dark theme, glassmorphism, animations
  js/
    app.js          — Main app controller, polling
    charts.js       — Canvas chart rendering engine
    components.js   — UI components (cards, gauges, sparklines)
```

## Build Order
1. Data layer (metrics store, seed generator) — foundation
2. API routes — expose data
3. Basic frontend layout — HTML structure + CSS theme
4. Chart engine — canvas rendering
5. Advanced visualizations — gauges, heatmaps, sparklines
6. Alert system — rules, evaluation, UI
7. Dashboard management — save/load layouts
8. Polish — animations, loading states, responsive
