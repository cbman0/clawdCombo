const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying core contracts with account:', deployer.address);

  // Deploy AdapterRegistry
  console.log('\nDeploying AdapterRegistry...');
  const Registry = await ethers.getContractFactory('AdapterRegistry');
  const registry = await Registry.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log('AdapterRegistry deployed to:', registryAddress);

  // Deploy Router
  console.log('\nDeploying Router...');
  const Router = await ethers.getContractFactory('Router');
  const router = await Router.deploy(registryAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log('Router deployed to:', routerAddress);

  console.log('\n=== Core Contracts Deployment Summary ===');
  console.log(`Registry: ${registryAddress}`);
  console.log(`Router: ${routerAddress}`);
  console.log('\nNext steps:');
  console.log('1. Deploy adapters using: npm run deploy:adapters:<network>');
  console.log(
    '2. After adapters are deployed, register them via registry.setAdapter(adapterAddress, true)'
  );
  console.log(
    '3. Transfer registry ownership to a multisig or admin if desired: registry.transferOwnership(newOwner)'
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Core deployment failed:', error);
    process.exit(1);
  });
