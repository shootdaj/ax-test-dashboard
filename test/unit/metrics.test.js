'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const metrics = require('../../src/data/metrics');

describe('MetricsStore', () => {
  beforeEach(() => {
    metrics.reset();
  });

  afterEach(() => {
    metrics.reset();
  });

  describe('getMetricDefinitions', () => {
    it('returns all 5 metric types', () => {
      const defs = metrics.getMetricDefinitions();
      assert.equal(defs.length, 5);
      const names = defs.map((d) => d.name);
      assert.ok(names.includes('cpu'));
      assert.ok(names.includes('memory'));
      assert.ok(names.includes('requests_per_sec'));
      assert.ok(names.includes('error_rate'));
      assert.ok(names.includes('response_time'));
    });

    it('each definition has name, label, unit, min, max', () => {
      const defs = metrics.getMetricDefinitions();
      for (const def of defs) {
        assert.ok(def.name, 'should have name');
        assert.ok(def.label, 'should have label');
        assert.ok(def.unit, 'should have unit');
        assert.equal(typeof def.min, 'number', 'min should be number');
        assert.equal(typeof def.max, 'number', 'max should be number');
      }
    });
  });

  describe('seedData', () => {
    it('populates data for all metrics', () => {
      metrics.seedData();
      const latest = metrics.getLatestValues();
      const metricNames = Object.keys(latest);
      assert.equal(metricNames.length, 5);
    });

    it('generates reasonable value count for 24h of data', () => {
      metrics.seedData();
      const series = metrics.getTimeSeries('cpu', '24h');
      // 24h at 5s intervals = 17,280 points, downsampled to ~500
      assert.ok(series.length > 100, `Expected many points, got ${series.length}`);
    });

    it('values stay within defined bounds', () => {
      metrics.seedData();
      const series = metrics.getTimeSeries('cpu', '24h');
      for (const point of series) {
        assert.ok(point.value >= 0, `CPU value ${point.value} below 0`);
        assert.ok(point.value <= 100, `CPU value ${point.value} above 100`);
      }
    });
  });

  describe('addLiveDataPoint', () => {
    it('adds a new data point to each metric', () => {
      metrics.seedData();
      const beforeCpu = metrics.getTimeSeries('cpu', '1h');
      const beforeLen = beforeCpu.length;

      metrics.addLiveDataPoint();

      const afterCpu = metrics.getTimeSeries('cpu', '1h');
      assert.ok(afterCpu.length >= beforeLen, 'Should have more or equal points');
    });
  });

  describe('getLatestValues', () => {
    it('returns current value for each metric', () => {
      metrics.seedData();
      const latest = metrics.getLatestValues();

      for (const [name, data] of Object.entries(latest)) {
        assert.equal(typeof data.current, 'number', `${name} current should be number`);
        assert.equal(typeof data.timestamp, 'number', `${name} timestamp should be number`);
      }
    });
  });

  describe('getTimeSeries', () => {
    it('returns null for unknown metric', () => {
      metrics.seedData();
      const series = metrics.getTimeSeries('nonexistent', '1h');
      assert.equal(series, null);
    });

    it('returns fewer points for shorter ranges', () => {
      metrics.seedData();
      const oneHour = metrics.getTimeSeries('cpu', '1h');
      const twentyFourHour = metrics.getTimeSeries('cpu', '24h');
      assert.ok(oneHour.length <= twentyFourHour.length, '1h should have fewer or equal points to 24h');
    });

    it('all points have timestamp and value', () => {
      metrics.seedData();
      const series = metrics.getTimeSeries('memory', '1h');
      for (const point of series) {
        assert.equal(typeof point.timestamp, 'number');
        assert.equal(typeof point.value, 'number');
      }
    });
  });

  describe('getAggregations', () => {
    it('returns min, max, avg, p50, p95, p99', () => {
      metrics.seedData();
      const agg = metrics.getAggregations('cpu', '1h');

      assert.ok(agg, 'should return aggregations');
      assert.equal(agg.metric, 'cpu');
      assert.equal(agg.range, '1h');
      assert.equal(typeof agg.min, 'number');
      assert.equal(typeof agg.max, 'number');
      assert.equal(typeof agg.avg, 'number');
      assert.equal(typeof agg.p50, 'number');
      assert.equal(typeof agg.p95, 'number');
      assert.equal(typeof agg.p99, 'number');
    });

    it('min <= p50 <= p95 <= p99 <= max', () => {
      metrics.seedData();
      const agg = metrics.getAggregations('cpu', '1h');

      assert.ok(agg.min <= agg.p50, `min ${agg.min} should be <= p50 ${agg.p50}`);
      assert.ok(agg.p50 <= agg.p95, `p50 ${agg.p50} should be <= p95 ${agg.p95}`);
      assert.ok(agg.p95 <= agg.p99, `p95 ${agg.p95} should be <= p99 ${agg.p99}`);
      assert.ok(agg.p99 <= agg.max, `p99 ${agg.p99} should be <= max ${agg.max}`);
    });

    it('returns null for unknown metric', () => {
      metrics.seedData();
      const agg = metrics.getAggregations('nonexistent', '1h');
      assert.equal(agg, null);
    });
  });
});
