'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const dashboards = require('../../src/data/dashboards');

describe('DashboardsStore', () => {
  beforeEach(() => {
    dashboards.reset();
  });

  describe('create', () => {
    it('creates a dashboard with name and defaults', () => {
      const d = dashboards.create({ name: 'Test Dashboard' });
      assert.ok(d.id);
      assert.equal(d.name, 'Test Dashboard');
      assert.deepEqual(d.panels, []);
      assert.equal(d.layout, 'default');
      assert.equal(typeof d.createdAt, 'number');
    });

    it('creates dashboard with custom panels', () => {
      const panels = [{ metric: 'cpu', type: 'gauge' }];
      const d = dashboards.create({ name: 'Custom', panels });
      assert.equal(d.panels.length, 1);
      assert.equal(d.panels[0].metric, 'cpu');
    });
  });

  describe('getById', () => {
    it('returns dashboard by id', () => {
      const created = dashboards.create({ name: 'Find Me' });
      const found = dashboards.getById(created.id);
      assert.equal(found.name, 'Find Me');
    });

    it('returns null for unknown id', () => {
      const found = dashboards.getById(999);
      assert.equal(found, null);
    });
  });

  describe('list', () => {
    it('returns all dashboards with summary info', () => {
      dashboards.create({ name: 'D1' });
      dashboards.create({ name: 'D2' });

      const all = dashboards.list();
      assert.equal(all.length, 2);
      assert.ok(all[0].id);
      assert.ok(all[0].name);
      assert.equal(typeof all[0].panelCount, 'number');
    });
  });

  describe('update', () => {
    it('updates dashboard name', () => {
      const d = dashboards.create({ name: 'Old Name' });
      const updated = dashboards.update(d.id, { name: 'New Name' });
      assert.equal(updated.name, 'New Name');
    });

    it('updates dashboard panels', () => {
      const d = dashboards.create({ name: 'Test' });
      const panels = [{ metric: 'memory', type: 'line' }];
      const updated = dashboards.update(d.id, { panels });
      assert.equal(updated.panels.length, 1);
    });

    it('returns null for unknown id', () => {
      const result = dashboards.update(999, { name: 'Nope' });
      assert.equal(result, null);
    });
  });

  describe('remove', () => {
    it('deletes dashboard', () => {
      const d = dashboards.create({ name: 'Delete Me' });
      const result = dashboards.remove(d.id);
      assert.equal(result, true);

      const found = dashboards.getById(d.id);
      assert.equal(found, null);
    });

    it('returns false for unknown id', () => {
      const result = dashboards.remove(999);
      assert.equal(result, false);
    });
  });

  describe('seedDefaults', () => {
    it('creates 2 default dashboards', () => {
      dashboards.seedDefaults();
      const all = dashboards.list();
      assert.equal(all.length, 2);
    });
  });
});
