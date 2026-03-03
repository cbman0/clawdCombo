const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('clawdComboDesktop', {
  version: '0.1.0',
  mode: 'desktop',
});
