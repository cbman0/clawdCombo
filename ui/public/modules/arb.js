import { api } from './api.js';

export function arbView() {
  return `
    <div class="card">
      <h3>Arbitrage Gap Scanner</h3>
      <p class="muted">Directional 0x quote comparison with custom threshold trigger.</p>
      <label>Sell token</label><input id="arbSell" placeholder="0x..." />
      <label>Buy token</label><input id="arbBuy" placeholder="0x..." />
      <label>Sell amount (base units)</label><input id="arbAmt" placeholder="1000000" />
      <label>Threshold %</label><input id="arbThreshold" value="1" />
      <button id="arbScanBtn">Scan Gap</button>
      <pre id="arbOut">No arb scan yet.</pre>
    </div>
  `;
}

export function bindArb() {
  const out = document.getElementById('arbOut');
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
}
