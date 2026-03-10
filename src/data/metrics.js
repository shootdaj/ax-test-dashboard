'use strict';

/**
 * In-memory metrics store with seed data generation and live simulation.
 *
 * Stores time-series data for 5 metric types:
 * - cpu: CPU utilization (0-100%)
 * - memory: Memory utilization (0-100%)
 * - requests_per_sec: Request throughput (0-5000)
 * - error_rate: Error percentage (0-10%)
 * - response_time: Response time in ms (10-2000)
 */

const METRIC_DEFINITIONS = {
  cpu: {
    name: 'cpu',
    label: 'CPU Usage',
    unit: '%',
    min: 0,
    max: 100,
    baseValue: 45,
    volatility: 15,
    trend: 0.002,
  },
  memory: {
    name: 'memory',
    label: 'Memory Usage',
    unit: '%',
    min: 0,
    max: 100,
    baseValue: 62,
    volatility: 8,
    trend: 0.001,
  },
  requests_per_sec: {
    name: 'requests_per_sec',
    label: 'Requests/sec',
    unit: 'req/s',
    min: 0,
    max: 5000,
    baseValue: 1200,
    volatility: 300,
    trend: 0.003,
  },
  error_rate: {
    name: 'error_rate',
    label: 'Error Rate',
    unit: '%',
    min: 0,
    max: 10,
    baseValue: 0.5,
    volatility: 0.3,
    trend: 0,
  },
  response_time: {
    name: 'response_time',
    label: 'Response Time',
    unit: 'ms',
    min: 10,
    max: 2000,
    baseValue: 120,
    volatility: 40,
    trend: 0.001,
  },
};

// Retention periods in milliseconds
const RETENTION_PERIODS = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

// Store: metricName -> array of { timestamp, value }
const store = new Map();

// Track simulation interval
let simulationInterval = null;

/**
 * Deterministic pseudo-random number generator (mulberry32)
 * Produces consistent seed data across cold starts.
 */
