const { expect } = require("chai");
const { pctDiff } = require("../cli/arb");

describe("Watchlist helpers", () => {
  it("pctDiff returns 0 for zero midpoint", () => {
    expect(pctDiff(-1, 1)).to.equal(0);
  });
});
