'use strict';

const { Router } = require('express');
const metricsStore = require('../data/metrics');

const router = Router();

/**
 * GET /api/metrics/heatmap/:name
 * Get hourly distribution data for heat map visualization.
 * Returns a 7x24 grid (days x hours) with aggregated values.
 */
router.get('/api/metrics/heatmap/:name', (req, res) => {
  const { name } = req.params;

  if (!metricsStore.METRIC_DEFINITIONS[name]) {
    return res.status(404).json({ error: `Unknown metric: ${name}` });
  }

  const points = metricsStore.getTimeSeries(name, '7d');
  if (!points || points.length === 0) {
    return res.json({ metric: name, data: [] });
  }

  // Group points by day-of-week and hour
  const grid = Array.from({ length: 7 }, () => Array(24).fill(null));
  const counts = Array.from({ length: 7 }, () => Array(24).fill(0));

  for (const point of points) {
    const date = new Date(point.timestamp);
    const day = (date.getDay() + 6) % 7; // Monday=0, Sunday=6
    const hour = date.getHours();

    if (grid[day][hour] === null) {
      grid[day][hour] = 0;
    }
    grid[day][hour] += point.value;
    counts[day][hour]++;
  }

  // Average
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (counts[d][h] > 0) {
        grid[d][h] = Math.round((grid[d][h] / counts[d][h]) * 100) / 100;
      } else {
        grid[d][h] = 0;
      }
    }
  }

  res.json({ metric: name, data: grid });
});

module.exports = router;
