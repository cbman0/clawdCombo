import { api } from './api.js';

export function swapView() {
  return `
    <div class="card">
      <h3>Swap Quote (Uniswap-capable UX via aggregator quote)</h3>
      <p class="muted">Fetches swap route/price quote on Amoy. Execution wiring can be added next.</p>
      <label>Sell token (address or native placeholder)</label><input id="sellToken" placeholder="0x..." />
      <label>Buy token (address)</label><input id="buyToken" placeholder="0x..." />
      <label>Sell amount (base units)</label><input id="sellAmount" placeholder="1000000000000000" />
      <label>Taker address</label><input id="takerAddress" placeholder="0x..." />
      <button id="quoteBtn">Get Swap Quote</button>
      <pre id="swapOut">No quote yet.</pre>
    </div>
  `;
}

export function bindSwap() {
  const out = document.getElementById('swapOut');
  document.getElementById('quoteBtn').onclick = async () => {
    try {
      const result = await api('/api/swap/quote', 'POST', {
        sellToken: document.getElementById('sellToken').value.trim(),
        buyToken: document.getElementById('buyToken').value.trim(),
        amount: document.getElementById('sellAmount').value.trim(),
        takerAddress: document.getElementById('takerAddress').value.trim(),
      });
      out.textContent = JSON.stringify(result, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };
}
