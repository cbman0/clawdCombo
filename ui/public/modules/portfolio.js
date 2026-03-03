import { api } from './api.js';

export function portfolioView() {
  return `
    <div class="card">
      <h3>Portfolio Snapshot</h3>
      <p class="muted">Rainbow-style quick readability: one address, fast native/token checks.</p>
      <label>Wallet address</label><input id="balAddress" placeholder="0x..." />

      <div class="row">
        <button id="nativeBalBtn" class="alt">Get Native POL</button>
        <button id="tokenBalBtn">Get Token Balance</button>
      </div>

      <label>Token contract (ERC-20)</label><input id="tokenAddress" placeholder="0x..." />
      <pre id="portfolioOut">No data yet.</pre>
    </div>
  `;
}

export function bindPortfolio() {
  const out = document.getElementById('portfolioOut');
  document.getElementById('nativeBalBtn').onclick = async () => {
    try {
      const address = document.getElementById('balAddress').value.trim();
      const result = await api('/api/balance/native', 'POST', { address });
      out.textContent = JSON.stringify(result, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };

  document.getElementById('tokenBalBtn').onclick = async () => {
    try {
      const address = document.getElementById('balAddress').value.trim();
      const tokenAddress = document.getElementById('tokenAddress').value.trim();
      const result = await api('/api/balance/token', 'POST', { address, tokenAddress });
      out.textContent = JSON.stringify(result, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };
}
