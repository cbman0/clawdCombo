const assert = require("assert");
const { validateStrategy, compileStrategy } = require("../cli/strategies/compiler");

describe("Strategy compiler", function () {
  const valid = {
    name: "flash-arb-test",
    chain: "polygon-amoy",
    flashloan: { provider: "aave-v3", asset: "USDC", amount: "1000" },
    actions: [
      { type: "swap", dex: "uniswap-v3", from: "USDC", to: "WETH", slippageBps: 80 },
      { type: "swap", dex: "1inch", from: "WETH", to: "USDC", slippageBps: 80 },
    ],
    repay: { asset: "USDC" },
  };

  it("validates a well-formed strategy", function () {
    const result = validateStrategy(valid);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it("rejects missing name", function () {
    const result = validateStrategy({ ...valid, name: "" });
    assert.strictEqual(result.ok, false);
    assert(result.errors.some((e) => e.includes("name")));
  });

  it("rejects missing flashloan", function () {
    const result = validateStrategy({ ...valid, flashloan: null });
    assert.strictEqual(result.ok, false);
  });

  it("rejects empty actions", function () {
    const result = validateStrategy({ ...valid, actions: [] });
    assert.strictEqual(result.ok, false);
  });

  it("rejects swap action without dex", function () {
    const result = validateStrategy({
      ...valid,
      actions: [{ type: "swap", from: "USDC", to: "WETH" }],
    });
    assert.strictEqual(result.ok, false);
    assert(result.errors.some((e) => e.includes("dex")));
  });

  it("compiles a valid strategy to v0.2-draft", function () {
    const compiled = compileStrategy(valid);
    assert.strictEqual(compiled.version, "0.2-draft");
    assert.strictEqual(compiled.name, "flash-arb-test");
    assert.strictEqual(compiled.steps.length, 2);
    assert(compiled.flashloan.adapter === "aave-v3-flash");
    assert(Array.isArray(compiled.supportedAdapters));
    assert(compiled.supportedAdapters.includes("uniswap-v3"));
    assert(compiled.supportedAdapters.includes("1inch"));
  });

  it("throws on invalid strategy during compile", function () {
    assert.throws(() => compileStrategy({}), /invalid strategy/);
  });
});
