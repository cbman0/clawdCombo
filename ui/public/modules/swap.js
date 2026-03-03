import { api } from './api.js';

export function swapView() {
  return `
    <div class="card">
      <h3>Swap Desk (Uniswap-like flow)</h3>
      <p class="muted">Step 1: quote, Step 2: dry-run execute, Step 3: live execute only if enabled server-side.</p>
      <label>From alias</label><input id="swapFromAlias" value="devA" />
      <label>Sell token (address or NATIVE)</label><input id="sellToken" value="NATIVE" />
      <label>Buy token (address)</label><input id="buyToken" placeholder="0x..." />
      <label>Sell amount (base units)</label><input id="sellAmount" placeholder="1000000000000000" />
      <label>Taker address (quote only)</label><input id="takerAddress" placeholder="0x..." />
      <label>Slippage Bps</label><input id="slippageBps" value="100" />
      <button id="quoteBtn">Get Swap Quote</button>
      <button id="swapDryBtn">Dry-run Execute</button>
      <button id="swapLiveBtn">Live Execute</button>
      <pre id="swapOut">No swap data yet.</pre>
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

  document.getElementById('swapDryBtn').onclick = async () => {
    try {
      const result = await api('/api/swap/execute', 'POST', {
        fromAlias: document.getElementById('swapFromAlias').value.trim() || 'devA',
        sellToken: document.getElementById('sellToken').value.trim(),
        buyToken: document.getElementById('buyToken').value.trim(),
        sellAmount: document.getElementById('sellAmount').value.trim(),
        slippageBps: Number(document.getElementById('slippageBps').value.trim() || 100),
        dryRun: true,
      });
      out.textContent = JSON.stringify(result, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };

  document.getElementById('swapLiveBtn').onclick = async () => {
    try {
      const result = await api('/api/swap/execute', 'POST', {
        fromAlias: document.getElementById('swapFromAlias').value.trim() || 'devA',
        sellToken: document.getElementById('sellToken').value.trim(),
        buyToken: document.getElementById('buyToken').value.trim(),
        sellAmount: document.getElementById('sellAmount').value.trim(),
        slippageBps: Number(document.getElementById('slippageBps').value.trim() || 100),
        dryRun: false,
      });
      out.textContent = JSON.stringify(result, null, 2);
    } catch (e) {
      out.textContent = e.message;
    }
  };
}
