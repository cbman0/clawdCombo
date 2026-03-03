const { expect } = require("chai");
const { saveCatalog } = require("../cli/catalog");

describe("Catalog persistence", () => {
  it("saves payload with expected shape", () => {
    const payload = saveCatalog([{ symbol: "BTC", name: "Bitcoin", rank: 1 }]);
    expect(payload).to.have.property("generatedAt");
    expect(payload).to.have.property("count", 1);
    expect(payload.items[0].symbol).to.equal("BTC");
  });
});
