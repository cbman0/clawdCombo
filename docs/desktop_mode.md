# Desktop One-Click Mode

`clawdCombo` now supports a one-click desktop launcher.

## What it does
- Starts local backend (`ui/server.js`) automatically
- Waits for UI health
- Opens desktop window pointed at local app URL
- Stops backend when desktop app exits

## Run
```bash
cd /home/cbMan0/Desktop/gitStuff/clawdCombo
./run-desktop.sh
```

Or:
```bash
npm run desktop:start
```

## Security posture
- Secrets stay local in `.env` and `.clawdcombo/`
- GUI actions call local backend only
- No browser extension required

## Modes
- **GUI mode:** desktop window with full controls
- **Headless AI/human mode:** use CLI scripts directly (`scripts/*`, `cli/*`)

This dual-mode design supports both manual and agent-driven workflows.
