import { statusView, bindStatus } from './status.js';
import { walletsView, bindWallets } from './wallets.js';
import { transferView, bindTransfer } from './transfer.js';
import { portfolioView, bindPortfolio } from './portfolio.js';
import { swapView, bindSwap } from './swap.js';
import { historyView, bindHistory } from './history.js';

class ClawdComboApp {
  mount(rootId = 'app') {
    const root = document.getElementById(rootId);
    root.innerHTML = `
      <div class="grid">
        ${statusView()}
        ${walletsView()}
        ${transferView()}
        ${portfolioView()}
        ${swapView()}
        ${historyView()}
      </div>
    `;

    bindStatus();
    bindWallets();
    bindTransfer();
    bindPortfolio();
    bindSwap();
    bindHistory();
  }
}

new ClawdComboApp().mount();
