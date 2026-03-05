import { expect } from "chai";
import { ethers } from "hardhat";
import { MockERC20 } from "./mocks/MockERC20";

const networks = require("../config/networks");

describe("UniswapV3Adapter", function () {
  let adapter: any;
  let owner: any;
  let tokenA: any;
  let tokenB: any;
  const weth = networks.MAINNET.uniswapV3.weth;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const Mock = await ethers.getContractFactory("MockERC20");
    tokenA = await Mock.deploy();
    await tokenA.waitForDeployment();
    tokenB = await Mock.deploy();
    await tokenB.waitForDeployment();

    // Mint tokens to owner for transfers
    await tokenA.mint(owner.address, ethers.parseUnits("1000", 18));
    await tokenB.mint(owner.address, ethers.parseUnits("1000", 18));

    const UniswapV3Adapter = await ethers.getContractFactory("UniswapV3Adapter");
    adapter = await UniswapV3Adapter.deploy(
      networks.MAINNET.uniswapV3.factory,
      weth,
      owner.address
    );
    await adapter.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully with valid addresses", async function () {
      await expect(adapter).not.to.be.reverted;
    });

    it("Should store factory and WETH addresses", async function () {
      expect(await adapter.factory()).to.equal(networks.MAINNET.uniswapV3.factory);
      expect(await adapter.weth()).to.equal(weth);
    });

    it("Should have initial owner set correctly", async function () {
      expect(await adapter.owner()).to.equal(owner.address);
    });
  });

  describe("Pausable", function () {
    it("Should allow owner to pause and unpause", async function () {
      await adapter.pause();
      expect(await adapter.paused()).to.be.true;

      await adapter.unpause();
      expect(await adapter.paused()).to.be.false;
    });

    it("Should revert when paused", async function () {
      await adapter.pause();

      const amount = ethers.parseUnits("1", 18);
      const data = adapter.interface.encodeFunctionData("swapExactTokensForTokens", [
        amount,
        amount,
        tokenA.address,
        tokenB.address,
        3000,
        owner.address
      ]);

      await expect(
        adapter.execute(data, { value: 0 })
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should not allow non-owner to pause", async function () {
      const [nonOwner] = await ethers.getSigners();
      await expect(adapter.connect(nonOwner).pause()).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Error handling", function () {
    it("Should revert for zero token address", async function () {
      const data = adapter.interface.encodeFunctionData("swapExactTokensForTokens", [
        ethers.parseUnits("1", 18),
        ethers.parseUnits("1", 18),
        tokenA.address,
        ethers.ZeroAddress,
        3000,
        owner.address
      ]);

      await expect(adapter.execute(data)).to.be.revertedWithCustomError(adapter, "Adapter__InvalidToken");
    });

    it("Should revert for non-existent pool", async function () {
      const randomToken = "0x" + "1".repeat(40);
      const data = adapter.interface.encodeFunctionData("swapExactTokensForTokens", [
        ethers.parseUnits("1", 18),
        ethers.parseUnits("1", 18),
        randomToken,
        tokenB.address,
        3000,
        owner.address
      ]);

      await expect(adapter.execute(data)).to.be.revertedWithCustomError(adapter, "Adapter__PoolDoesNotExist");
    });

    it("Should revert for insufficient output", async function () {
      const amountIn = ethers.parseUnits("1", 18);
      const minAmountOut = ethers.parseUnits("999999", 18); // unreasonably high
      const data = adapter.interface.encodeFunctionData("swapExactTokensForTokens", [
        amountIn,
        minAmountOut,
        tokenA.address,
        tokenB.address,
        3000,
        owner.address
      ]);

      // Approve tokens
      await tokenA.approve(adapter.address, amountIn);

      await expect(adapter.execute(data)).to.be.revertedWithCustomError(adapter, "Adapter__InsufficientOutput");
    });

    it("Should revert for unsupported action", async function () {
      // Encode a fake action selector
      const data = "0x" + "00".repeat(4) + "00".repeat(32); // fake selector + padding
      await expect(adapter.execute(data)).to.be.revertedWithCustomError(adapter, "Adapter__UnsupportedAction");
    });
  });

  describe("Ownership", function () {
    it("Should transfer ownership correctly", async function () {
      const [newOwner] = await ethers.getSigners();
      await adapter.transferOwnership(newOwner.address);
      expect(await adapter.owner()).to.equal(newOwner.address);
    });

    it("Should not allow zero address ownership transfer", async function () {
      await expect(adapter.transferOwnership(ethers.ZeroAddress)).to.be.revertedWith("Ownable: new owner is the zero address");
    });

    it("Should only allow owner to transfer ownership", async function () {
      const [nonOwner] = await ethers.getSigners();
      await expect(adapter.connect(nonOwner).transferOwnership(owner.address)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});

describe("OneInchAdapter", function () {
  let adapter: any;
  let owner: any;
  let tokenA: any;
  let tokenB: any;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const Mock = await ethers.getContractFactory("MockERC20");
    tokenA = await Mock.deploy();
    await tokenA.waitForDeployment();
    tokenB = await Mock.deploy();
    await tokenB.waitForDeployment();

    await tokenA.mint(owner.address, ethers.parseUnits("1000", 18));
    await tokenB.mint(owner.address, ethers.parseUnits("1000", 18));

    const OneInchAdapter = await ethers.getContractFactory("OneInchAdapter");
    adapter = await OneInchAdapter.deploy(
      networks.MAINNET.oneInch.aggregationRouter,
      networks.MAINNET.oneInch.weth,
      owner.address
    );
    await adapter.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      await expect(adapter).not.to.be.reverted;
    });

    it("Should store router and WETH addresses", async function () {
      expect(await adapter.router()).to.equal(networks.MAINNET.oneInch.aggregationRouter);
      expect(await adapter.weth()).to.equal(networks.MAINNET.oneInch.weth);
    });
  });

  describe("Pausable", function () {
    it("Should allow owner to pause", async function () {
      await adapter.pause();
      expect(await adapter.paused()).to.be.true;
    });

    it("Should revert when paused", async function () {
      await adapter.pause();

      const data = adapter.interface.encodeFunctionData("swapExactTokensForTokens", [
        ethers.parseUnits("1", 18),
        ethers.parseUnits("1", 18),
        tokenA.address,
        tokenB.address,
        "0x",
        owner.address
      ]);

      await expect(adapter.execute(data)).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Error handling", function () {
    it("Should revert for invalid token addresses", async function () {
      const data = adapter.interface.encodeFunctionData("swapExactTokensForTokens", [
        ethers.parseUnits("1", 18),
        ethers.parseUnits("1", 18),
        ethers.ZeroAddress,
        tokenB.address,
        "0x",
        owner.address
      ]);

      await expect(adapter.execute(data)).to.be.revertedWithCustomError(adapter, "Adapter__InvalidToken");
    });
  });
});

describe("AaveV3FlashloanAdapter", function () {
  let adapter: any;
  let owner: any;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const AaveV3FlashloanAdapter = await ethers.getContractFactory("AaveV3FlashloanAdapter");
    adapter = await AaveV3FlashloanAdapter.deploy(
      networks.MAINNET.aaveV3.pool,
      networks.MAINNET.aaveV3.weth,
      owner.address
    );
    await adapter.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      await expect(adapter).not.to.be.reverted;
    });

    it("Should store pool and WETH addresses", async function () {
      expect(await adapter.pool()).to.equal(networks.MAINNET.aaveV3.pool);
      expect(await adapter.weth()).to.equal(networks.MAINNET.aaveV3.weth);
    });
  });

  describe("Pausable", function () {
    it("Should allow owner to pause", async function () {
      await adapter.pause();
      expect(await adapter.paused()).to.be.true;
    });
  });

  describe("Error handling", function () {
    it("Should revert for invalid token", async function () {
      const data = adapter.interface.encodeFunctionData("executeFlashLoan", [
        ethers.ZeroAddress,
        ethers.parseUnits("1", 18),
        "0x",
        0,
        owner.address
      ]);

      await expect(adapter.execute(data)).to.be.revertedWithCustomError(adapter, "Adapter__InvalidToken");
    });

    it("Should revert for zero amount", async function () {
      const token = networks.MAINNET.aaveV3.weth;
      const data = adapter.interface.encodeFunctionData("executeFlashLoan", [
        token,
        0,
        "0x",
        0,
        owner.address
      ]);

      await expect(adapter.execute(data)).to.be.revertedWithCustomError(adapter, "Adapter__InvalidToken");
    });
  });
});

