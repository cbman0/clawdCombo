import { api } from './api.js';
import { toast } from './notify.js';

export function swapView(mode = 'easy') {
  const isAdvanced = mode === 'advanced';
  return `
    <div class="card feature-card swap-card">
      <div class="section-head">
        <div>
          <h3>Swap Desk</h3>
          <p class="muted">Uniswap-style token swap flow with cleaner guardrails. Quote first, then simulate or execute.</p>
        </div>
        <span class="pill ${isAdvanced ? 'pill-live' : 'pill-safe'}">${isAdvanced ? 'Advanced • Live option unlocked' : 'Easy • Simulation only'}</span>
      </div>

      <div class="row">
        <div>
          <label>Wallet Alias</label><input id="swapFromAlias" value="devA" placeholder="devA" />
        </div>
        <div>
          <label>Taker Address (for quote)</label><input id="takerAddress" placeholder="0x..." />
        </div>
      </div>

      <div class="token-stack">
        <div>
          <label>Sell Token</label><input id="sellToken" value="NATIVE" placeholder="NATIVE or 0x..." />
        </div>
        <div class="swap-divider">↓</div>
        <div>
          <label>Buy Token</label><input id="buyToken" placeholder="0x..." />
        </div>
      </div>

      <div class="row">
        <div>
          <label>Sell Amount (base units)</label><input id="sellAmount" placeholder="1000000000000000" />
        </div>
        <div>
          <label>Slippage (bps)</label><input id="slippageBps" value="100" ${isAdvanced ? '' : 'disabled'} />
        </div>
      </div>

      <div class="row">
        <button id="quoteBtn" class="alt">Get Quote</button>
        <button id="swapDryBtn">Run Dry Swap</button>
      </div>
      ${isAdvanced ? '<button id="swapLiveBtn">Execute Live Swap</button>' : ''}
      <pre id="swapOut" class="state-panel">Waiting for quote or swap action.
Tip: start with “Get Quote” to verify route + expected output.</pre>
    </div>
  `;
}

export function bindSwap(mode = 'easy') {
  const isAdvanced = mode === 'advanced';
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
      toast('Swap quote fetched', 'success');
    } catch (e) {
      out.textContent = e.message;
      toast(`Swap quote failed: ${e.message}`, 'error');
    }
  };

  document.getElementById('swapDryBtn').onclick = async () => {
    try {
      const slippageValue = document.getElementById('slippageBps')?.value || '100';
      const result = await api('/api/swap/execute', 'POST', {
        fromAlias: document.getElementById('swapFromAlias').value.trim() || 'devA',
        sellToken: document.getElementById('sellToken').value.trim(),
        buyToken: document.getElementById('buyToken').value.trim(),
        sellAmount: document.getElementById('sellAmount').value.trim(),
        slippageBps: Number(slippageValue.trim() || 100),
        dryRun: true,
      });
      out.textContent = JSON.stringify(result, null, 2);
      toast('Swap dry-run completed', 'success');
    } catch (e) {
      out.textContent = e.message;
      toast(`Swap dry-run failed: ${e.message}`, 'error');
    }
  };

  if (isAdvanced) {
    document.getElementById('swapLiveBtn').onclick = async () => {
      try {
        const slippageValue = document.getElementById('slippageBps')?.value || '100';
        const result = await api('/api/swap/execute', 'POST', {
          fromAlias: document.getElementById('swapFromAlias').value.trim() || 'devA',
          sellToken: document.getElementById('sellToken').value.trim(),
          buyToken: document.getElementById('buyToken').value.trim(),
          sellAmount: document.getElementById('sellAmount').value.trim(),
          slippageBps: Number(slippageValue.trim() || 100),
          dryRun: false,
        });
        out.textContent = JSON.stringify(result, null, 2);
        toast('Swap live execution submitted', 'success');
      } catch (e) {
        out.textContent = e.message;
        toast(`Swap live execution failed: ${e.message}`, 'error');
      }
    };
  }
}
