const { ethers } = require("hardhat");

async function verifyContract(address, constructorArgs) {
  try {
    console.log(`Verifying ${address}...`);
    await ethers.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });
    console.log(`✓ Verified: ${address}`);
  } catch (error) {
    console.error(`✗ Verification failed for ${address}:`, error.message);
  }
}

async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const networks = require("../config/networks");
  const config = networks.getNetworkConfig(chainId === 1 ? 'mainnet' : chainId === 137 ? 'amoy' : 'sepolia');

  console.log("Starting contract verification...");
  console.log("Make sure your Etherscan/Polygonscan API key is set in .env");

  // These addresses should be set after deployment
  const uniswapAddress = process.env.UNISWAP_V3_ADAPTER_ADDRESS;
  const oneInchAddress = process.env.ONE_INCH_ADAPTER_ADDRESS;
  const aaveAddress = process.env.AAVE_V3_ADAPTER_ADDRESS;

  if (!uniswapAddress || !oneInchAddress || !aaveAddress) {
    console.error("Error: Please set adapter addresses in .env file:");
    console.error("  UNISWAP_V3_ADAPTER_ADDRESS=0x...");
    console.error("  ONE_INCH_ADAPTER_ADDRESS=0x...");
    console.error("  AAVE_V3_ADAPTER_ADDRESS=0x...");
    process.exit(1);
  }

  await verifyContract(uniswapAddress, [
    config.uniswapV3.factory,
    config.uniswapV3.weth,
    // owner is the deployer (last arg) - hardhat verifies automatically if set correctly
  ]);

  // For contracts with constructor args, we need to pass them correctly
  await verifyContract(oneInchAddress, [
    config.oneInch.aggregationRouter,
    config.oneInch.weth,
  ]);

  await verifyContract(aaveAddress, [
    config.aaveV3.pool,
    config.aaveV3.weth,
  ]);

  console.log("\nVerification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });