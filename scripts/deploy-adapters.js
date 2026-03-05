const { ethers } = require("hardhat");
const networks = require("../config/networks");

async function main() {
  const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
  const networkName = (await ethers.provider.getNetwork()).name;

  let config;
  if (chainId === 1) {
    config = networks.MAINNET;
    console.log("Deploying to Ethereum Mainnet");
  } else if (chainId === 137) {
    config = networks.AMOY;
    console.log("Deploying to Polygon Amoy");
  } else if (chainId === 11155111) {
    config = networks.SEPOLIA;
    console.log("Deploying to Ethereum Sepolia");
  } else {
    throw new Error(`Unsupported network: ${chainId}`);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy UniswapV3Adapter
  console.log("\nDeploying UniswapV3Adapter...");
  const UniswapV3Adapter = await ethers.getContractFactory("UniswapV3Adapter");
  const uniswapV3Adapter = await UniswapV3Adapter.deploy(
    config.uniswapV3.factory,
    config.uniswapV3.weth,
    deployer.address // initial owner
  );
  await uniswapV3Adapter.waitForDeployment();
  const uniswapV3Address = await uniswapV3Adapter.getAddress();
  console.log("UniswapV3Adapter deployed to:", uniswapV3Address);

  // Deploy OneInchAdapter
  console.log("\nDeploying OneInchAdapter...");
  const OneInchAdapter = await ethers.getContractFactory("OneInchAdapter");
  const oneInchAdapter = await OneInchAdapter.deploy(
    config.oneInch.aggregationRouter,
    config.oneInch.weth,
    deployer.address
  );
  await oneInchAdapter.waitForDeployment();
  const oneInchAddress = await oneInchAdapter.getAddress();
  console.log("OneInchAdapter deployed to:", oneInchAddress);

  // Deploy AaveV3FlashloanAdapter
  console.log("\nDeploying AaveV3FlashloanAdapter...");
  const AaveV3FlashloanAdapter = await ethers.getContractFactory("AaveV3FlashloanAdapter");
  const aaveV3FlashloanAdapter = await AaveV3FlashloanAdapter.deploy(
    config.aaveV3.pool,
    config.aaveV3.weth,
    deployer.address
  );
  await aaveV3FlashloanAdapter.waitForDeployment();
  const aaveV3Address = await aaveV3FlashloanAdapter.getAddress();
  console.log("AaveV3FlashloanAdapter deployed to:", aaveV3Address);

  console.log("\n=== Deployment Summary ===");
  console.log(`Network: ${networkName} (chainId: ${chainId})`);
  console.log(`UniswapV3Adapter: ${uniswapV3Address}`);
  console.log(`OneInchAdapter: ${oneInchAddress}`);
  console.log(`AaveV3FlashloanAdapter: ${aaveV3Address}`);
  console.log("\nDeployer address:", deployer.address);
  console.log("\nNext steps:");
  console.log("1. Verify contracts on Etherscan (or block explorer)");
  console.log("2. Transfer ownership to multisig if desired");
  console.log("3. Register adapters in AdapterRegistry with setAdapter(true)");
  console.log("4. Test with small trades before production use");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });