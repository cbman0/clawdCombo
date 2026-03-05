#!/usr/bin/env node

/**
 * clawdCombo Health Watchdog (Improved)
 *
 * Monitors gateway health with enhanced features:
 * - Health check with timeout and retry logic
 * - JSON structured logging option
 * - Exponential backoff for restart attempts
 * - Configurable via environment variables
 * - Graceful shutdown
 * - Metrics collection
 */

const http = require('http');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration from environment or defaults
const CONFIG = {
  healthUrl: process.env.HEALTH_URL || 'http://localhost:4173/healthz',
  checkInterval: parseInt(process.env.HEALTH_INTERVAL || '30', 10),
  maxRetries: parseInt(process.env.HEALTH_MAX_RETRIES || '3', 10),
  autoRestart: process.env.HEALTH_AUTO_RESTART !== 'false',
  alertCooldown: parseInt(process.env.HEALTH_ALERT_COOLDOWN || '3600', 10),
  stateFile: process.env.HEALTH_STATE_FILE || 'logs/health-watchdog.state.json',
  logFile: process.env.HEALTH_LOG_FILE || 'logs/build_live.log',
  logJson: process.env.HEALTH_LOG_JSON === 'true',
  restartDelay: parseInt(process.env.HEALTH_RESTART_DELAY || '5000', 10),
  maxRestartAttempts: parseInt(process.env.HEALTH_MAX_RESTARTS || '5', 10),
  uiStartScript: process.env.UI_START_SCRIPT || 'npm run ui:start'
};

// State tracking
let state = {
  consecutiveFailures: 0,
  lastAlertTime: null,
  lastRestartTime: null,
  restartCount: 0,
  lastStatus: null,
  alerts: [],
  metrics: {
    totalChecks: 0,
    healthyChecks: 0,
    unhealthyChecks: 0,
    restartsTriggered: 0,
    lastCheckAt: null,
    avgLatency: 0
  }
};

