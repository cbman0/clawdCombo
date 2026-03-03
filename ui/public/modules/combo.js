import { toast } from './notify.js';

const STORAGE_KEY = 'clawdcombo:strategyDraft';

function defaultDraft() {
  return {
    name: 'flash-arb-starter',
    chain: 'polygon-amoy',
    flashloan: { provider: 'aave-v3', asset: 'USDC', amount: '1000' },
    actions: [
      { type: 'swap', dex: 'uniswap-v3', from: 'USDC', to: 'WETH', slippageBps: 80 },
      { type: 'swap', dex: '1inch', from: 'WETH', to: 'USDC', slippageBps: 80 }
    ],
    repay: { asset: 'USDC' }
  };
}

export function comboView() {
  return `
    <div class="card feature-card strategy-card">
      <div class="section-head">
        <div>
          <h3>Strategy Composer</h3>
          <p class="muted">Furucombo-inspired planning lane. Draft your flashloan pipeline JSON, save locally, then validate structure.</p>
        </div>
        <span class="pill pill-accent">Local Draft Mode</span>
      </div>

      <div class="row">
        <div>
          <label>Strategy Name</label>
          <input id="comboName" placeholder="flash-arb-starter" />
        </div>
        <div>
          <label>Target Chain</label>
          <input id="comboChain" placeholder="polygon-amoy" />
        </div>
      </div>

      <label>Pipeline JSON</label>
      <textarea id="comboJson" rows="12" placeholder="Paste or build strategy JSON here..."></textarea>
      <div class="row">
        <button id="comboTemplateBtn" class="alt">Load Starter</button>
        <button id="comboSaveBtn">Save Draft</button>
      </div>
      <button id="comboValidateBtn">Validate Strategy Shape</button>
      <pre id="comboOut" class="state-panel">No validation run yet.
Tip: click “Load Starter” to begin from a known-good baseline.</pre>
    </div>
  `;
}

export function bindCombo() {
  const out = document.getElementById('comboOut');
  const jsonEl = document.getElementById('comboJson');
  const nameEl = document.getElementById('comboName');
  const chainEl = document.getElementById('comboChain');

  const load = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const draft = stored ? JSON.parse(stored) : defaultDraft();
    nameEl.value = draft.name || '';
    chainEl.value = draft.chain || 'polygon-amoy';
    jsonEl.value = JSON.stringify(draft, null, 2);
  };

  document.getElementById('comboTemplateBtn').onclick = () => {
    const draft = defaultDraft();
    nameEl.value = draft.name;
    chainEl.value = draft.chain;
    jsonEl.value = JSON.stringify(draft, null, 2);
    toast('Loaded strategy starter template', 'info');
  };

  document.getElementById('comboSaveBtn').onclick = () => {
    try {
      const parsed = JSON.parse(jsonEl.value);
      parsed.name = nameEl.value.trim() || parsed.name;
      parsed.chain = chainEl.value.trim() || parsed.chain;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      out.textContent = JSON.stringify({ ok: true, saved: true, draft: parsed }, null, 2);
      toast('Strategy draft saved locally', 'success');
    } catch (e) {
      out.textContent = JSON.stringify({ ok: false, error: e.message }, null, 2);
      toast('Could not save strategy draft', 'error');
    }
  };

  document.getElementById('comboValidateBtn').onclick = () => {
    try {
      const parsed = JSON.parse(jsonEl.value);
      if (!parsed.flashloan || !Array.isArray(parsed.actions) || parsed.actions.length < 1) {
        throw new Error('strategy requires flashloan object and at least one action');
      }
      out.textContent = JSON.stringify({
        ok: true,
        checks: {
          hasFlashloan: true,
          actionCount: parsed.actions.length,
          hasRepay: !!parsed.repay,
        },
        next: 'Ready for compiler integration endpoint'
      }, null, 2);
      toast('Strategy shape validated', 'success');
    } catch (e) {
      out.textContent = JSON.stringify({ ok: false, error: e.message }, null, 2);
      toast('Validation failed', 'error');
    }
  };

  load();
}
