// Mainnet and testnet address configurations for adapters
// Source addresses should be verified from official docs

const MAINNET = {
  uniswapV3: {
    factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    quoter: "0xb27308f9F90D607463bb33eA1Beb41EF1594bA0A",
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    feeTiers: [500, 3000, 10000],
  },
  oneInch: {
    aggregationRouter: "0x1111111254EEB25477B68fb85Ed929f73A960582",
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    version: "5.0",
  },
  aaveV3: {
    pool: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  common: {
    chainId: 1,
    gasLimit: 800000,
    maxPriorityFeePerGas: 2,
    maxFeePerGas: 100,
  },
};

const AMOY = {
  uniswapV3: {
    factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984", // Same factory on all chains
    quoter: "0xb27308f9F90D607463bb33eA1Beb41EF1594bA0A",
    weth: "0x0d043cE46080eC5565703719458f9eA2C4417f5B", // Amoy WETH (replace with actual)
    feeTiers: [500, 3000, 10000],
  },
  oneInch: {
    aggregationRouter: "0x1111111254EEB25477B68fb85Ed929f73A960582", // 1inch v5 router may differ on Polygon
    weth: "0x0d043cE46080eC5565703719458f9eA2C4417f5B",
    version: "5.0",
  },
  aaveV3: {
    pool: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", // Aave V3 pool on Amoy (verify)
    weth: "0x0d043cE46080eC5565703719458f9eA2C4417f5B",
  },
  common: {
    chainId: 137, // Polygon Amoy testnet
    gasLimit: 800000,
    maxPriorityFeePerGas: 2,
    maxFeePerGas: 100,
  },
};

const SEPOLIA = {
  uniswapV3: {
    factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    quoter: "0xb27308f9F90D607463bb33eA1Beb41EF1594bA0A",
    weth: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // Sepolia WETH
    feeTiers: [500, 3000, 10000],
  },
  oneInch: {
    aggregationRouter: "0x1111111254EEB25477B68fb85Ed929f73A960582",
    weth: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    version: "5.0",
  },
  aaveV3: {
    pool: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", // Verify for Sepolia
    weth: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  },
  common: {
    chainId: 11155111,
    gasLimit: 800000,
    maxPriorityFeePerGas: 2,
    maxFeePerGas: 100,
  },
};

// Export based on network name
function getNetworkConfig(network) {
  switch (network) {
    case 'mainnet':
      return MAINNET;
    case 'amoy':
      return AMOY;
    case 'sepolia':
      return SEPOLIA;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

module.exports = {
  MAINNET,
  AMOY,
  SEPOLIA,
  getNetworkConfig,
};