'use strict';

const { Router } = require('express');
const dashboardsStore = require('../data/dashboards');

const router = Router();

/**
 * GET /api/dashboards
 * List all dashboards.
 */
router.get('/api/dashboards', (req, res) => {
  const dashboards = dashboardsStore.list();
  res.json({ dashboards });
});

/**
 * GET /api/dashboards/:id
 * Get a specific dashboard configuration.
 */
router.get('/api/dashboards/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const dashboard = dashboardsStore.getById(id);
  if (!dashboard) {
    return res.status(404).json({ error: 'Dashboard not found' });
  }
  res.json(dashboard);
});

/**
 * POST /api/dashboards
 * Create a new dashboard.
 * Body: { name, panels?, layout? }
 */
router.post('/api/dashboards', (req, res) => {
  const { name, panels, layout } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Dashboard name is required' });
  }
  const dashboard = dashboardsStore.create({ name, panels, layout });
  res.status(201).json(dashboard);
});

/**
 * PUT /api/dashboards/:id
 * Update a dashboard configuration.
 * Body: { name?, panels?, layout? }
 */
router.put('/api/dashboards/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const updated = dashboardsStore.update(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Dashboard not found' });
  }
  res.json(updated);
});

/**
 * DELETE /api/dashboards/:id
 * Delete a dashboard.
 */
router.delete('/api/dashboards/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const deleted = dashboardsStore.remove(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Dashboard not found' });
  }
  res.json({ deleted: true });
});

module.exports = router;
