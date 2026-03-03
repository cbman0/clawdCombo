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
import { getMode, modeToggleView, bindModeToggle } from './mode.js';
import { initToasts } from './notify.js';

class ClawdComboApp {
  mount(rootId = 'app') {
    const root = document.getElementById(rootId);
    const mode = getMode();

    root.innerHTML = `
      ${modeToggleView()}
      ${mode === 'easy' ? '<p class="muted">Easy Mode: advanced analytics panels are hidden for a cleaner GUI. Switch to Advanced anytime.</p>' : ''}
      <div class="grid">
        ${statusView()}
        ${walletsView()}
        ${tokensView()}
        ${transferView()}
        ${portfolioView()}
        ${catalogView()}
        ${swapView(mode)}
        ${mode === 'advanced' ? oraclesView() : ''}
        ${mode === 'advanced' ? arbView() : ''}
        ${mode === 'advanced' ? historyView() : ''}
      </div>
    `;

    initToasts();
    bindModeToggle(() => this.mount(rootId));
    bindStatus();
    bindWallets();
    bindTokens();
    bindTransfer();
    bindPortfolio();
    bindCatalog();
    bindSwap(mode);

    if (mode === 'advanced') {
      bindOracles();
      bindArb();
      bindHistory();
    }
  }
}

new ClawdComboApp().mount();