describe("AdapterRegistry Integration", function () {
  let registry: any;
  let owner: any;
  let uniswapAdapter: any;
  let oneInchAdapter: any;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("AdapterRegistry");
    registry = await Registry.deploy(owner.address);
    await registry.waitForDeployment();

    const UniswapV3Adapter = await ethers.getContractFactory("UniswapV3Adapter");
    uniswapAdapter = await UniswapV3Adapter.deploy(
      networks.MAINNET.uniswapV3.factory,
      networks.MAINNET.uniswapV3.weth,
      owner.address
    );
    await uniswapAdapter.waitForDeployment();

    const OneInchAdapter = await ethers.getContractFactory("OneInchAdapter");
    oneInchAdapter = await OneInchAdapter.deploy(
      networks.MAINNET.oneInch.aggregationRouter,
      networks.MAINNET.oneInch.weth,
      owner.address
    );
    await oneInchAdapter.waitForDeployment();
  });

  it("Should allow owner to register adapters", async function () {
    await registry.setAdapter(await uniswapAdapter.getAddress(), true);
    expect(await registry.isAdapterAllowed(await uniswapAdapter.getAddress())).to.be.true;

    await registry.setAdapter(await oneInchAdapter.getAddress(), true);
    expect(await registry.isAdapterAllowed(await oneInchAdapter.getAddress())).to.be.true;
  });

  it("Should not allow non-owner to register", async function () {
    const [nonOwner] = await ethers.getSigners();
    await expect(
      registry.connect(nonOwner).setAdapter(await uniswapAdapter.getAddress(), true)
    ).to.be.revertedWith("NOT_OWNER");
  });
});