'use strict';

const express = require('express');
const path = require('path');

const metricsStore = require('./data/metrics');
const alertsStore = require('./data/alerts');
const dashboardsStore = require('./data/dashboards');

const metricsRoutes = require('./routes/metrics');
const alertsRoutes = require('./routes/alerts');
const dashboardsRoutes = require('./routes/dashboards');

const app = express();

// Middleware
app.use(express.json());

// CORS headers for API access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    metrics: Object.keys(metricsStore.METRIC_DEFINITIONS).length,
  });
});

// API routes
app.use(metricsRoutes);
app.use(alertsRoutes);
app.use(dashboardsRoutes);

// Serve static files from public/
app.use(express.static(path.join(__dirname, '..', 'public')));

// Catch-all: serve index.html for SPA
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Initialize data stores
metricsStore.initialize();
alertsStore.initialize();
dashboardsStore.initialize();

// Start server if run directly (not imported by Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Dashboard API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
