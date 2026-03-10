# Pitfalls Research: Real-Time Analytics Dashboard

## Critical Pitfalls

### 1. Vercel Serverless Cold Starts Reset In-Memory Data
- **Warning signs:** Data disappears after inactivity
- **Prevention:** Seed data on every cold start. Design seed generator to be deterministic and fast (<100ms). Accept that data resets — it's simulated anyway.
- **Phase:** Phase 1 (data layer)

### 2. Canvas Chart Performance
- **Warning signs:** Janky animations, high CPU usage, frame drops
- **Prevention:** Use requestAnimationFrame, batch draw calls, avoid clearing/redrawing entire canvas when only new points arrive. Use offscreen canvas for complex rendering.
- **Phase:** Phase 2-3 (chart engine)

### 3. Vercel Route Configuration
- **Warning signs:** 404 errors on API routes, static files not served
- **Prevention:** Express must handle full paths (e.g., `/api/metrics`, not just `/metrics`). vercel.json routes must match. Test locally with `vercel dev` or just `node src/app.js`.
- **Phase:** Phase 1 (initial setup)

### 4. Polling Frequency vs Perceived Responsiveness
- **Warning signs:** Dashboard feels laggy or makes too many requests
- **Prevention:** Poll every 2-3 seconds for live data. Use CSS transitions to interpolate between data points visually. Show "last updated" timestamp.
- **Phase:** Phase 2-3 (frontend)

### 5. Glassmorphism Performance
- **Warning signs:** Sluggish scrolling, blur artifacts
- **Prevention:** Use `backdrop-filter: blur()` sparingly. Limit blur to card backgrounds, not overlapping elements. Test on lower-end devices. Provide fallback for browsers without backdrop-filter support.
- **Phase:** Phase 2 (CSS/styling)

### 6. Responsive Layout Breakpoints
- **Warning signs:** Charts overflow containers, text overlaps on mobile
- **Prevention:** Design mobile-first grid. Charts should have minimum widths and gracefully stack on narrow screens. Use ResizeObserver for canvas chart resizing.
- **Phase:** Phase 3 (responsive polish)

## Medium Pitfalls

### 7. Color Accessibility with Neon Theme
- **Prevention:** Ensure text on glassmorphism backgrounds has sufficient contrast. Use slightly desaturated neon colors for text, bright neon for accents/borders only.

### 8. Time-Series Data Volume
- **Prevention:** Cap data points per metric (e.g., 1000 points). Downsample older data. 7d retention at 5s intervals = 120,960 points — aggregate to 1-minute intervals for older data.
