import { statusView, bindStatus } from './status.js';
import { walletsView, bindWallets } from './wallets.js';
import { tokensView, bindTokens } from './tokens.js';
import { transferView, bindTransfer } from './transfer.js';
import { portfolioView, bindPortfolio } from './portfolio.js';
import { catalogView, bindCatalog } from './catalog.js';
import { oraclesView, bindOracles } from './oracles.js';
import { swapView, bindSwap } from './swap.js';
import { arbView, bindArb } from './arb.js';
import { historyView, bindHistory } from './history.js';
import { comboView, bindCombo } from './combo.js';
import { getMode, modeToggleView, bindModeToggle } from './mode.js';
import { initToasts } from './notify.js';

class ClawdComboApp {
  mount(rootId = 'app') {
    const root = document.getElementById(rootId);
    const mode = getMode();

    root.innerHTML = `
      ${modeToggleView()}
      ${mode === 'easy' ? '<p class="muted">Easy Mode shows the core trading desk. Switch to Advanced for arbitrage/oracle/history tooling.</p>' : ''}
      <div class="grid">
        ${swapView(mode)}
        ${portfolioView()}
        ${statusView()}
        ${walletsView()}
        ${tokensView()}
        ${transferView()}
        ${catalogView()}
        ${comboView()}
        ${mode === 'advanced' ? oraclesView() : ''}
        ${mode === 'advanced' ? arbView() : ''}
        ${mode === 'advanced' ? historyView() : ''}
      </div>
    `;

    initToasts();
    bindModeToggle(() => this.mount(rootId));
    bindSwap(mode);
    bindPortfolio();
    bindStatus();
    bindWallets();
    bindTokens();
    bindTransfer();
    bindCatalog();
    bindCombo();

    if (mode === 'advanced') {
      bindOracles();
      bindArb();
      bindHistory();
    }
  }
}

new ClawdComboApp().mount();
