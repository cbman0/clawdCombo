# clawdCombo Health Watchdog

Monitors the gateway (UI/API server) and automatically recovers from failures.

## Features

- **Health Monitoring**: Periodic HTTP checks to `/healthz` endpoint with timeout
- **Auto-Recovery**: Restarts UI service on failure with configurable retry threshold
- **Exponential Backoff**: Prevents restart thrashing
- **Rate-Limited Alerts**: Cooldown prevents alert spam
- **State Persistence**: Survives watchdog restarts, tracks metrics
- **Structured Logging**: Supports both plain text and JSON log formats
- **Metrics Collection**: Tracks latency, success rates, restart counts
- **Graceful Shutdown**: Handles SIGINT/SIGTERM properly
- **Configurable**: Via CLI flags or environment variables

## Quick Start

```bash
# Install dependencies (already done if you have node_modules)
npm install

# Start the watchdog in background
node tools/health-watchdog.js &

# Or use npm script
npm run health:watchdog
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HEALTH_URL` | `http://localhost:4173/healthz` | Health check endpoint URL |
| `HEALTH_INTERVAL` | `30` | Check interval in seconds |
| `HEALTH_MAX_RETRIES` | `3` | Consecutive failures before alert |
| `HEALTH_AUTO_RESTART` | `true` | Set to `false` to disable auto-restart |
| `HEALTH_ALERT_COOLDOWN` | `3600` | Seconds between repeat alerts |
| `HEALTH_RESTART_DELAY` | `5000` | Minimum ms between restart attempts |
| `HEALTH_MAX_RESTARTS` | `5` | Max restart attempts before giving up |
| `HEALTH_STATE_FILE` | `logs/health-watchdog.state.json` | State persistence file |
| `HEALTH_LOG_FILE` | `logs/build_live.log` | Log file path |
| `HEALTH_LOG_JSON` | `false` | Set to `true` for JSON structured logs |
| `UI_START_SCRIPT` | `npm run ui:start` | Command to start UI service |

### CLI Flags (override environment)

```bash
node tools/health-watchdog.js \
  --interval=60 \
  --maxRetries=5 \
  --autoRestart=true \
  --healthUrl=http://localhost:4173/healthz \
  --logJson=true
```

## How It Works

1. **Health Check**: HTTP GET to configured URL with 5s timeout
2. **Success**: Response must be JSON with `{ "ok": true }` and status 200
3. **Metrics**: Track latency, update rolling average, count successes/failures
4. **Failure Handling**: Increment consecutive failure counter
5. **Threshold Met**: Send alert, optionally restart UI service
6. **Restart Logic**: Kill existing process, wait 2s, start new detached process
7. **Throttling**: Prevent restart storms (min 5s between attempts, max 5 total)
8. **Recovery Detection**: Next successful check sends recovery alert
9. **State Save**: Persist all state after each check

## Alerts

Alerts are logged to both stdout and `logs/build_live.log`.

### Failure Alert

```
[2026-03-04T21:30:00.000Z] [ERROR] ALERT [FAILURE]: Gateway Unhealthy
Reason: ECONNREFUSED
Consecutive failures: 3
Latency: N/A
URL: http://localhost:4173/healthz
```

### Recovery Alert

```
[2026-03-04T21:35:00.000Z] [INFO] ALERT [RECOVERY]: Gateway Recovered
Latency: 12ms
Consecutive failures cleared.
```

## State File

`logs/health-watchdog.state.json`:

```json
{
  "consecutiveFailures": 0,
  "lastAlertTime": 1712345678901,
  "lastRestartTime": 1712345678901,
  "restartCount": 3,
  "lastStatus": "healthy",
  "alerts": [],
  "metrics": {
    "totalChecks": 150,
    "healthyChecks": 148,
    "unhealthyChecks": 2,
    "restartsTriggered": 1,
    "lastCheckAt": "2026-03-04T21:35:00.000Z",
    "avgLatency": 15.5
  }
}
```

## Integration

### As Daemon (Development)

```bash
# Start in background
npm run health:watchdog &

# Monitor logs
tail -f logs/build_live.log

# Stop
pkill -f "health-watchdog.js"
```

### As Systemd Service (Production)

Create `/etc/systemd/system/clawdcombo-health.service`:

```ini
[Unit]
Description=clawdCombo Health Watchdog
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/cbMan0/Desktop/gitStuff/clawdCombo
Environment="HEALTH_INTERVAL=30" "HEALTH_AUTO_RESTART=true"
ExecStart=/usr/bin/node tools/health-watchdog.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable clawdcombo-health
sudo systemctl start clawdcombo-health
sudo systemctl status clawdcombo-health
sudo journalctl -u clawdcombo-health -f
```

