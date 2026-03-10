/**
 * Dashboard App — Main controller.
 * Handles polling, DOM updates, and chart rendering.
 */

const App = (() => {
  'use strict';

  let currentRange = '1h';
  let pollingInterval = null;
  let isLoading = true;

  // API base (works on both local and Vercel)
  const API = '';

  /**
   * Fetch JSON from API.
   */
  async function fetchJSON(path) {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  /**
   * Format a number for display.
   */
  function formatValue(value, unit) {
    if (unit === '%' && value < 10) return value.toFixed(2);
    if (unit === 'ms') return Math.round(value).toLocaleString();
    if (unit === 'req/s') return Math.round(value).toLocaleString();
    return value.toFixed(1);
  }

  /**
   * Determine status level for a metric value.
   */
  function getStatus(metricName, value) {
    const thresholds = {
      cpu: { warn: 75, critical: 90 },
      memory: { warn: 80, critical: 95 },
      error_rate: { warn: 2, critical: 5 },
      response_time: { warn: 500, critical: 1000 },
      requests_per_sec: { warn: 0, critical: 0 }, // always ok
    };
    const t = thresholds[metricName];
    if (!t) return 'ok';
    if (t.critical > 0 && value >= t.critical) return 'critical';
    if (t.warn > 0 && value >= t.warn) return 'warn';
    return 'ok';
  }

  /**
   * Show loading skeletons.
   */
  function showSkeletons() {
    const metricsGrid = document.getElementById('metrics-grid');
    const chartsGrid = document.getElementById('charts-grid');

    const metricNames = ['cpu', 'memory', 'requests_per_sec', 'error_rate', 'response_time'];

    metricsGrid.innerHTML = metricNames.map(name => `
      <div class="card metric-card skeleton" data-metric="${name}">
        <div class="metric-card__header">
          <span class="skeleton-text skeleton-text--short"></span>
          <span class="metric-card__status"></span>
        </div>
        <div class="skeleton-text skeleton-text--large"></div>
        <div class="metric-card__sparkline"><div class="skeleton-chart" style="height: 40px;"></div></div>
      </div>
    `).join('');

    chartsGrid.innerHTML = `
      <div class="card chart-card skeleton">
        <div class="chart-card__header"><span class="skeleton-text skeleton-text--medium"></span></div>
        <div class="skeleton-chart"></div>
      </div>
      <div class="card chart-card skeleton">
        <div class="chart-card__header"><span class="skeleton-text skeleton-text--medium"></span></div>
        <div class="skeleton-chart"></div>
      </div>
    `;
  }

  /**
   * Build the metric cards DOM.
   */
  function buildMetricCards(metrics) {
    const grid = document.getElementById('metrics-grid');
    const metricNames = ['cpu', 'memory', 'requests_per_sec', 'error_rate', 'response_time'];

    grid.innerHTML = metricNames.map(name => {
      const m = metrics[name];
      if (!m) return '';
      const status = getStatus(name, m.current);
      return `
        <div class="card metric-card" data-metric="${name}">
          <div class="metric-card__header">
            <span class="metric-card__label">${m.label}</span>
            <span class="metric-card__status metric-card__status--${status}"></span>
          </div>
          <div class="metric-card__value">
            ${formatValue(m.current, m.unit)}<span class="metric-card__unit">${m.unit}</span>
          </div>
          <div class="metric-card__sparkline">
            <canvas id="sparkline-${name}"></canvas>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Build the chart panels DOM.
   */
  function buildChartPanels() {
    const grid = document.getElementById('charts-grid');
    const charts = [
      { metric: 'cpu', title: 'CPU Usage', subtitle: 'Over time' },
      { metric: 'memory', title: 'Memory Usage', subtitle: 'Over time' },
      { metric: 'requests_per_sec', title: 'Requests per Second', subtitle: 'Throughput' },
      { metric: 'response_time', title: 'Response Time', subtitle: 'Latency (ms)' },
      { metric: 'error_rate', title: 'Error Rate', subtitle: 'Percentage' },
    ];

    grid.innerHTML = charts.map(c => `
      <div class="card chart-card" data-chart="${c.metric}">
        <div class="chart-card__header">
          <div>
            <div class="chart-card__title">${c.title}</div>
            <div class="chart-card__subtitle">${c.subtitle}</div>
          </div>
        </div>
        <div class="chart-card__canvas-wrap">
          <canvas id="chart-${c.metric}"></canvas>
        </div>
      </div>
    `).join('');
  }

  /**
   * Update metric card values (without rebuilding DOM).
   */
  function updateMetricValues(metrics) {
    for (const [name, m] of Object.entries(metrics)) {
      const card = document.querySelector(`.metric-card[data-metric="${name}"]`);
      if (!card) continue;

      const valueEl = card.querySelector('.metric-card__value');
      if (valueEl) {
        valueEl.innerHTML = `${formatValue(m.current, m.unit)}<span class="metric-card__unit">${m.unit}</span>`;
      }

      const statusEl = card.querySelector('.metric-card__status');
      if (statusEl) {
        const status = getStatus(name, m.current);
        statusEl.className = `metric-card__status metric-card__status--${status}`;
      }
    }
  }

  /**
   * Fetch and render sparklines for all metrics.
   */
  async function renderSparklines() {
    const metrics = ['cpu', 'memory', 'requests_per_sec', 'error_rate', 'response_time'];
    const promises = metrics.map(async name => {
      try {
        const data = await fetchJSON(`/api/metrics/${name}?range=${currentRange}`);
        const canvas = document.getElementById(`sparkline-${name}`);
        if (canvas && data.points) {
          // Use last 60 points for sparkline
          const pts = data.points.slice(-60);
          Charts.drawSparkline(canvas, pts, name);
        }
      } catch (e) {
        console.warn(`Sparkline error for ${name}:`, e);
      }
    });
    await Promise.all(promises);
  }

  /**
   * Fetch and render line charts.
   */
  async function renderCharts() {
    const metrics = ['cpu', 'memory', 'requests_per_sec', 'response_time', 'error_rate'];
    const promises = metrics.map(async name => {
      try {
        const data = await fetchJSON(`/api/metrics/${name}?range=${currentRange}`);
        const canvas = document.getElementById(`chart-${name}`);
        if (canvas && data.points) {
          Charts.drawLineChart(canvas, data.points, name);
        }
      } catch (e) {
        console.warn(`Chart error for ${name}:`, e);
      }
    });
    await Promise.all(promises);
  }

  /**
   * Update alert banner.
   */
  async function updateAlerts() {
    try {
      const data = await fetchJSON('/api/alerts/active');
      const banner = document.getElementById('alert-banner');
      const text = document.getElementById('alert-banner-text');

      if (data.alerts && data.alerts.length > 0) {
        banner.classList.add('alert-banner--active');
        const alerts = data.alerts.map(a =>
          `${a.ruleName}: ${a.metric} is ${a.value} (${a.level})`
        ).join(' | ');
        text.textContent = alerts;
      } else {
        banner.classList.remove('alert-banner--active');
      }
    } catch (e) {
      console.warn('Alert check error:', e);
    }
  }

  /**
   * Full data refresh cycle.
   */
  async function refresh() {
    try {
      // Fetch live values
      const liveData = await fetchJSON('/api/metrics/live');

      if (isLoading) {
        // First load — build DOM
        buildMetricCards(liveData.metrics);
        buildChartPanels();
        isLoading = false;
      } else {
        // Subsequent loads — update values
        updateMetricValues(liveData.metrics);
      }

      // Render charts and sparklines in parallel
      await Promise.all([
        renderSparklines(),
        renderCharts(),
        updateAlerts(),
      ]);

      // Update timestamp
      const tsEl = document.getElementById('last-updated');
      if (tsEl) {
        const now = new Date();
        tsEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
      }

      const statusEl = document.getElementById('connection-status');
      if (statusEl) {
        statusEl.textContent = 'Live';
        statusEl.style.color = '#00ff88';
      }
    } catch (e) {
      console.error('Refresh error:', e);
      const statusEl = document.getElementById('connection-status');
      if (statusEl) {
        statusEl.textContent = 'Disconnected';
        statusEl.style.color = '#ff3344';
      }
    }
  }

  /**
   * Set the time range and refresh.
   */
  function setRange(range) {
    currentRange = range;

    // Update active button
    document.querySelectorAll('.time-range__btn').forEach(btn => {
      btn.classList.toggle('time-range__btn--active', btn.dataset.range === range);
    });

    refresh();
  }

  /**
   * Start polling.
   */
  function startPolling(intervalMs = 3000) {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(refresh, intervalMs);
  }

  /**
   * Stop polling.
   */
  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  /**
   * Handle window resize — redraw charts.
   */
  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (!isLoading) {
        renderSparklines();
        renderCharts();
      }
    }, 200);
  }

  /**
   * Initialize the dashboard.
   */
  function init() {
    showSkeletons();

    // Bind time range buttons
    document.querySelectorAll('.time-range__btn').forEach(btn => {
      btn.addEventListener('click', () => setRange(btn.dataset.range));
    });

    // Handle resize
    window.addEventListener('resize', handleResize);

    // Initial load
    refresh().then(() => {
      startPolling(3000);
    });
  }

  return { init, refresh, setRange, startPolling, stopPolling };
})();

// Boot
document.addEventListener('DOMContentLoaded', App.init);
