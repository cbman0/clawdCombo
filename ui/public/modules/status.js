import { api } from './api.js';

export function statusView() {
  return `
    <div class="card">
      <h3>System Status</h3>
      <button id="statusRefreshBtn">Refresh</button>
      <pre id="statusOut">loading...</pre>
    </div>
  `;
}

export function bindStatus() {
  const out = document.getElementById('statusOut');
  const load = async () => {
    try {
      const data = await api('/api/status');
      out.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };
  document.getElementById('statusRefreshBtn').onclick = load;
  load();
}
