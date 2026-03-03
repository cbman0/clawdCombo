const { spawn } = require('child_process');
const path = require('path');

const electronBin = require('electron');
const appMain = path.join(__dirname, 'main.js');

const child = spawn(electronBin, [appMain], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));
