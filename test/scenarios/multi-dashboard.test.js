'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../../src/app');
const metricsStore = require('../../src/data/metrics');
const alertsStore = require('../../src/data/alerts');

function request(server, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: addr.port,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('Multi-Dashboard Scenario', () => {
  let server;

  before(() => {
    return new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', resolve);
    });
  });

  after(() => {
    metricsStore.stopSimulation();
    alertsStore.stopEvaluation();
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  it('Scenario: Create, switch, and manage multiple dashboards', async () => {
    // Step 1: List default dashboards
    const initial = await request(server, 'GET', '/api/dashboards');
    assert.equal(initial.status, 200);
    const defaultCount = initial.body.dashboards.length;
    assert.ok(defaultCount >= 2, 'Should have at least 2 default dashboards');

    // Step 2: Create a custom "DevOps" dashboard
    const devops = await request(server, 'POST', '/api/dashboards', {
      name: 'DevOps Overview',
      panels: [
        { metric: 'cpu', type: 'gauge', position: { row: 0, col: 0, width: 1, height: 1 } },
        { metric: 'memory', type: 'gauge', position: { row: 0, col: 1, width: 1, height: 1 } },
        { metric: 'error_rate', type: 'line', position: { row: 1, col: 0, width: 2, height: 1 } },
      ],
      layout: 'custom',
    });
    assert.equal(devops.status, 201);
    const devopsId = devops.body.id;

    // Step 3: Create a "Performance" focused dashboard
    const perf = await request(server, 'POST', '/api/dashboards', {
      name: 'Performance Deep-Dive',
      panels: [
        { metric: 'response_time', type: 'line', position: { row: 0, col: 0, width: 2, height: 1 } },
        { metric: 'requests_per_sec', type: 'line', position: { row: 1, col: 0, width: 2, height: 1 } },
      ],
    });
    assert.equal(perf.status, 201);
    const perfId = perf.body.id;

    // Step 4: Switch between dashboards (load each)
    const loadDevops = await request(server, 'GET', `/api/dashboards/${devopsId}`);
    assert.equal(loadDevops.status, 200);
    assert.equal(loadDevops.body.name, 'DevOps Overview');
    assert.equal(loadDevops.body.panels.length, 3);

    const loadPerf = await request(server, 'GET', `/api/dashboards/${perfId}`);
    assert.equal(loadPerf.status, 200);
    assert.equal(loadPerf.body.name, 'Performance Deep-Dive');
    assert.equal(loadPerf.body.panels.length, 2);

    // Step 5: Update the DevOps dashboard (add a panel)
    const updated = await request(server, 'PUT', `/api/dashboards/${devopsId}`, {
      panels: [
        ...loadDevops.body.panels,
        { metric: 'requests_per_sec', type: 'sparkline', position: { row: 2, col: 0, width: 1, height: 1 } },
      ],
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.panels.length, 4);

    // Step 6: Verify all dashboards appear in list
    const allDashboards = await request(server, 'GET', '/api/dashboards');
    assert.equal(allDashboards.body.dashboards.length, defaultCount + 2);

    // Step 7: Load a default dashboard
    const defaultDash = await request(server, 'GET', '/api/dashboards/1');
    assert.equal(defaultDash.status, 200);
    assert.ok(defaultDash.body.panels.length > 0, 'Default dashboard should have panels');

    // Step 8: Delete custom dashboards
    await request(server, 'DELETE', `/api/dashboards/${devopsId}`);
    await request(server, 'DELETE', `/api/dashboards/${perfId}`);

    const afterDelete = await request(server, 'GET', '/api/dashboards');
    assert.equal(afterDelete.body.dashboards.length, defaultCount);
  });

  it('Scenario: Dashboard with all metric types for full coverage', async () => {
    // Create a dashboard that includes every metric type
    const allMetrics = await request(server, 'POST', '/api/dashboards', {
      name: 'All Metrics',
      panels: [
        { metric: 'cpu', type: 'gauge' },
        { metric: 'memory', type: 'gauge' },
        { metric: 'requests_per_sec', type: 'line' },
        { metric: 'error_rate', type: 'line' },
        { metric: 'response_time', type: 'line' },
      ],
    });
    assert.equal(allMetrics.status, 201);
    assert.equal(allMetrics.body.panels.length, 5);

    // Verify each metric has live data
    const live = await request(server, 'GET', '/api/metrics/live');
    const metricNames = ['cpu', 'memory', 'requests_per_sec', 'error_rate', 'response_time'];
    for (const name of metricNames) {
      assert.ok(live.body.metrics[name], `Should have live data for ${name}`);
      assert.equal(typeof live.body.metrics[name].current, 'number');
    }

    // Clean up
    await request(server, 'DELETE', `/api/dashboards/${allMetrics.body.id}`);
  });
});
