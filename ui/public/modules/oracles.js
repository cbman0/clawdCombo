import { api } from './api.js';

export function oraclesView() {
  return `
    <div class="card">
      <h3>Price Oracles</h3>
      <p class="muted">Coingecko + DexScreener aggregate for quick validation.</p>
      <label>Symbol</label><input id="oracleSymbol" value="POL" />
      <label>Token address (optional)</label><input id="oracleTokenAddr" placeholder="0x..." />
      <button id="oraclePriceBtn">Fetch Prices</button>
      <pre id="oracleOut">No price data yet.</pre>
    </div>
  `;
}

export function bindOracles() {
  const out = document.getElementById('oracleOut');
  document.getElementById('oraclePriceBtn').onclick = async () => {
    try {
      const result = await api('/api/prices', 'POST', {
        symbol: document.getElementById('oracleSymbol').value.trim(),
        tokenAddress: document.getElementById('oracleTokenAddr').value.trim() || undefined,
      });
      out.textContent = JSON.stringify(result, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };
}
