'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Frontend Assets', () => {
  const publicDir = path.join(__dirname, '..', '..', 'public');

  it('index.html exists and contains required elements', () => {
    const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');

    // Required structural elements
    assert.ok(html.includes('metrics-grid'), 'Should have metrics grid');
    assert.ok(html.includes('charts-grid'), 'Should have charts grid');
    assert.ok(html.includes('alert-banner'), 'Should have alert banner');
    assert.ok(html.includes('time-range'), 'Should have time range selector');
    assert.ok(html.includes('dashboard-select'), 'Should have dashboard selector');

    // CSS and JS references
    assert.ok(html.includes('styles.css'), 'Should reference styles.css');
    assert.ok(html.includes('charts.js'), 'Should reference charts.js');
    assert.ok(html.includes('app.js'), 'Should reference app.js');

    // Meta tags
    assert.ok(html.includes('viewport'), 'Should have viewport meta');
  });

  it('styles.css exists and contains dark theme variables', () => {
    const css = fs.readFileSync(path.join(publicDir, 'css', 'styles.css'), 'utf-8');

    // Color variables
    assert.ok(css.includes('--bg-primary'), 'Should have bg-primary variable');
    assert.ok(css.includes('--accent-cyan'), 'Should have cyan accent');
    assert.ok(css.includes('--accent-magenta'), 'Should have magenta accent');
    assert.ok(css.includes('--accent-green'), 'Should have green accent');

    // Glassmorphism
    assert.ok(css.includes('backdrop-filter'), 'Should use backdrop-filter for glassmorphism');
    assert.ok(css.includes('blur'), 'Should use blur effect');

    // Animations
    assert.ok(css.includes('@keyframes'), 'Should have CSS animations');
    assert.ok(css.includes('pulseDot'), 'Should have pulseDot animation');
    assert.ok(css.includes('shimmer'), 'Should have shimmer animation for skeletons');

    // Typography
    assert.ok(css.includes('--font-mono'), 'Should have monospace font variable');
    assert.ok(css.includes('--font-sans'), 'Should have sans-serif font variable');

    // Responsive
    assert.ok(css.includes('@media'), 'Should have responsive media queries');
  });

  it('charts.js exists and exports chart functions', () => {
    const js = fs.readFileSync(path.join(publicDir, 'js', 'charts.js'), 'utf-8');

    assert.ok(js.includes('drawLineChart'), 'Should have drawLineChart');
    assert.ok(js.includes('drawSparkline'), 'Should have drawSparkline');
    assert.ok(js.includes('drawGauge'), 'Should have drawGauge');
    assert.ok(js.includes('drawHeatMap'), 'Should have drawHeatMap');
    assert.ok(js.includes('setupCanvas'), 'Should have setupCanvas for HiDPI');
    assert.ok(js.includes('devicePixelRatio'), 'Should handle device pixel ratio');
  });

  it('app.js exists and has polling, refresh, and range functions', () => {
    const js = fs.readFileSync(path.join(publicDir, 'js', 'app.js'), 'utf-8');

    assert.ok(js.includes('startPolling'), 'Should have startPolling');
    assert.ok(js.includes('refresh'), 'Should have refresh function');
    assert.ok(js.includes('setRange'), 'Should have setRange function');
    assert.ok(js.includes('showSkeletons'), 'Should have skeleton loading');
    assert.ok(js.includes('/api/metrics/live'), 'Should poll live metrics endpoint');
  });

  it('CSS has correct dark background color', () => {
    const css = fs.readFileSync(path.join(publicDir, 'css', 'styles.css'), 'utf-8');
    assert.ok(css.includes('#0a0a0f'), 'Should have dark background color');
  });

  it('CSS has glassmorphism card styles', () => {
    const css = fs.readFileSync(path.join(publicDir, 'css', 'styles.css'), 'utf-8');
    assert.ok(css.includes('.card'), 'Should have .card class');
    assert.ok(css.includes('var(--bg-card)'), 'Should use card background variable');
    assert.ok(css.includes('transition'), 'Should have transitions for hover effects');
  });

  it('Charts engine supports all required metric colors', () => {
    const js = fs.readFileSync(path.join(publicDir, 'js', 'charts.js'), 'utf-8');
    assert.ok(js.includes("cpu:"), 'Should map cpu to color');
    assert.ok(js.includes("memory:"), 'Should map memory to color');
    assert.ok(js.includes("requests_per_sec:"), 'Should map requests_per_sec to color');
    assert.ok(js.includes("error_rate:"), 'Should map error_rate to color');
    assert.ok(js.includes("response_time:"), 'Should map response_time to color');
  });
});