### Cron Job (Simple)

```bash
# Run every minute, let it exit after one check
* * * * * cd /home/cbMan0/Desktop/gitStuff/clawdCombo && \
  HEALTH_INTERVAL=60 HEALTH_MAX_RETRIES=1 \
  node tools/health-watchdog.js >> /dev/null 2>&1
```

Note: Cron mode is stateless (no long-running daemon), useful for simple periodic checks.

## Troubleshooting

### Watchdog not detecting failures

```bash
# Test health endpoint manually
curl -s http://localhost:4173/healthz

# Should return: {"ok":true,"service":"clawdCombo-ui",...}

# Check watchdog logs
tail -f logs/build_live.log

# Verify watchdog is running
ps aux | grep health-watchdog
```

### Auto-restart not working

```bash
# Check UI process
ps aux | grep server.js

# Test restart manually
npm run ui:start

# Check permissions (can watchdog kill the process?)
# If running as different user, may need sudo or setuid

# Look in logs for restart attempts
grep "restart" logs/build_live.log | tail -20
```

### Excessive restarts

```bash
# Increase thresholds temporarily
HEALTH_MAX_RETRIES=5 HEALTH_RESTART_DELAY=10000 \
  node tools/health-watchdog.js

# Or disable restart to investigate
HEALTH_AUTO_RESTART=false node tools/health-watchdog.js

# Check logs for root cause
tail -50 logs/build_live.log | grep -i error

# Common causes:
# - Port 4173 already in use (lsof -i :4173)
# - Missing environment variables (.env not loaded)
# - Syntax errors in UI code (check console)
```

### Logs not rotating

The health watchdog uses shared `tools/log-rotation-lib.sh` for size-based rotation (5MB default). To trigger manual rotation or set up cron:

```bash
# Manual rotation (if using the bash scripts)
./tools_worklog_heartbeat.sh  # already rotates in loop
# Or call rotate function directly:
source tools/log-rotation-lib.sh
LOG_FILE=/path/to/build_live.log rotate_log
```

## Customization

### Change Health Check Endpoint

```bash
HEALTH_URL=http://localhost:8080/health node tools/health-watchdog.js
```

### Adjust Sensitivity

For production (faster detection):
```bash
HEALTH_INTERVAL=10 HEALTH_MAX_RETRIES=2 node tools/health-watchdog.js
```

For development (gentler):
```bash
HEALTH_INTERVAL=60 HEALTH_MAX_RETRIES=10 HEALTH_AUTO_RESTART=false node tools/health-watchdog.js
```

### Add Custom Alert Actions

Edit the `sendAlert()` function to add:

- Email via nodemailer
- Slack/Discord webhook
- PagerDuty API
- SMS via Twilio

Example:

```javascript
function sendAlert(subject, details, isRecovery) {
  // ... existing logging ...

  // Send to Slack
  fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({ text: `ALERT: ${subject}\n${details}` })
  }).catch(() => {}); // fire and forget

  // Send email (requires nodemailer setup)
  // ...
}
```

### JSON Structured Logging

Set `HEALTH_LOG_JSON=true` for JSON logs (easier for log aggregation):

```json
{"timestamp":"2026-03-04T21:30:00.000Z","level":"error","message":"ALERT [FAILURE]: Gateway Unhealthy","reason":"ECONNREFUSED","consecutiveFailures":3}
```

## Metrics

The watchdog tracks:

- `totalChecks`: Total health checks performed
- `healthyChecks`: Number of successful checks
- `unhealthyChecks`: Number of failed checks
- `restartsTriggered`: How many times UI was restarted
- `avgLatency`: Rolling average of health check latency (ms)
- `lastCheckAt`: Timestamp of most recent check

View current metrics:

```bash
cat logs/health-watchdog.state.json | jq '.metrics'
```

## Safety Notes

- Auto-restart is **enabled by default** but throttled
- Only restarts the UI service, not the entire machine
- All actions are logged with timestamps
- Rate limiting prevents alert storms
- State persistence allows recovery after watchdog restart
- Max restart attempts prevents infinite loops

## Related

- UI server health endpoint: `ui/server.js` `/healthz` route
- Log rotation: `tools/log-rotation-lib.sh` (used by heartbeat and roadmap sync)
- Systemd service: See "Integration" section above

## License

Part of clawdCombo – MIT licensed.