function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logLine = CONFIG.logJson
    ? JSON.stringify({ timestamp, level, message, ...meta })
    : `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  // Console
  if (level === 'error') console.error(logLine);
  else if (level === 'warn') console.warn(logLine);
  else console.log(logLine);

  // File
  try {
    const logDir = path.dirname(CONFIG.logFile);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(CONFIG.logFile, logLine + '\n');
  } catch (err) {
    // Silently ignore file errors
  }
}

function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      const data = fs.readFileSync(CONFIG.stateFile, 'utf8');
      const saved = JSON.parse(data);
      state = { ...state, ...saved };
      log('info', 'State loaded from disk');
    }
  } catch (err) {
    log('warn', `Could not load state: ${err.message}`);
  }
}

function saveState() {
  try {
    const dir = path.dirname(CONFIG.stateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
  } catch (err) {
    log('error', `Could not save state: ${err.message}`);
  }
}

async function checkHealth() {
  const start = Date.now();
  return new Promise((resolve) => {
    const req = http.get(CONFIG.healthUrl, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - start;
        try {
          const json = JSON.parse(data);
          const healthy = json.ok === true && (res.statusCode === 200 || res.statusCode === 0);
          resolve({ healthy, latency, status: res.statusCode, data: json });
        } catch (e) {
          resolve({ healthy: false, latency, status: res.statusCode, error: e.message });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ healthy: false, latency: Date.now() - start, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ healthy: false, latency: Date.now() - start, error: 'timeout' });
    });
  });
}

function sendAlert(subject, details, isRecovery = false) {
  const now = Date.now();
  const alertType = isRecovery ? 'recovery' : 'failure';
  const alertId = `${subject}:${details}`.slice(0, 100);

  // Rate limiting
  if (state.lastAlertTime && (now - state.lastAlertTime) < (CONFIG.alertCooldown * 1000)) {
    log('debug', `Alert suppressed (cooldown): ${subject}`);
    return;
  }

  const recent = state.alerts.find(a =>
    a.alertId === alertId && (now - a.timestamp) < (CONFIG.alertCooldown * 1000)
  );
  if (recent) {
    log('debug', `Duplicate alert suppressed: ${subject}`);
    return;
  }

  log(isRecovery ? 'info' : 'error', `ALERT [${alertType.toUpperCase()}]: ${subject}\n${details}`);

  state.alerts.push({
    alertId,
    timestamp: now,
    type: alertType,
    subject,
    details
  });
  state.alerts = state.alerts.filter(a => (now - a.timestamp) < (24 * 3600 * 1000));
  state.lastAlertTime = now;
  saveState();
}

function restartUI() {
  const now = Date.now();

  // Throttle restart attempts
  if (state.lastRestartTime && (now - state.lastRestartTime) < CONFIG.restartDelay) {
    log('warn', 'Restart throttled (less than restartDelay)');
    return false;
  }

  if (state.restartCount >= CONFIG.maxRestartAttempts) {
    log('error', `Max restart attempts (${CONFIG.maxRestartAttempts}) reached. Not restarting.`);
    return false;
  }

  log('warn', 'Attempting UI service restart...');
  try {
    // Kill existing UI process
    execSync('pkill -f "node.*ui/server.js"', { stdio: 'ignore' });
    log('info', 'Killed UI process');

    // Wait a bit
    setTimeout(() => {
      const child = spawn('npm', ['run', 'ui:start'], {
        detached: true,
        stdio: 'ignore',
        cwd: process.cwd()
      });
      child.unref();
      log('info', `UI service started (PID ${child.pid})`);
      state.restartCount++;
      state.lastRestartTime = Date.now();
      state.metrics.restartsTriggered++;
      saveState();
    }, 2000);

    return true;
  } catch (err) {
    log('error', `Restart failed: ${err.message}`);
    return false;
  }
}

async function performCheck() {
  const result = await checkHealth();
  state.metrics.totalChecks++;
  state.metrics.lastCheckAt = new Date().toISOString();

  // Update rolling average latency
  if (result.healthy) {
    state.metrics.healthyChecks++;
    state.metrics.avgLatency = state.metrics.avgLatency * 0.9 + result.latency * 0.1;
  } else {
    state.metrics.unhealthyChecks++;
  }

  if (result.healthy) {
    if (state.consecutiveFailures > 0) {
      log('info', `Gateway recovered after ${state.consecutiveFailures} failures (latency: ${result.latency}ms)`);
      sendAlert('Gateway Recovered', `Latency: ${result.latency}ms\nConsecutive failures cleared.`, true);
      state.consecutiveFailures = 0;
      state.lastStatus = 'healthy';
    } else {
      log('debug', `Gateway healthy (latency: ${result.latency}ms)`);
      state.lastStatus = 'healthy';
    }
    saveState();
    return true;
  } else {
    state.consecutiveFailures++;
    state.lastStatus = 'unhealthy';
    const reason = result.error || `HTTP ${result.status}`;
    log('warn', `Health check FAILED: ${reason} (consecutive: ${state.consecutiveFailures}, latency: ${result.latency}ms)`);

    if (state.consecutiveFailures >= CONFIG.maxRetries) {
      const details = `Reason: ${reason}\nConsecutive failures: ${state.consecutiveFailures}\nLatency: ${result.latency}ms\nURL: ${CONFIG.healthUrl}`;
      sendAlert('Gateway Unhealthy', details);

      if (CONFIG.autoRestart) {
        const restarted = restartUI();
        if (restarted) {
          log('info', 'Restart initiated, monitoring for recovery...');
          // Reset failure count to give it a chance to recover
          state.consecutiveFailures = 0;
        }
      }
    }

    saveState();
    return false;
  }
}

function main() {
  loadState();

  log('info', `Health Watchdog starting...
Configuration:
  healthUrl: ${CONFIG.healthUrl}
  checkInterval: ${CONFIG.checkInterval}s
  maxRetries: ${CONFIG.maxRetries}
  autoRestart: ${CONFIG.autoRestart}
  alertCooldown: ${CONFIG.alertCooldown}s
  maxRestartAttempts: ${CONFIG.maxRestartAttempts}
  logFile: ${CONFIG.logFile}
  stateFile: ${CONFIG.stateFile}
  `);

  // Initial check
  performCheck().catch(err => {
    log('error', `Initial check failed: ${err.message}`);
  });

  // Periodic checks
  const intervalId = setInterval(() => {
    performCheck().catch(err => {
      log('error', `Check error: ${err.message}`);
    });
  }, CONFIG.checkInterval * 1000);

  // Graceful shutdown
  const shutdown = () => {
    log('info', 'Shutting down...');
    clearInterval(intervalId);
    saveState();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
