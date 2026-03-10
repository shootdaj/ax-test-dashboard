'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../../src/app');

// Helper to make HTTP requests to the test server
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

describe('API Integration Tests', () => {
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

  describe('GET /health', () => {
    it('returns 200 with status info', async () => {
      const res = await request(server, 'GET', '/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'ok');
      assert.equal(typeof res.body.uptime, 'number');
      assert.equal(typeof res.body.timestamp, 'number');
      assert.equal(res.body.metrics, 5);
    });
  });

  describe('GET /api/metrics', () => {
    it('returns list of all 5 metric types', async () => {
      const res = await request(server, 'GET', '/api/metrics');
      assert.equal(res.status, 200);
      assert.equal(res.body.metrics.length, 5);
    });
  });

  describe('GET /api/metrics/live', () => {
    it('returns current values for all metrics', async () => {
      const res = await request(server, 'GET', '/api/metrics/live');
      assert.equal(res.status, 200);
      assert.ok(res.body.metrics.cpu, 'should have cpu');
      assert.ok(res.body.metrics.memory, 'should have memory');
      assert.ok(res.body.metrics.requests_per_sec, 'should have requests_per_sec');
      assert.ok(res.body.metrics.error_rate, 'should have error_rate');
      assert.ok(res.body.metrics.response_time, 'should have response_time');
      assert.equal(typeof res.body.timestamp, 'number');
    });
  });

  describe('GET /api/metrics/:name', () => {
    it('returns time-series data for cpu', async () => {
      const res = await request(server, 'GET', '/api/metrics/cpu?range=1h');
      assert.equal(res.status, 200);
      assert.equal(res.body.metric, 'cpu');
      assert.equal(res.body.range, '1h');
      assert.ok(Array.isArray(res.body.points));
      assert.ok(res.body.points.length > 0);
    });

    it('returns 404 for unknown metric', async () => {
      const res = await request(server, 'GET', '/api/metrics/nonexistent');
      assert.equal(res.status, 404);
    });

    it('returns 400 for invalid range', async () => {
      const res = await request(server, 'GET', '/api/metrics/cpu?range=invalid');
      assert.equal(res.status, 400);
    });

    it('returns aggregated data when aggregate=true', async () => {
      const res = await request(server, 'GET', '/api/metrics/cpu?range=1h&aggregate=true');
      assert.equal(res.status, 200);
      assert.equal(res.body.metric, 'cpu');
      assert.equal(typeof res.body.min, 'number');
      assert.equal(typeof res.body.max, 'number');
      assert.equal(typeof res.body.avg, 'number');
      assert.equal(typeof res.body.p50, 'number');
      assert.equal(typeof res.body.p95, 'number');
      assert.equal(typeof res.body.p99, 'number');
    });
  });

  describe('Alerts API', () => {
    it('GET /api/alerts returns rules and active alerts', async () => {
      const res = await request(server, 'GET', '/api/alerts');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.rules));
      assert.ok(Array.isArray(res.body.activeAlerts));
    });

    it('POST /api/alerts creates a new rule', async () => {
      const res = await request(server, 'POST', '/api/alerts', {
        metric: 'cpu',
        warnThreshold: 80,
        criticalThreshold: 95,
        operator: 'gt',
        name: 'Test Alert',
      });
      assert.equal(res.status, 201);
      assert.ok(res.body.id);
      assert.equal(res.body.name, 'Test Alert');
    });

    it('POST /api/alerts returns 400 for unknown metric', async () => {
      const res = await request(server, 'POST', '/api/alerts', {
        metric: 'fake',
        warnThreshold: 50,
      });
      assert.equal(res.status, 400);
    });

    it('GET /api/alerts/history returns alert history', async () => {
      const res = await request(server, 'GET', '/api/alerts/history');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.history));
      assert.equal(typeof res.body.count, 'number');
    });
  });

  describe('Dashboards API', () => {
    it('GET /api/dashboards returns list of dashboards', async () => {
      const res = await request(server, 'GET', '/api/dashboards');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.dashboards));
      assert.ok(res.body.dashboards.length >= 2, 'Should have seeded dashboards');
    });

    it('POST /api/dashboards creates a new dashboard', async () => {
      const res = await request(server, 'POST', '/api/dashboards', {
        name: 'Test Dashboard',
        panels: [{ metric: 'cpu', type: 'gauge' }],
      });
      assert.equal(res.status, 201);
      assert.ok(res.body.id);
      assert.equal(res.body.name, 'Test Dashboard');
    });

    it('POST /api/dashboards returns 400 without name', async () => {
      const res = await request(server, 'POST', '/api/dashboards', {});
      assert.equal(res.status, 400);
    });

    it('GET /api/dashboards/:id returns specific dashboard', async () => {
      const res = await request(server, 'GET', '/api/dashboards/1');
      assert.equal(res.status, 200);
      assert.equal(res.body.id, 1);
      assert.ok(res.body.name);
    });
  });
});
