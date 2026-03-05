const { ethers } = require('hardhat');
const networks = require('../config/networks');

async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const networkName = (await ethers.provider.getNetwork()).name;

  let config;
  if (chainId === 1) {
    config = networks.MAINNET;
    console.log('Deploying to Ethereum Mainnet');
  } else if (chainId === 137) {
    config = networks.AMOY;
    console.log('Deploying to Polygon Amoy');
  } else if (chainId === 11155111) {
    config = networks.SEPOLIA;
    console.log('Deploying to Ethereum Sepolia');
  } else {
    throw new Error(`Unsupported network: ${chainId}`);
  }

  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  // 1. Deploy core contracts (if not already)
  console.log('\n=== Deploying Core Contracts ===');
  const Registry = await ethers.getContractFactory('AdapterRegistry');
  const registry = await Registry.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log('AdapterRegistry:', registryAddress);

  const Router = await ethers.getContractFactory('Router');
  const router = await Router.deploy(registryAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log('Router:', routerAddress);

  // 2. Deploy adapters
  console.log('\n=== Deploying Adapters ===');
  const UniswapV3Adapter = await ethers.getContractFactory('UniswapV3Adapter');
  const uniswapV3Adapter = await UniswapV3Adapter.deploy(
    config.uniswapV3.factory,
    config.uniswapV3.weth,
    deployer.address
  );
  await uniswapV3Adapter.waitForDeployment();
  const uniswapV3Address = await uniswapV3Adapter.getAddress();
  console.log('UniswapV3Adapter:', uniswapV3Address);

  const OneInchAdapter = await ethers.getContractFactory('OneInchAdapter');
  const oneInchAdapter = await OneInchAdapter.deploy(
    config.oneInch.aggregationRouter,
    config.oneInch.weth,
    deployer.address
  );
  await oneInchAdapter.waitForDeployment();
  const oneInchAddress = await oneInchAdapter.getAddress();
  console.log('OneInchAdapter:', oneInchAddress);

  const AaveV3FlashloanAdapter = await ethers.getContractFactory(
    'AaveV3FlashloanAdapter'
  );
  const aaveV3FlashloanAdapter = await AaveV3FlashloanAdapter.deploy(
    config.aaveV3.pool,
    config.aaveV3.weth,
    deployer.address
  );
  await aaveV3FlashloanAdapter.waitForDeployment();
  const aaveV3Address = await aaveV3FlashloanAdapter.getAddress();
  console.log('AaveV3FlashloanAdapter:', aaveV3Address);

  // 3. Register adapters
  console.log('\n=== Registering Adapters ===');
  const register = async (adapterAddr) => {
    const tx = await registry.setAdapter(adapterAddr, true);
    await tx.wait();
    console.log(`Registered ${adapterAddr}`);
  };
  await register(uniswapV3Address);
  await register(oneInchAddress);
  await register(aaveV3Address);

  console.log('\n=== Full Deployment Summary ===');
  console.log(`Network: ${networkName} (chainId: ${chainId})`);
  console.log(`AdapterRegistry: ${registryAddress}`);
  console.log(`Router: ${routerAddress}`);
  console.log(`UniswapV3Adapter: ${uniswapV3Address}`);
  console.log(`OneInchAdapter: ${oneInchAddress}`);
  console.log(`AaveV3FlashloanAdapter: ${aaveV3Address}`);
  console.log('\nDeployer address:', deployer.address);
  console.log('\nNext steps:');
  console.log(
    '1. Verify contracts on block explorer using: npm run verify:adapters'
  );
  console.log(
    '2. Consider transferring registry ownership to a multisig: registry.transferOwnership(newOwner)'
  );
  console.log(
    '3. Update application configuration with these addresses if needed.'
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Full deployment failed:', error);
    process.exit(1);
  });
