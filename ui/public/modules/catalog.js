import { api } from './api.js';

export function catalogView() {
  return `
    <div class="card">
      <h3>Top 200 Crypto Catalog</h3>
      <p class="muted">Market-cap top 200 from CoinGecko (name, symbol, price, rank, icon URL).</p>
      <button id="catalogSyncBtn">Sync Top 200 Now</button>
      <button id="catalogLoadBtn">Load Cached Catalog</button>
      <label>Filter by symbol/name</label>
      <input id="catalogFilter" placeholder="e.g. ETH" />
      <pre id="catalogOut">No catalog data yet.</pre>
    </div>
  `;
}

export function bindCatalog() {
  const out = document.getElementById('catalogOut');
  let cached = [];

  const render = (items) => {
    const filter = document.getElementById('catalogFilter').value.trim().toLowerCase();
    const filtered = !filter
      ? items
      : items.filter(
          (i) => i.symbol.toLowerCase().includes(filter) || i.name.toLowerCase().includes(filter)
        );
    out.textContent = JSON.stringify({ count: filtered.length, items: filtered.slice(0, 200) }, null, 2);
  };

  const load = async () => {
    try {
      const data = await api('/api/catalog/top200');
      cached = data.items || [];
      out.textContent = JSON.stringify({ generatedAt: data.generatedAt, count: data.count, preview: cached.slice(0, 20) }, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };

  document.getElementById('catalogSyncBtn').onclick = async () => {
    try {
      const data = await api('/api/catalog/top200/sync', 'POST');
      cached = data.items || [];
      out.textContent = JSON.stringify({ generatedAt: data.generatedAt, count: data.count, preview: cached.slice(0, 20) }, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };

  document.getElementById('catalogLoadBtn').onclick = load;
  document.getElementById('catalogFilter').oninput = () => render(cached);
  load();
}
