const { expect } = require("chai");
const { pctDiff } = require("../cli/arb");

describe("Arb math", () => {
  it("computes symmetric percent difference", () => {
    const d = pctDiff(100, 102);
    expect(d).to.be.greaterThan(1.9);
    expect(d).to.be.lessThan(2.1);
  });

  it("returns 0 on invalid inputs", () => {
    expect(pctDiff(0, 0)).to.equal(0);
    expect(pctDiff(null, 100)).to.equal(0);
  });
});
