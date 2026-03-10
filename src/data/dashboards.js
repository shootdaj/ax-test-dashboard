'use strict';

/**
 * Dashboard configurations store.
 * Supports creating, saving, loading, and listing dashboard layouts.
 */

// Store: id -> dashboard config
const store = new Map();
let nextId = 1;

/**
 * Create a new dashboard configuration.
 */
function create({ name, panels = [], layout = 'default' }) {
  const dashboard = {
    id: nextId++,
    name,
    panels,
    layout,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  store.set(dashboard.id, dashboard);
  return dashboard;
}

/**
 * Get a dashboard by ID.
 */
function getById(id) {
  return store.get(id) || null;
}

/**
 * List all dashboards.
 */
function list() {
  return Array.from(store.values()).map((d) => ({
    id: d.id,
    name: d.name,
    panelCount: d.panels.length,
    layout: d.layout,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
}

/**
 * Update a dashboard configuration.
 */
function update(id, updates) {
  const dashboard = store.get(id);
  if (!dashboard) return null;

  if (updates.name !== undefined) dashboard.name = updates.name;
  if (updates.panels !== undefined) dashboard.panels = updates.panels;
  if (updates.layout !== undefined) dashboard.layout = updates.layout;
  dashboard.updatedAt = Date.now();

  return dashboard;
}

/**
 * Delete a dashboard.
 */
function remove(id) {
  return store.delete(id);
}

/**
 * Seed a default dashboard configuration.
 */
function seedDefaults() {
  create({
    name: 'System Overview',
    layout: 'default',
    panels: [
      { metric: 'cpu', type: 'gauge', position: { row: 0, col: 0, width: 1, height: 1 } },
      { metric: 'memory', type: 'gauge', position: { row: 0, col: 1, width: 1, height: 1 } },
      { metric: 'requests_per_sec', type: 'line', position: { row: 1, col: 0, width: 2, height: 1 } },
      { metric: 'error_rate', type: 'line', position: { row: 2, col: 0, width: 1, height: 1 } },
      { metric: 'response_time', type: 'line', position: { row: 2, col: 1, width: 1, height: 1 } },
    ],
  });

  create({
    name: 'Performance',
    layout: 'default',
    panels: [
      { metric: 'response_time', type: 'line', position: { row: 0, col: 0, width: 2, height: 1 } },
      { metric: 'requests_per_sec', type: 'line', position: { row: 1, col: 0, width: 2, height: 1 } },
      { metric: 'error_rate', type: 'sparkline', position: { row: 2, col: 0, width: 1, height: 1 } },
      { metric: 'cpu', type: 'sparkline', position: { row: 2, col: 1, width: 1, height: 1 } },
    ],
  });
}

/**
 * Initialize — seed defaults.
 */
function initialize() {
  seedDefaults();
}

/**
 * Reset (for testing).
 */
function reset() {
  store.clear();
  nextId = 1;
}

module.exports = {
  create,
  getById,
  list,
  update,
  remove,
  seedDefaults,
  initialize,
  reset,
};
