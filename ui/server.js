require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.UI_PORT || 4173;
const ROOT = path.resolve(__dirname, "..");
const META_PATH = path.join(ROOT, ".clawdcombo", "secrets", "wallets.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (_req, res) => {
  const wallets = fs.existsSync(META_PATH)
    ? JSON.parse(fs.readFileSync(META_PATH, "utf8")).wallets || []
    : [];

  res.json({
    ok: true,
    wallets,
    presets: { low: "0.0001", medium: "0.001", high: "0.002" },
    envLoaded: {
      amoyRpc: !!process.env.AMOY_RPC_URL,
      deployerPk: !!(process.env.FUNDER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY),
      backupPassword: !!process.env.WALLET_BACKUP_PASSWORD,
    },
  });
});

app.post("/api/transfer", (req, res) => {
  const { fromAlias = "devA", toAlias = "devB", preset = "medium", amountPol } = req.body || {};

  const env = {
    ...process.env,
    FROM_ALIAS: fromAlias,
    TO_ALIAS: toAlias,
    AMOY_AMOUNT_PRESET: preset,
  };

  if (amountPol) env.AMOY_AMOUNT_POL = String(amountPol);

  const child = spawn(process.execPath, [path.join(ROOT, "scripts", "tx-amoy.js")], {
    cwd: ROOT,
    env,
  });

  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (d) => (stdout += d.toString()));
  child.stderr.on("data", (d) => (stderr += d.toString()));

  child.on("close", (code) => {
    if (code !== 0) {
      return res.status(400).json({ ok: false, error: stderr.trim() || stdout.trim() || `exit code ${code}` });
    }

    try {
      const parsed = JSON.parse(stdout);
      return res.json({ ok: true, result: parsed });
    } catch {
      return res.json({ ok: true, raw: stdout.trim() });
    }
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`clawdCombo UI listening on http://127.0.0.1:${PORT}`);
});
