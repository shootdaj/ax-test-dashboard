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
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

describe('Frontend Serving Integration', () => {
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

  it('serves index.html at root', async () => {
    const res = await request(server, 'GET', '/');
    assert.equal(res.status, 200);
    assert.ok(res.body.includes('<!DOCTYPE html>'), 'Should serve HTML');
    assert.ok(res.body.includes('AX Dashboard'), 'Should contain dashboard title');
  });

  it('serves styles.css', async () => {
    const res = await request(server, 'GET', '/css/styles.css');
    assert.equal(res.status, 200);
    assert.ok(res.body.includes('--bg-primary'), 'Should contain CSS variables');
  });

  it('serves charts.js', async () => {
    const res = await request(server, 'GET', '/js/charts.js');
    assert.equal(res.status, 200);
    assert.ok(res.body.includes('Charts'), 'Should contain Charts module');
  });

  it('serves app.js', async () => {
    const res = await request(server, 'GET', '/js/app.js');
    assert.equal(res.status, 200);
    assert.ok(res.body.includes('App'), 'Should contain App module');
  });

  it('API endpoints still work alongside static files', async () => {
    const health = await request(server, 'GET', '/health');
    assert.equal(health.status, 200);
    const body = JSON.parse(health.body);
    assert.equal(body.status, 'ok');

    const metrics = await request(server, 'GET', '/api/metrics/live');
    assert.equal(metrics.status, 200);
    const metricsBody = JSON.parse(metrics.body);
    assert.ok(metricsBody.metrics.cpu, 'Should have CPU metric');
  });
});
