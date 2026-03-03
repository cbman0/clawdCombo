import { api } from './api.js';

export function portfolioView() {
  return `
    <div class="card">
      <h3>Assets (Rainbow-style quick view)</h3>
      <p class="muted">Native and custom ERC-20 balance checks.</p>
      <label>Address</label><input id="balAddress" placeholder="0x..." />
      <button id="nativeBalBtn">Get Native POL</button>
      <label>Token contract (ERC-20)</label><input id="tokenAddress" placeholder="0x..." />
      <button id="tokenBalBtn">Get Token Balance</button>
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
