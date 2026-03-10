'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Phase 3 Visualizations & Alerts UI', () => {
  const publicDir = path.join(__dirname, '..', '..', 'public');

  it('index.html contains gauge and heatmap sections', () => {
    const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');
    assert.ok(html.includes('gauges-grid'), 'Should have gauges grid');
    assert.ok(html.includes('heatmap-card'), 'Should have heatmap card');
    assert.ok(html.includes('alerts-panel'), 'Should have alerts panel');
    assert.ok(html.includes('alerts-list'), 'Should have alerts list');
  });

  it('CSS has gauge and alert panel styles', () => {
    const css = fs.readFileSync(path.join(publicDir, 'css', 'styles.css'), 'utf-8');
    assert.ok(css.includes('.gauges-grid'), 'Should have gauges grid CSS');
    assert.ok(css.includes('.gauge-card'), 'Should have gauge card CSS');
    assert.ok(css.includes('.alerts-panel'), 'Should have alerts panel CSS');
    assert.ok(css.includes('.alert-item'), 'Should have alert item CSS');
    assert.ok(css.includes('.alert-item__dot'), 'Should have alert dot CSS');
    assert.ok(css.includes('.alert-item__dot--ok'), 'Should have OK status dot');
    assert.ok(css.includes('.alert-item__dot--warn'), 'Should have warn status dot');
    assert.ok(css.includes('.alert-item__dot--critical'), 'Should have critical status dot');
    assert.ok(css.includes('.bottom-grid'), 'Should have bottom grid CSS');
  });

  it('CSS has alert level badge styles', () => {
    const css = fs.readFileSync(path.join(publicDir, 'css', 'styles.css'), 'utf-8');
    assert.ok(css.includes('.alert-item__level--ok'), 'Should have OK badge');
    assert.ok(css.includes('.alert-item__level--warn'), 'Should have warn badge');
    assert.ok(css.includes('.alert-item__level--critical'), 'Should have critical badge');
  });

  it('app.js has gauge and heatmap rendering functions', () => {
    const js = fs.readFileSync(path.join(publicDir, 'js', 'app.js'), 'utf-8');
    assert.ok(js.includes('renderGauges'), 'Should have renderGauges function');
    assert.ok(js.includes('renderHeatMap'), 'Should have renderHeatMap function');
    assert.ok(js.includes('/api/metrics/heatmap/'), 'Should fetch heatmap data');
    assert.ok(js.includes('/api/alerts/active'), 'Should fetch active alerts');
  });

  it('heatmap route module exists', () => {
    const routePath = path.join(__dirname, '..', '..', 'src', 'routes', 'heatmap.js');
    assert.ok(fs.existsSync(routePath), 'heatmap.js route should exist');
    const code = fs.readFileSync(routePath, 'utf-8');
    assert.ok(code.includes('/api/metrics/heatmap/:name'), 'Should have heatmap endpoint');
  });
});
