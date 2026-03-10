'use strict';

const { Router } = require('express');
const metricsStore = require('../data/metrics');

const router = Router();

/**
 * GET /api/metrics
 * List all available metrics with metadata.
 */
router.get('/api/metrics', (req, res) => {
  const definitions = metricsStore.getMetricDefinitions();
  res.json({ metrics: definitions });
});

/**
 * GET /api/metrics/live
 * Get latest values for all metrics.
 */
router.get('/api/metrics/live', (req, res) => {
  const latest = metricsStore.getLatestValues();
  res.json({ metrics: latest, timestamp: Date.now() });
});

/**
 * GET /api/metrics/:name
 * Get time-series data for a specific metric.
 * Query params:
 *   - range: '1h' | '6h' | '24h' | '7d' (default: '1h')
 *   - aggregate: 'true' to get aggregations instead of raw data
 */
router.get('/api/metrics/:name', (req, res) => {
  const { name } = req.params;
  const range = req.query.range || '1h';
  const aggregate = req.query.aggregate === 'true';

  // Validate metric name
  if (!metricsStore.METRIC_DEFINITIONS[name]) {
    return res.status(404).json({ error: `Unknown metric: ${name}` });
  }

  // Validate range
  if (!metricsStore.RETENTION_PERIODS[range]) {
    return res.status(400).json({
      error: `Invalid range: ${range}. Valid ranges: ${Object.keys(metricsStore.RETENTION_PERIODS).join(', ')}`,
    });
  }

  if (aggregate) {
    const aggregations = metricsStore.getAggregations(name, range);
    return res.json(aggregations);
  }

  const timeSeries = metricsStore.getTimeSeries(name, range);
  const def = metricsStore.METRIC_DEFINITIONS[name];

  res.json({
    metric: name,
    label: def.label,
    unit: def.unit,
    range,
    points: timeSeries,
    count: timeSeries.length,
  });
});

module.exports = router;
