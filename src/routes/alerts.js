'use strict';

const { Router } = require('express');
const alertsStore = require('../data/alerts');

const router = Router();

/**
 * GET /api/alerts
 * List all alert rules.
 */
router.get('/api/alerts', (req, res) => {
  const rules = alertsStore.getRules();
  const active = alertsStore.getActiveAlerts();
  res.json({ rules, activeAlerts: active });
});

/**
 * POST /api/alerts
 * Create a new alert rule.
 * Body: { metric, warnThreshold, criticalThreshold, operator, name }
 */
router.post('/api/alerts', (req, res) => {
  try {
    const rule = alertsStore.createRule(req.body);
    res.status(201).json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/alerts/:id
 * Delete an alert rule.
 */
router.delete('/api/alerts/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  alertsStore.deleteRule(id);
  res.json({ deleted: true });
});

/**
 * GET /api/alerts/active
 * Get currently active (firing) alerts.
 */
router.get('/api/alerts/active', (req, res) => {
  const active = alertsStore.getActiveAlerts();
  res.json({ alerts: active, count: active.length });
});

/**
 * GET /api/alerts/history
 * Get alert history (most recent first).
 */
router.get('/api/alerts/history', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const alertHistory = alertsStore.getHistory(limit);
  res.json({ history: alertHistory, count: alertHistory.length });
});

module.exports = router;
