import { api } from './api.js';

export function tokensView() {
  return `
    <div class="card">
      <h3>Token Registry (Custom Tokens)</h3>
      <label>Symbol</label><input id="tokenSymbol" placeholder="MYT" />
      <label>Address</label><input id="tokenAddr" placeholder="0x..." />
      <label>Decimals</label><input id="tokenDecimals" value="18" />
      <button id="tokenAddBtn">Add Token</button>
      <button id="tokenListBtn">Refresh Token List</button>
      <pre id="tokenOut">loading...</pre>
    </div>
  `;
}

export function bindTokens() {
  const out = document.getElementById('tokenOut');
  const list = async () => {
    try {
      const data = await api('/api/tokens');
      out.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };

  document.getElementById('tokenAddBtn').onclick = async () => {
    try {
      const body = {
        symbol: document.getElementById('tokenSymbol').value.trim(),
        address: document.getElementById('tokenAddr').value.trim(),
        decimals: Number(document.getElementById('tokenDecimals').value.trim() || 18),
      };
      const data = await api('/api/tokens', 'POST', body);
      out.textContent = JSON.stringify(data, null, 2);
      await list();
    } catch (e) {
      out.textContent = e.message;
    }
  };

  document.getElementById('tokenListBtn').onclick = list;
  list();
}
