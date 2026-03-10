'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../../src/app');
const metricsStore = require('../../src/data/metrics');
const alertsStore = require('../../src/data/alerts');

function request(server, method, path) {
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
    req.end();
  });
}

describe('Heatmap API Integration', () => {
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

  it('GET /api/metrics/heatmap/requests_per_sec returns 7x24 grid', async () => {
    const res = await request(server, 'GET', '/api/metrics/heatmap/requests_per_sec');
    assert.equal(res.status, 200);
    assert.equal(res.body.metric, 'requests_per_sec');
    assert.ok(Array.isArray(res.body.data), 'Should return data array');
    assert.ok(res.body.data.length > 0, 'Should have rows');
    assert.equal(res.body.data[0].length, 24, 'Each row should have 24 hourly values');
  });

  it('GET /api/metrics/heatmap/cpu returns valid data', async () => {
    const res = await request(server, 'GET', '/api/metrics/heatmap/cpu');
    assert.equal(res.status, 200);
    assert.equal(res.body.metric, 'cpu');
    assert.ok(res.body.data.length > 0);
  });

  it('GET /api/metrics/heatmap/nonexistent returns 404', async () => {
    const res = await request(server, 'GET', '/api/metrics/heatmap/nonexistent');
    assert.equal(res.status, 404);
  });

  it('heatmap values are reasonable averages', async () => {
    const res = await request(server, 'GET', '/api/metrics/heatmap/cpu');
    for (const row of res.body.data) {
      for (const val of row) {
        assert.equal(typeof val, 'number', 'Values should be numbers');
        assert.ok(val >= 0, `Value ${val} should be >= 0`);
        assert.ok(val <= 100, `Value ${val} should be <= 100 for CPU`);
      }
    }
  });
});
