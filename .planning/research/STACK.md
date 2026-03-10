# Stack Research: Real-Time Analytics Dashboard

## Recommended Stack (2025)

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express 4.x — mature, well-documented, Vercel-compatible
- **No database** — in-memory data structures (Maps, Arrays)

### Frontend
- **Rendering:** Vanilla HTML/CSS/JS — no build step, direct Vercel deployment
- **Charts:** Canvas API (HTML5 Canvas) — 60fps rendering for real-time data
- **Layout:** CSS Grid + Flexbox
- **Styling:** CSS custom properties for theming, backdrop-filter for glassmorphism

### Deployment
- **Platform:** Vercel serverless functions
- **Entry:** `api/index.js` wrapping Express app
- **Static:** Served from `public/` directory

## Key Library Decisions

| Choice | Why | Confidence |
|--------|-----|------------|
| No charting library | Canvas API is sufficient for line/gauge/sparkline charts, avoids bundle size | High |
| No CSS framework | Custom dark theme + glassmorphism requires custom CSS anyway | High |
| Express over Fastify | Better Vercel compatibility, wider ecosystem | High |
| No bundler | Vanilla JS avoids build step complexity on Vercel | High |

## What NOT to Use
- **D3.js** — Overkill for this use case, heavy bundle
- **Chart.js** — Good but custom canvas gives more control over animations
- **React/Vue** — Unnecessary complexity for a single-page dashboard
- **Socket.io** — Vercel serverless doesn't support WebSockets; use polling

## Version Recommendations
- Node.js: 20.x (LTS)
- Express: 4.21.x
- No other runtime dependencies needed
