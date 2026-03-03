import { api } from './api.js';

export function arbView() {
  return `
    <div class="card">
      <h3>Arbitrage Scanner</h3>
      <p class="muted">Single scan + persisted watchlist config + timed run metrics.</p>
      <label>Sell token</label><input id="arbSell" placeholder="0x..." />
      <label>Buy token</label><input id="arbBuy" placeholder="0x..." />
      <label>Sell amount (base units)</label><input id="arbAmt" placeholder="1000000" />
      <label>Threshold %</label><input id="arbThreshold" value="1" />
      <label>Scan interval sec</label><input id="arbInterval" value="60" />
      <button id="arbScanBtn">Scan Pair Gap</button>
      <label>Watchlist JSON pairs</label>
      <textarea id="arbWatchlist" rows="6">[]</textarea>
      <button id="arbLoadBtn">Load Saved Watchlist</button>
      <button id="arbSaveBtn">Save Watchlist</button>
      <button id="arbWatchBtn">Run Watchlist Scan</button>
      <pre id="arbOut">No arb scan yet.</pre>
    </div>
  `;
}

export function bindArb() {
  const out = document.getElementById('arbOut');

  const loadSaved = async () => {
    try {
      const result = await api('/api/arb/watchlist');
      document.getElementById('arbThreshold').value = String(result.thresholdPct ?? 1);
      document.getElementById('arbInterval').value = String(result.intervalSec ?? 60);
      document.getElementById('arbWatchlist').value = JSON.stringify(result.pairs || [], null, 2);
      out.textContent = JSON.stringify(result, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };

  document.getElementById('arbScanBtn').onclick = async () => {
    try {
      const result = await api('/api/arb/scan', 'POST', {
        sellToken: document.getElementById('arbSell').value.trim(),
        buyToken: document.getElementById('arbBuy').value.trim(),
        sellAmount: document.getElementById('arbAmt').value.trim(),
        thresholdPct: Number(document.getElementById('arbThreshold').value.trim() || 1),
      });
      out.textContent = JSON.stringify(result, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };

  document.getElementById('arbLoadBtn').onclick = loadSaved;

  document.getElementById('arbSaveBtn').onclick = async () => {
    try {
      const result = await api('/api/arb/watchlist', 'POST', {
        thresholdPct: Number(document.getElementById('arbThreshold').value.trim() || 1),
        intervalSec: Number(document.getElementById('arbInterval').value.trim() || 60),
        pairs: JSON.parse(document.getElementById('arbWatchlist').value),
      });
      out.textContent = JSON.stringify(result, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };

  document.getElementById('arbWatchBtn').onclick = async () => {
    try {
      const result = await api('/api/arb/watchlist/run', 'POST', {
        thresholdPct: Number(document.getElementById('arbThreshold').value.trim() || 1),
        pairs: JSON.parse(document.getElementById('arbWatchlist').value),
      });
      out.textContent = JSON.stringify(result, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };

  loadSaved();
}
