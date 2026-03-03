import { api } from './api.js';

export function walletsView() {
  return `
    <div class="card">
      <h3>Wallets</h3>
      <label>New alias</label>
      <input id="walletAlias" placeholder="devA" />
      <button id="walletCreateBtn">Create Wallet</button>
      <button id="walletRefreshBtn">Refresh Wallet List</button>
      <pre id="walletOut">loading...</pre>
    </div>
  `;
}

export function bindWallets() {
  const out = document.getElementById('walletOut');
  const refresh = async () => {
    try {
      const data = await api('/api/wallet/list');
      out.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };

  document.getElementById('walletCreateBtn').onclick = async () => {
    const alias = document.getElementById('walletAlias').value.trim();
    try {
      const result = await api('/api/wallet/create', 'POST', { alias });
      out.textContent = JSON.stringify(result, null, 2);
      await refresh();
    } catch (e) {
      out.textContent = e.message;
    }
  };

  document.getElementById('walletRefreshBtn').onclick = refresh;
  refresh();
}
