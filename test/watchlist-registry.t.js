const { expect } = require("chai");
const { saveWatchlist } = require("../cli/watchlist-registry");

describe("Watchlist registry", () => {
  it("normalizes threshold and interval to numbers", () => {
    const out = saveWatchlist({ thresholdPct: "2.5", intervalSec: "30", pairs: [] });
    expect(out.thresholdPct).to.equal(2.5);
    expect(out.intervalSec).to.equal(30);
  });
});
