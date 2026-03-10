'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../../src/app');

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

describe('Dashboard Workflow Scenarios', () => {
  let server;

  before(() => {
    return new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', resolve);
    });
  });

  after(() => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  it('Scenario: Full monitoring workflow — check health, view metrics, check alerts', async () => {
    // Step 1: Verify system is healthy
    const health = await request(server, 'GET', '/health');
    assert.equal(health.status, 200);
    assert.equal(health.body.status, 'ok');

    // Step 2: List available metrics
    const metricsList = await request(server, 'GET', '/api/metrics');
    assert.equal(metricsList.status, 200);
    assert.equal(metricsList.body.metrics.length, 5);

    // Step 3: Get live values
    const live = await request(server, 'GET', '/api/metrics/live');
    assert.equal(live.status, 200);
    const cpuValue = live.body.metrics.cpu.current;
    assert.equal(typeof cpuValue, 'number');

    // Step 4: Get historical data for each metric
    for (const metric of metricsList.body.metrics) {
      const history = await request(server, 'GET', `/api/metrics/${metric.name}?range=1h`);
      assert.equal(history.status, 200);
      assert.ok(history.body.points.length > 0, `${metric.name} should have historical data`);
    }

    // Step 5: Get aggregations
    const agg = await request(server, 'GET', '/api/metrics/cpu?range=1h&aggregate=true');
    assert.equal(agg.status, 200);
    assert.ok(agg.body.min <= agg.body.max);

    // Step 6: Check alerts
    const alerts = await request(server, 'GET', '/api/alerts');
    assert.equal(alerts.status, 200);
    assert.ok(alerts.body.rules.length >= 4, 'Should have default alert rules');
  });

  it('Scenario: Create and manage custom dashboard', async () => {
    // Step 1: List existing dashboards
    const initial = await request(server, 'GET', '/api/dashboards');
    assert.equal(initial.status, 200);
    const initialCount = initial.body.dashboards.length;

    // Step 2: Create a new dashboard
    const created = await request(server, 'POST', '/api/dashboards', {
      name: 'My Custom Dashboard',
      panels: [
        { metric: 'cpu', type: 'gauge' },
        { metric: 'response_time', type: 'line' },
      ],
    });
    assert.equal(created.status, 201);
    const dashId = created.body.id;

    // Step 3: Verify it appears in list
    const afterCreate = await request(server, 'GET', '/api/dashboards');
    assert.equal(afterCreate.body.dashboards.length, initialCount + 1);

    // Step 4: Load the dashboard
    const loaded = await request(server, 'GET', `/api/dashboards/${dashId}`);
    assert.equal(loaded.status, 200);
    assert.equal(loaded.body.name, 'My Custom Dashboard');
    assert.equal(loaded.body.panels.length, 2);

    // Step 5: Update the dashboard
    const updated = await request(server, 'PUT', `/api/dashboards/${dashId}`, {
      name: 'Updated Dashboard',
      panels: [{ metric: 'memory', type: 'gauge' }],
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.name, 'Updated Dashboard');
    assert.equal(updated.body.panels.length, 1);

    // Step 6: Delete the dashboard
    const deleted = await request(server, 'DELETE', `/api/dashboards/${dashId}`);
    assert.equal(deleted.status, 200);
    assert.equal(deleted.body.deleted, true);

    // Step 7: Verify it's gone
    const afterDelete = await request(server, 'GET', `/api/dashboards/${dashId}`);
    assert.equal(afterDelete.status, 404);
  });

  it('Scenario: Alert rule lifecycle — create, trigger, check history', async () => {
    // Step 1: Create an alert that will trigger (threshold of 0 for cpu)
    const created = await request(server, 'POST', '/api/alerts', {
      metric: 'cpu',
      warnThreshold: 0,
      criticalThreshold: null,
      operator: 'gt',
      name: 'Scenario Test Alert',
    });
    assert.equal(created.status, 201);
    const ruleId = created.body.id;

    // Step 2: Check alerts list includes our rule
    const alertsList = await request(server, 'GET', '/api/alerts');
    const ourRule = alertsList.body.rules.find((r) => r.id === ruleId);
    assert.ok(ourRule, 'Our rule should be in the list');

    // Step 3: Check alert history endpoint works
    const history = await request(server, 'GET', '/api/alerts/history');
    assert.equal(history.status, 200);
    assert.ok(Array.isArray(history.body.history));

    // Step 4: Clean up - delete the rule
    const deleted = await request(server, 'DELETE', `/api/alerts/${ruleId}`);
    assert.equal(deleted.status, 200);
  });

  it('Scenario: Time range switching', async () => {
    const ranges = ['1h', '6h', '24h'];

    for (const range of ranges) {
      const res = await request(server, 'GET', `/api/metrics/cpu?range=${range}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.range, range);
      assert.ok(res.body.points.length > 0, `Range ${range} should have data`);
    }
  });
});
