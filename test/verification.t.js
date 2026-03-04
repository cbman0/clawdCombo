const { expect } = require("chai");
const { verifyBuyDelta } = require("../cli/verification");

describe("Post-trade delta verification", function () {
  it("returns buyMeetMin true when actual >= expected", function () {
    const quote = { buyAmount: "1000" };
    const result = verifyBuyDelta(quote, "1000");
    expect(result.buyMeetMin).to.be.true;
    expect(result.expectedMinBuy).to.equal("1000");
    expect(result.actualBuyDelta).to.equal("1000");
  });

  it("returns buyMeetMin false when actual < expected", function () {
    const quote = { buyAmount: "1000" };
    const result = verifyBuyDelta(quote, "999");
    expect(result.buyMeetMin).to.be.false;
    expect(result.expectedMinBuy).to.equal("1000");
    expect(result.actualBuyDelta).to.equal("999");
  });

  it("handles missing buyAmount in quote", function () {
    const quote = {};
    const result = verifyBuyDelta(quote, "1000");
    expect(result).to.have.property('warning', 'No buyAmount in quote; cannot verify');
  });

  it("handles undefined quote", function () {
    const result = verifyBuyDelta(null, "1000");
    expect(result).to.have.property('warning', 'No buyAmount in quote; cannot verify');
  });

  it("handles non-numeric buyAmount gracefully", function () {
    const quote = { buyAmount: "abc" };
    const result = verifyBuyDelta(quote, "1000");
    expect(result).to.have.property('buyAmountCheckError');
  });

  it("handles big integers correctly", function () {
    const quote = { buyAmount: "115792089237316195423570985008687907853269984665640564039457584007913129639935" }; // max uint256 approx
    const result = verifyBuyDelta(quote, "115792089237316195423570985008687907853269984665640564039457584007913129639935");
    expect(result.buyMeetMin).to.be.true;
  });
});
