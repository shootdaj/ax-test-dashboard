# Research Summary: Real-Time Analytics Dashboard

## Stack Decision
- **Node.js 20 + Express 4.x** — backend API
- **Vanilla HTML/CSS/JS + Canvas API** — frontend, no build step
- **Vercel serverless** — deployment
- **In-memory storage** — no database needed

## Table Stakes Features
- Real-time metric display with auto-refresh
- Time-series line charts
- Multiple metric types (CPU, memory, requests/sec, error rate, response time)
- Time range selection (1h, 6h, 24h, 7d)
- Dark theme (standard for monitoring dashboards)
- Responsive layout

## Differentiators
- Glassmorphism UI with neon accents (cyan, magenta, green)
- 60fps canvas-based chart animations
- Gauge/donut charts, sparklines, heat maps
- Animated pulse dots for status indicators
- Alert system with pulsing banners
- Skeleton loading animations

## Key Risks
1. **Vercel cold starts** — Mitigate with fast deterministic seed data
2. **Canvas performance** — Use requestAnimationFrame, batch draws
3. **Route configuration** — Express must use full paths (`/api/metrics`)
4. **Glassmorphism perf** — Limit backdrop-filter usage
5. **Data volume** — Cap points, downsample older data

## Build Order
1. Data layer + API → 2. Basic frontend + theme → 3. Charts + visualizations → 4. Alerts → 5. Dashboard management → 6. Polish
