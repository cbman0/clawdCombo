import { statusView, bindStatus } from './status.js';
import { walletsView, bindWallets } from './wallets.js';
import { tokensView, bindTokens } from './tokens.js';
import { transferView, bindTransfer } from './transfer.js';
import { portfolioView, bindPortfolio } from './portfolio.js';
import { oraclesView, bindOracles } from './oracles.js';
import { swapView, bindSwap } from './swap.js';
import { arbView, bindArb } from './arb.js';
import { historyView, bindHistory } from './history.js';

class ClawdComboApp {
  mount(rootId = 'app') {
    const root = document.getElementById(rootId);
    root.innerHTML = `
      <div class="grid">
        ${statusView()}
        ${walletsView()}
        ${tokensView()}
        ${transferView()}
        ${portfolioView()}
        ${oraclesView()}
        ${swapView()}
        ${arbView()}
        ${historyView()}
      </div>
    `;

    bindStatus();
    bindWallets();
    bindTokens();
    bindTransfer();
    bindPortfolio();
    bindOracles();
    bindSwap();
    bindArb();
    bindHistory();
  }
}

new ClawdComboApp().mount();
