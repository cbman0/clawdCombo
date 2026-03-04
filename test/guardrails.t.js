const { expect } = require("chai");
const path = require("path");

describe("Guardrails configuration", function () {
  afterEach(function () {
    // Cleanup environment changes
    delete process.env.MAX_SWAP_GAS;
    delete process.env.MIN_SLIPPAGE_BPS;
    delete process.env.MAX_SLIPPAGE_BPS;
    delete process.env.ALLOWED_DELTA_DEVIATION_BPS;
  });

  function reloadGuardrails() {
    const modulePath = path.resolve(__dirname, "../cli/guardrails.js");
    delete require.cache[require.resolve(modulePath)];
    return require(modulePath);
  }

  it("uses default values when env not set", function () {
    delete process.env.MAX_SWAP_GAS;
    const g = reloadGuardrails();
    expect(g.MAX_GAS).to.equal(900000);
    expect(g.MIN_SLIPPAGE_BPS).to.equal(1);
    expect(g.MAX_SLIPPAGE_BPS).to.equal(500);
    expect(g.ALLOWED_DELTA_DEVIATION_BPS).to.equal(50);
  });

  it("overrides MAX_GAS from env", function () {
    process.env.MAX_SWAP_GAS = "1234567";
    const g = reloadGuardrails();
    expect(g.MAX_GAS).to.equal(1234567);
  });

  it("overrides slippage bounds from env", function () {
    process.env.MIN_SLIPPAGE_BPS = "5";
    process.env.MAX_SLIPPAGE_BPS = "1000";
    const g = reloadGuardrails();
    expect(g.MIN_SLIPPAGE_BPS).to.equal(5);
    expect(g.MAX_SLIPPAGE_BPS).to.equal(1000);
  });

  it("overrides ALLOWED_DELTA_DEVIATION_BPS from env", function () {
    process.env.ALLOWED_DELTA_DEVIATION_BPS = "100";
    const g = reloadGuardrails();
    expect(g.ALLOWED_DELTA_DEVIATION_BPS).to.equal(100);
  });

  it("throws on invalid integer for MAX_SWAP_GAS", function () {
    process.env.MAX_SWAP_GAS = "not-a-number";
    expect(() => reloadGuardrails()).to.throw(/Invalid integer for MAX_SWAP_GAS/);
  });

  it("throws when slippage bps out of range 1-10000", function () {
    process.env.MIN_SLIPPAGE_BPS = "0";
    expect(() => reloadGuardrails()).to.throw(/must be between 1 and 10000/);
    process.env.MIN_SLIPPAGE_BPS = "10001";
    expect(() => reloadGuardrails()).to.throw(/must be between 1 and 10000/);
  });
});
