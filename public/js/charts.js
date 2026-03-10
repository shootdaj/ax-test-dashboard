/**
 * Charts Engine — Canvas-based chart rendering with smooth animations.
 * Supports: line charts, sparklines, gauges, heat maps.
 */

const Charts = (() => {
  'use strict';

  // Color palette
  const COLORS = {
    cyan: { main: '#00e5ff', dim: 'rgba(0, 229, 255, 0.15)', glow: 'rgba(0, 229, 255, 0.4)' },
    magenta: { main: '#ff00e5', dim: 'rgba(255, 0, 229, 0.15)', glow: 'rgba(255, 0, 229, 0.4)' },
    green: { main: '#00ff88', dim: 'rgba(0, 255, 136, 0.15)', glow: 'rgba(0, 255, 136, 0.4)' },
    yellow: { main: '#ffdd00', dim: 'rgba(255, 221, 0, 0.15)', glow: 'rgba(255, 221, 0, 0.4)' },
    red: { main: '#ff3344', dim: 'rgba(255, 51, 68, 0.15)', glow: 'rgba(255, 51, 68, 0.4)' },
  };

  const METRIC_COLORS = {
    cpu: COLORS.cyan,
    memory: COLORS.magenta,
    requests_per_sec: COLORS.green,
    error_rate: COLORS.red,
    response_time: COLORS.yellow,
  };

  /**
   * Set up a canvas for high-DPI rendering.
   */
  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height, dpr };
  }

  /**
   * Draw a smooth line chart with gradient fill.
   */
  function drawLineChart(canvas, points, metricName, options = {}) {
    if (!points || points.length < 2) return;

    const { ctx, width, height } = setupCanvas(canvas);
    const color = METRIC_COLORS[metricName] || COLORS.cyan;
    const padding = { top: 20, right: 16, bottom: 30, left: 50 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Compute bounds
    const values = points.map(p => p.value);
    let minVal = Math.min(...values);
    let maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    minVal -= range * 0.05;
    maxVal += range * 0.05;

    const minTime = points[0].timestamp;
    const maxTime = points[points.length - 1].timestamp;
    const timeRange = maxTime - minTime || 1;

    // Scale functions
    const xScale = (t) => padding.left + ((t - minTime) / timeRange) * chartW;
    const yScale = (v) => padding.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (i / gridLines) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      const val = maxVal - (i / gridLines) * (maxVal - minVal);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(val < 10 ? 2 : 0), padding.left - 8, y + 3);
    }

    // X-axis time labels
    const timeLabels = 6;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= timeLabels; i++) {
      const t = minTime + (i / timeLabels) * timeRange;
      const x = xScale(t);
      const date = new Date(t);
      const label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      ctx.fillText(label, x, height - 8);
    }

    // Gradient fill under the line
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, color.glow);
    gradient.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.moveTo(xScale(points[0].timestamp), yScale(points[0].value));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(xScale(points[i].timestamp), yScale(points[i].value));
    }
    // Close the fill area
    ctx.lineTo(xScale(points[points.length - 1].timestamp), padding.top + chartH);
    ctx.lineTo(xScale(points[0].timestamp), padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw the line
    ctx.beginPath();
    ctx.moveTo(xScale(points[0].timestamp), yScale(points[0].value));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(xScale(points[i].timestamp), yScale(points[i].value));
    }
    ctx.strokeStyle = color.main;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glow effect
    ctx.shadowColor = color.main;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(xScale(points[0].timestamp), yScale(points[0].value));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(xScale(points[i].timestamp), yScale(points[i].value));
    }
    ctx.strokeStyle = color.main;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Latest value dot
    const lastPoint = points[points.length - 1];
    const lx = xScale(lastPoint.timestamp);
    const ly = yScale(lastPoint.value);

    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = color.main;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(lx, ly, 7, 0, Math.PI * 2);
    ctx.strokeStyle = color.dim;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Draw a sparkline (compact, no axes).
   */
  function drawSparkline(canvas, points, metricName) {
    if (!points || points.length < 2) return;

    const { ctx, width, height } = setupCanvas(canvas);
    const color = METRIC_COLORS[metricName] || COLORS.cyan;
    const padding = 2;

    const values = points.map(p => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, color.glow);
    gradient.addColorStop(1, 'transparent');

    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const x = padding + (i / (points.length - 1)) * chartW;
      const y = padding + chartH - ((points[i].value - minVal) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    const lastX = padding + chartW;
    ctx.lineTo(lastX, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const x = padding + (i / (points.length - 1)) * chartW;
      const y = padding + chartH - ((points[i].value - minVal) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color.main;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  /**
   * Draw a gauge / donut chart.
   */
  function drawGauge(canvas, value, maxValue, metricName, label) {
    const { ctx, width, height } = setupCanvas(canvas);
    const color = METRIC_COLORS[metricName] || COLORS.cyan;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const radius = Math.min(width, height) / 2 - 20;
    const lineWidth = 12;
    const startAngle = 0.75 * Math.PI;
    const endAngle = 2.25 * Math.PI;
    const totalArc = endAngle - startAngle;

    // Determine color based on value percentage
    const pct = value / maxValue;
    let gaugeColor = color;
    if (pct > 0.9) gaugeColor = COLORS.red;
    else if (pct > 0.75) gaugeColor = COLORS.yellow;

    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Value arc
    const valueAngle = startAngle + (pct * totalArc);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, valueAngle);
    ctx.strokeStyle = gaugeColor.main;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glow
    ctx.shadowColor = gaugeColor.main;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, valueAngle);
    ctx.strokeStyle = gaugeColor.main;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center value text
    ctx.fillStyle = gaugeColor.main;
    ctx.font = `bold 28px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(value)}%`, centerX, centerY - 8);

    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '11px "Inter", sans-serif';
    ctx.fillText(label || metricName, centerX, centerY + 18);
  }

  /**
   * Draw a heat map (24 columns for hours).
   */
  function drawHeatMap(canvas, data, metricName) {
    const { ctx, width, height } = setupCanvas(canvas);
    const color = METRIC_COLORS[metricName] || COLORS.green;

    ctx.clearRect(0, 0, width, height);

    if (!data || data.length === 0) return;

    const padding = { top: 20, right: 16, bottom: 30, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const cols = 24; // hours
    const rows = 7;  // days (for now we simulate with fewer)
    const cellW = chartW / cols;
    const cellH = chartH / Math.min(rows, data.length);

    const allValues = data.flat();
    const maxVal = Math.max(...allValues);
    const minVal = Math.min(...allValues);
    const range = maxVal - minVal || 1;

    // Draw cells
    for (let row = 0; row < Math.min(rows, data.length); row++) {
      for (let col = 0; col < cols && col < (data[row] || []).length; col++) {
        const val = data[row][col];
        const intensity = (val - minVal) / range;
        const x = padding.left + col * cellW;
        const y = padding.top + row * cellH;

        // Interpolate color intensity
        const r = parseInt(color.main.slice(1, 3), 16);
        const g = parseInt(color.main.slice(3, 5), 16);
        const b = parseInt(color.main.slice(5, 7), 16);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.1 + intensity * 0.7})`;
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
      }
    }

    // Hour labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    for (let h = 0; h < 24; h += 3) {
      ctx.fillText(`${h}:00`, padding.left + h * cellW + cellW / 2, height - 8);
    }

    // Day labels
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    ctx.textAlign = 'right';
    for (let d = 0; d < Math.min(rows, data.length); d++) {
      ctx.fillText(dayLabels[d] || '', padding.left - 6, padding.top + d * cellH + cellH / 2 + 3);
    }
  }

  return {
    COLORS,
    METRIC_COLORS,
    setupCanvas,
    drawLineChart,
    drawSparkline,
    drawGauge,
    drawHeatMap,
  };
})();
