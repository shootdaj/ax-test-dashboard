'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Dashboard Management UI', () => {
  const publicDir = path.join(__dirname, '..', '..', 'public');

  it('app.js has dashboard switching functionality', () => {
    const js = fs.readFileSync(path.join(publicDir, 'js', 'app.js'), 'utf-8');
    assert.ok(js.includes('switchDashboard'), 'Should have switchDashboard function');
    assert.ok(js.includes('loadDashboardList'), 'Should have loadDashboardList function');
    assert.ok(js.includes('/api/dashboards'), 'Should fetch dashboards from API');
    assert.ok(js.includes('dashboard-select'), 'Should reference dashboard select element');
  });

  it('index.html has dashboard selector', () => {
    const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');
    assert.ok(html.includes('dashboard-select'), 'Should have dashboard select');
  });

  it('CSS has responsive styles for all breakpoints', () => {
    const css = fs.readFileSync(path.join(publicDir, 'css', 'styles.css'), 'utf-8');
    assert.ok(css.includes('1200px'), 'Should have 1200px breakpoint');
    assert.ok(css.includes('768px'), 'Should have 768px breakpoint');
    assert.ok(css.includes('480px'), 'Should have 480px breakpoint');
  });

  it('app.js handles dashboard select change event', () => {
    const js = fs.readFileSync(path.join(publicDir, 'js', 'app.js'), 'utf-8');
    assert.ok(js.includes('addEventListener'), 'Should bind event listener');
    assert.ok(js.includes('change'), 'Should listen for change events on select');
  });
});
