const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  console.log("deployer:", deployer.address);

  const Registry = await ethers.getContractFactory("AdapterRegistry");
  const registry = await Registry.deploy(deployer.address);
  await registry.waitForDeployment();
  console.log("registry:", await registry.getAddress());

  const Router = await ethers.getContractFactory("Router");
  const router = await Router.deploy(await registry.getAddress());
  await router.waitForDeployment();
  console.log("router:", await router.getAddress());

  const MockAdapter = await ethers.getContractFactory("MockAdapter");
  const mock = await MockAdapter.deploy();
  await mock.waitForDeployment();
  const mockAddr = await mock.getAddress();
  console.log("mockAdapter:", mockAddr);

  const allowTx = await registry.setAdapter(mockAddr, true);
  await allowTx.wait();
  console.log("adapter allowlisted");

  const payload = ethers.hexlify(ethers.toUtf8Bytes("first-combo-step"));
  const execTx = await router.execute([
    { adapter: mockAddr, data: payload, value: 0 },
  ]);
  const receipt = await execTx.wait();

  console.log("combo executed tx:", receipt.hash);
  console.log("gas used:", receipt.gasUsed.toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
