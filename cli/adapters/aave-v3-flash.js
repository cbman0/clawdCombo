const AAVE_V3_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";

const FLASH_ASSETS = {
  USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  DAI:  "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
  WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
  WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
};

function resolveFlashAsset(symbol) {
  const addr = FLASH_ASSETS[symbol?.toUpperCase()];
  if (!addr) throw new Error(`unknown flash asset: ${symbol}. Supported: ${Object.keys(FLASH_ASSETS).join(', ')}`);
  return addr;
}

function buildFlashloanParams({ asset, amount, receiverAddress }) {
  if (!asset || !amount || !receiverAddress) {
    throw new Error("asset, amount, receiverAddress are required");
  }
  const assetAddress = resolveFlashAsset(asset);
  return {
    adapter: "aave-v3-flash",
    pool: AAVE_V3_POOL,
    asset: assetAddress,
    assetSymbol: asset.toUpperCase(),
    amount: String(amount),
    receiverAddress,
    mode: 0,
    referralCode: 0,
    status: "params-built",
    note: "Ready for on-chain FlashLoan call via Pool contract",
  };
}

module.exports = { buildFlashloanParams, resolveFlashAsset, AAVE_V3_POOL, FLASH_ASSETS };
