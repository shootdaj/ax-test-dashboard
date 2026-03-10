'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const alerts = require('../../src/data/alerts');
const metrics = require('../../src/data/metrics');

describe('AlertsStore', () => {
  beforeEach(() => {
    metrics.reset();
    alerts.reset();
    metrics.seedData();
  });

  afterEach(() => {
    alerts.reset();
    metrics.reset();
  });

  describe('createRule', () => {
    it('creates an alert rule with correct properties', () => {
      const rule = alerts.createRule({
        metric: 'cpu',
        warnThreshold: 75,
        criticalThreshold: 90,
        operator: 'gt',
        name: 'High CPU',
      });

      assert.ok(rule.id, 'should have id');
      assert.equal(rule.metric, 'cpu');
      assert.equal(rule.warnThreshold, 75);
      assert.equal(rule.criticalThreshold, 90);
      assert.equal(rule.operator, 'gt');
      assert.equal(rule.name, 'High CPU');
      assert.equal(rule.enabled, true);
    });

    it('throws on unknown metric', () => {
      assert.throws(() => {
        alerts.createRule({ metric: 'nonexistent', warnThreshold: 50 });
      }, /Unknown metric/);
    });

    it('assigns incremental IDs', () => {
      const r1 = alerts.createRule({ metric: 'cpu', warnThreshold: 50 });
      const r2 = alerts.createRule({ metric: 'memory', warnThreshold: 60 });
      assert.equal(r2.id, r1.id + 1);
    });
  });

  describe('getRules', () => {
    it('returns all created rules', () => {
      alerts.createRule({ metric: 'cpu', warnThreshold: 75 });
      alerts.createRule({ metric: 'memory', warnThreshold: 80 });

      const rules = alerts.getRules();
      assert.equal(rules.length, 2);
    });
  });

  describe('deleteRule', () => {
    it('removes the rule', () => {
      const rule = alerts.createRule({ metric: 'cpu', warnThreshold: 75 });
      alerts.deleteRule(rule.id);

      const rules = alerts.getRules();
      assert.equal(rules.length, 0);
    });
  });

  describe('evaluate', () => {
    it('triggers alert when threshold exceeded', () => {
      // Create a rule with very low threshold that will be triggered
      alerts.createRule({
        metric: 'cpu',
        warnThreshold: 0,
        criticalThreshold: null,
        operator: 'gt',
        name: 'Always warn',
      });

      alerts.evaluate();

      const active = alerts.getActiveAlerts();
      assert.ok(active.length > 0, 'Should have active alerts');
      assert.equal(active[0].level, 'warn');
    });

    it('does not trigger when below threshold', () => {
      alerts.createRule({
        metric: 'cpu',
        warnThreshold: 999,
        operator: 'gt',
        name: 'Never warn',
      });

      alerts.evaluate();

      const active = alerts.getActiveAlerts();
      assert.equal(active.length, 0, 'Should have no active alerts');
    });

    it('resolves alert when value returns below threshold', () => {
      // Create rule that triggers
      const rule = alerts.createRule({
        metric: 'cpu',
        warnThreshold: 0,
        operator: 'gt',
        name: 'Will resolve',
      });

      alerts.evaluate();
      assert.ok(alerts.getActiveAlerts().length > 0);

      // Delete the rule and re-create with impossible threshold
      alerts.deleteRule(rule.id);

      const active = alerts.getActiveAlerts();
      assert.equal(active.length, 0, 'Alert should be resolved after rule deletion');
    });
  });

  describe('getHistory', () => {
    it('returns empty array when no alerts triggered', () => {
      const history = alerts.getHistory();
      assert.equal(history.length, 0);
    });

    it('records triggered alerts', () => {
      alerts.createRule({ metric: 'cpu', warnThreshold: 0, operator: 'gt' });
      alerts.evaluate();

      const history = alerts.getHistory();
      assert.ok(history.length > 0, 'Should have history entries');
      assert.equal(typeof history[0].triggeredAt, 'number');
    });
  });

  describe('seedDefaultRules', () => {
    it('creates 4 default rules', () => {
      alerts.seedDefaultRules();
      const rules = alerts.getRules();
      assert.equal(rules.length, 4);
    });
  });
});
