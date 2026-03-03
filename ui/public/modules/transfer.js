import { api } from './api.js';
import { toast } from './notify.js';

export function transferView() {
  return `
    <div class="card">
      <h3>Transfer (CLI-backed)</h3>
      <label>From alias</label><input id="fromAlias" value="devA" />
      <label>To alias</label><input id="toAlias" value="devB" />
      <label>Preset</label>
      <select id="preset">
        <option value="low">low (0.0001)</option>
        <option value="medium" selected>medium (0.001)</option>
        <option value="high">high (0.002)</option>
      </select>
      <label>Custom amount POL (optional)</label><input id="amountPol" placeholder="0.0007" />
      <button id="sendTxBtn">Send Transfer</button>
      <pre id="transferOut">No transfer yet.</pre>
    </div>
  `;
}

export function bindTransfer() {
  const out = document.getElementById('transferOut');
  document.getElementById('sendTxBtn').onclick = async () => {
    try {
      const body = {
        fromAlias: document.getElementById('fromAlias').value.trim(),
        toAlias: document.getElementById('toAlias').value.trim(),
        preset: document.getElementById('preset').value,
        amountPol: document.getElementById('amountPol').value.trim() || undefined,
      };
      const result = await api('/api/transfer', 'POST', body);
      out.textContent = JSON.stringify(result, null, 2);
      toast('Transfer submitted', 'success');
    } catch (e) {
      out.textContent = e.message;
      toast(`Transfer failed: ${e.message}`, 'error');
    }
  };
}
