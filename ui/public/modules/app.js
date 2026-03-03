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

class ClawdComboApp {
  mount(rootId = 'app') {
    const root = document.getElementById(rootId);
    const mode = getMode();

    root.innerHTML = `
      ${modeToggleView()}
      <div class="grid">
        ${statusView()}
        ${walletsView()}
        ${tokensView()}
        ${transferView()}
        ${portfolioView()}
        ${catalogView()}
        ${oraclesView()}
        ${swapView(mode)}
        ${arbView()}
        ${historyView()}
      </div>
    `;

    bindModeToggle(() => this.mount(rootId));
    bindStatus();
    bindWallets();
    bindTokens();
    bindTransfer();
    bindPortfolio();
    bindCatalog();
    bindOracles();
    bindSwap(mode);
    bindArb();
    bindHistory();
  }
}

new ClawdComboApp().mount();
