const { expect } = require("chai");
const { amountFromPreset } = require("../cli/amoy");

describe("CLI amount presets", () => {
  it("maps low/medium/high correctly", () => {
    expect(amountFromPreset("low")).to.equal("0.0001");
    expect(amountFromPreset("medium")).to.equal("0.001");
    expect(amountFromPreset("high")).to.equal("0.002");
  });

  it("uses override when provided", () => {
    expect(amountFromPreset("low", "0.007")).to.equal("0.007");
  });
});
