import { api } from './api.js';

export function historyView() {
  return `
    <div class="card">
      <h3>Transaction History</h3>
      <button id="historyRefreshBtn">Refresh</button>
      <pre id="historyOut">loading...</pre>
    </div>
  `;
}

export function bindHistory() {
  const out = document.getElementById('historyOut');
  const load = async () => {
    try {
      const data = await api('/api/tx/history');
      out.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };
  document.getElementById('historyRefreshBtn').onclick = load;
  load();
}