function seededRandom(seed) {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Generate a realistic metric value with smooth random walk behavior.
 */
function generateValue(def, prevValue, seed, hourOfDay) {
  const rand = seededRandom(seed);

  // Time-of-day pattern (busier during business hours)
  const hourFactor = Math.sin(((hourOfDay - 6) / 24) * Math.PI * 2) * 0.3 + 1;

  // Random walk from previous value
  const drift = (rand - 0.5) * def.volatility * 2;
  const meanReversion = (def.baseValue * hourFactor - prevValue) * 0.05;

  let value = prevValue + drift + meanReversion;

  // Clamp to bounds
  value = Math.max(def.min, Math.min(def.max, value));

  // Round appropriately
  if (def.unit === '%' && def.max <= 10) {
    return Math.round(value * 100) / 100; // 2 decimal places for error rate
  }
  return Math.round(value * 10) / 10; // 1 decimal place for others
}

/**
 * Seed historical data for all metrics.
 * Generates 24h of data at 5-second intervals (17,280 points per metric).
 */
function seedData() {
  const now = Date.now();
  const seedDuration = RETENTION_PERIODS['24h'];
  const interval = 5000; // 5 seconds
  const pointCount = Math.floor(seedDuration / interval);

  for (const [name, def] of Object.entries(METRIC_DEFINITIONS)) {
    const points = [];
    let prevValue = def.baseValue;
    let seed = name.length * 1000; // Deterministic seed per metric

    for (let i = 0; i < pointCount; i++) {
      const timestamp = now - seedDuration + i * interval;
      const hourOfDay = new Date(timestamp).getHours();
      seed += i;
      prevValue = generateValue(def, prevValue, seed, hourOfDay);
      points.push({ timestamp, value: prevValue });
    }

    store.set(name, points);
  }
}

/**
 * Add a new data point for each metric (called every 5 seconds).
 */
function addLiveDataPoint() {
  const now = Date.now();
  const hourOfDay = new Date(now).getHours();

  for (const [name, def] of Object.entries(METRIC_DEFINITIONS)) {
    const points = store.get(name) || [];
    const lastValue = points.length > 0 ? points[points.length - 1].value : def.baseValue;
    const seed = now + name.length;
    const value = generateValue(def, lastValue, seed, hourOfDay);

    points.push({ timestamp: now, value });

    // Enforce 7d max retention
    const cutoff = now - RETENTION_PERIODS['7d'];
    const firstValid = points.findIndex((p) => p.timestamp >= cutoff);
    if (firstValid > 0) {
      points.splice(0, firstValid);
    }

    store.set(name, points);
  }
}

/**
 * Start live data simulation (every 5 seconds).
 */
function startSimulation() {
  if (simulationInterval) return;
  simulationInterval = setInterval(addLiveDataPoint, 5000);
}

/**
 * Stop live data simulation.
 */
function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

/**
 * Get metric definitions (metadata).
 */
function getMetricDefinitions() {
  return Object.values(METRIC_DEFINITIONS).map((def) => ({
    name: def.name,
    label: def.label,
    unit: def.unit,
    min: def.min,
    max: def.max,
  }));
}

/**
 * Get latest value for all metrics.
 */
function getLatestValues() {
  const result = {};
  for (const [name, points] of store.entries()) {
    if (points.length > 0) {
      const last = points[points.length - 1];
      result[name] = {
        ...METRIC_DEFINITIONS[name],
        current: last.value,
        timestamp: last.timestamp,
      };
    }
  }
  return result;
}

/**
 * Get time-series data for a specific metric within a time range.
 */
function getTimeSeries(metricName, range = '1h') {
  const points = store.get(metricName);
  if (!points) return null;

  const duration = RETENTION_PERIODS[range] || RETENTION_PERIODS['1h'];
  const cutoff = Date.now() - duration;

  // Filter to range and downsample if needed
  const filtered = points.filter((p) => p.timestamp >= cutoff);

  // Downsample to max ~500 points for performance
  const maxPoints = 500;
  if (filtered.length > maxPoints) {
    const step = Math.ceil(filtered.length / maxPoints);
    const downsampled = [];
    for (let i = 0; i < filtered.length; i += step) {
      downsampled.push(filtered[i]);
    }
    // Always include the last point
    if (downsampled[downsampled.length - 1] !== filtered[filtered.length - 1]) {
      downsampled.push(filtered[filtered.length - 1]);
    }
    return downsampled;
  }

  return filtered;
}

/**
 * Compute aggregations for a metric over a time range.
 */
function getAggregations(metricName, range = '1h') {
  const points = getTimeSeries(metricName, range);
  if (!points || points.length === 0) return null;

  const values = points.map((p) => p.value).sort((a, b) => a - b);
  const n = values.length;

  const sum = values.reduce((s, v) => s + v, 0);

  const percentile = (p) => {
    const idx = Math.ceil((p / 100) * n) - 1;
    return values[Math.max(0, Math.min(idx, n - 1))];
  };

  return {
    metric: metricName,
    range,
    count: n,
    min: values[0],
    max: values[n - 1],
    avg: Math.round((sum / n) * 100) / 100,
    p50: percentile(50),
    p95: percentile(95),
    p99: percentile(99),
  };
}

/**
 * Initialize store — seed data and start simulation.
 */
function initialize() {
  seedData();
  startSimulation();
}

/**
 * Reset store (for testing).
 */
function reset() {
  stopSimulation();
  store.clear();
}

module.exports = {
  METRIC_DEFINITIONS,
  RETENTION_PERIODS,
  initialize,
  reset,
  seedData,
  addLiveDataPoint,
  startSimulation,
  stopSimulation,
  getMetricDefinitions,
  getLatestValues,
  getTimeSeries,
  getAggregations,
  _store: store,
};
