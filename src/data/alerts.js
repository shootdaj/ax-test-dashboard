'use strict';

/**
 * Alert rules engine with threshold-based evaluation and history tracking.
 */

const metrics = require('./metrics');

// Alert rules store: id -> rule
const rules = new Map();

// Alert history: array of { id, ruleId, metric, level, value, threshold, triggeredAt, resolvedAt }
const history = [];

// Currently active alerts: ruleId -> alert record
const activeAlerts = new Map();

// Auto-increment ID
let nextRuleId = 1;
let nextAlertId = 1;

// Evaluation interval handle
let evaluationInterval = null;

/**
 * Create a new alert rule.
 * @param {Object} opts - { metric, warnThreshold, criticalThreshold, operator, name }
 * operator: 'gt' (above threshold) or 'lt' (below threshold)
 */
function createRule({ metric, warnThreshold, criticalThreshold, operator = 'gt', name }) {
  if (!metrics.METRIC_DEFINITIONS[metric]) {
    throw new Error(`Unknown metric: ${metric}`);
  }

  const rule = {
    id: nextRuleId++,
    name: name || `${metric} alert`,
    metric,
    warnThreshold,
    criticalThreshold,
    operator,
    enabled: true,
    createdAt: Date.now(),
  };

  rules.set(rule.id, rule);
  return rule;
}

/**
 * Get all alert rules.
 */
function getRules() {
  return Array.from(rules.values());
}

/**
 * Delete an alert rule.
 */
function deleteRule(ruleId) {
  rules.delete(ruleId);
  // Resolve any active alert for this rule
  if (activeAlerts.has(ruleId)) {
    const alert = activeAlerts.get(ruleId);
    alert.resolvedAt = Date.now();
    activeAlerts.delete(ruleId);
  }
}

/**
 * Check if a value breaches a threshold.
 */
function checkThreshold(value, threshold, operator) {
  if (operator === 'gt') return value > threshold;
  if (operator === 'lt') return value < threshold;
  return false;
}

/**
 * Evaluate all rules against current metric values.
 */
function evaluate() {
  const latest = metrics.getLatestValues();

  for (const rule of rules.values()) {
    if (!rule.enabled) continue;

    const metricData = latest[rule.metric];
    if (!metricData) continue;

    const value = metricData.current;
    let level = null;

    // Check critical first (higher priority)
    if (rule.criticalThreshold != null && checkThreshold(value, rule.criticalThreshold, rule.operator)) {
      level = 'critical';
    } else if (rule.warnThreshold != null && checkThreshold(value, rule.warnThreshold, rule.operator)) {
      level = 'warn';
    }

    const existingAlert = activeAlerts.get(rule.id);

    if (level) {
      if (!existingAlert) {
        // New alert triggered
        const alert = {
          id: nextAlertId++,
          ruleId: rule.id,
          ruleName: rule.name,
          metric: rule.metric,
          level,
          value,
          threshold: level === 'critical' ? rule.criticalThreshold : rule.warnThreshold,
          triggeredAt: Date.now(),
          resolvedAt: null,
        };
        activeAlerts.set(rule.id, alert);
        history.push(alert);
      } else {
        // Update level if changed
        existingAlert.level = level;
        existingAlert.value = value;
      }
    } else if (existingAlert) {
      // Alert resolved
      existingAlert.resolvedAt = Date.now();
      activeAlerts.delete(rule.id);
    }
  }
}

/**
 * Get currently active alerts.
 */
function getActiveAlerts() {
  return Array.from(activeAlerts.values());
}

/**
 * Get alert history.
 */
function getHistory(limit = 50) {
  return history.slice(-limit).reverse();
}

/**
 * Start periodic alert evaluation (every 5 seconds).
 */
function startEvaluation() {
  if (evaluationInterval) return;
  evaluationInterval = setInterval(evaluate, 5000);
}

/**
 * Stop alert evaluation.
 */
function stopEvaluation() {
  if (evaluationInterval) {
    clearInterval(evaluationInterval);
    evaluationInterval = null;
  }
}

/**
 * Seed default alert rules.
 */
function seedDefaultRules() {
  createRule({
    metric: 'cpu',
    warnThreshold: 75,
    criticalThreshold: 90,
    operator: 'gt',
    name: 'High CPU Usage',
  });

  createRule({
    metric: 'memory',
    warnThreshold: 80,
    criticalThreshold: 95,
    operator: 'gt',
    name: 'High Memory Usage',
  });

  createRule({
    metric: 'error_rate',
    warnThreshold: 2,
    criticalThreshold: 5,
    operator: 'gt',
    name: 'High Error Rate',
  });

  createRule({
    metric: 'response_time',
    warnThreshold: 500,
    criticalThreshold: 1000,
    operator: 'gt',
    name: 'Slow Response Time',
  });
}

/**
 * Initialize alerts — seed rules and start evaluation.
 */
function initialize() {
  seedDefaultRules();
  startEvaluation();
}

/**
 * Reset store (for testing).
 */
function reset() {
  stopEvaluation();
  rules.clear();
  history.length = 0;
  activeAlerts.clear();
  nextRuleId = 1;
  nextAlertId = 1;
}

module.exports = {
  createRule,
  getRules,
  deleteRule,
  evaluate,
  getActiveAlerts,
  getHistory,
  startEvaluation,
  stopEvaluation,
  seedDefaultRules,
  initialize,
  reset,
};
