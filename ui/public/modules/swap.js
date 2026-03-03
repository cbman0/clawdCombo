import { api } from './api.js';
import { toast } from './notify.js';

export function swapView(mode = 'easy') {
  const isAdvanced = mode === 'advanced';
  return `
    <div class="card">
      <h3>Swap Desk</h3>
      <p class="muted">Uniswap-style two token flow. Quote first, then dry-run execute. Live execution stays guarded by backend env.</p>

      <div class="row">
        <div>
          <label>From alias</label><input id="swapFromAlias" value="devA" />
        </div>
        <div>
          <label>Taker address (quote)</label><input id="takerAddress" placeholder="0x..." />
        </div>
      </div>

      <div class="row">
        <div>
          <label>Sell token (address or NATIVE)</label><input id="sellToken" value="NATIVE" />
        </div>
        <div>
          <label>Buy token (address)</label><input id="buyToken" placeholder="0x..." />
        </div>
      </div>

      <div class="row">
        <div>
          <label>Sell amount (base units)</label><input id="sellAmount" placeholder="1000000000000000" />
        </div>
        <div>
          <label>Slippage (bps)</label><input id="slippageBps" value="100" ${isAdvanced ? '' : 'disabled'} />
        </div>
      </div>

      <div class="row">
        <button id="quoteBtn" class="alt">Get Swap Quote</button>
        <button id="swapDryBtn">Dry-run Execute</button>
      </div>
      ${isAdvanced ? '<button id="swapLiveBtn">Live Execute</button>' : ''}
      <pre id="swapOut">No swap data yet.</pre>
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
