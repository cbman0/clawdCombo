import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("Router + AdapterRegistry", function () {
  it("reverts when adapter is not allowlisted", async function () {
    const [owner] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("AdapterRegistry");
    const registry = await Registry.deploy(owner.address);
    await registry.waitForDeployment();

    const Router = await ethers.getContractFactory("Router");
    const router = await Router.deploy(await registry.getAddress());
    await router.waitForDeployment();

    const fakeAdapter = "0x000000000000000000000000000000000000dEaD";

    await expect(
      router.execute([
        {
          adapter: fakeAdapter,
          data: "0x",
          value: 0,
        },
      ])
    ).to.be.revertedWith("ADAPTER_NOT_ALLOWED");
  });
});
