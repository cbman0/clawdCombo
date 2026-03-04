const { expect } = require("chai");
const path = require("path");

describe("validateSwapInput", function () {
  afterEach(function () {
    // Reset environment
    delete process.env.MIN_SLIPPAGE_BPS;
    delete process.env.MAX_SLIPPAGE_BPS;
    // Clear require cache for guardrails and swap-exec to force re-evaluation of env
    const guardrailsPath = path.resolve(__dirname, "../cli/guardrails.js");
    const swapExecPath = path.resolve(__dirname, "../cli/swap-exec.js");
    delete require.cache[require.resolve(guardrailsPath)];
    delete require.cache[require.resolve(swapExecPath)];
  });

  function getValidateFn() {
    const { validateSwapInput } = require("../cli/swap-exec");
    return validateSwapInput;
  }

  it("accepts slippage within default bounds (1-500)", function () {
    const validate = getValidateFn();
    // Should not throw for slippage 100
    expect(() => validate({
      sellToken: "NATIVE",
      buyToken: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC on Amoy
      sellAmount: "1000000000000000000",
      slippageBps: 100
    })).to.not.throw();
  });

  it("rejects slippage below MIN_SLIPPAGE_BPS when configured", function () {
    process.env.MIN_SLIPPAGE_BPS = "50";
    const validate = getValidateFn();
    expect(() => validate({
      sellToken: "NATIVE",
      buyToken: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      sellAmount: "1000000000000000000",
      slippageBps: 25
    })).to.throw(/between 50 and 500/);
  });

  it("rejects slippage above MAX_SLIPPAGE_BPS when configured", function () {
    process.env.MAX_SLIPPAGE_BPS = "200";
    const validate = getValidateFn();
    expect(() => validate({
      sellToken: "NATIVE",
      buyToken: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      sellAmount: "1000000000000000000",
      slippageBps: 250
    })).to.throw(/between 1 and 200/);
  });

  it("still enforces minimum 1 bps even if MIN_SLIPPAGE_BPS not set", function () {
    // Default min is 1
    const validate = getValidateFn();
    expect(() => validate({
      sellToken: "NATIVE",
      buyToken: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      sellAmount: "1000000000000000000",
      slippageBps: 0
    })).to.throw(/between 1 and 500/);
  });

  it("still enforces maximum 500 bps even if MAX_SLIPPAGE_BPS not set", function () {
    const validate = getValidateFn();
    expect(() => validate({
      sellToken: "NATIVE",
      buyToken: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      sellAmount: "1000000000000000000",
      slippageBps: 600
    })).to.throw(/between 1 and 500/);
  });

  it("validates required fields", function () {
    const validate = getValidateFn();
    expect(() => validate({})).to.throw(/sellToken, buyToken, sellAmount are required/);
    expect(() => validate({ sellToken: "NATIVE", buyToken: "USDC", slippageBps: 100 })).to.throw(/sellAmount/);
  });

  it("validates sellToken and buyToken addresses", function () {
    const validate = getValidateFn();
    expect(() => validate({
      sellToken: "invalid",
      buyToken: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      sellAmount: "1000",
      slippageBps: 100
    })).to.throw(/sellToken must be NATIVE or a valid address/);
  });

  it("rejects same token for sell and buy", function () {
    const validate = getValidateFn();
    expect(() => validate({
      sellToken: "NATIVE",
      buyToken: "NATIVE",
      sellAmount: "1000",
      slippageBps: 100
    })).to.throw(/cannot be the same/);
  });
});
