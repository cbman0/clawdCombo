const { BaseService } = require("./BaseService");
const { listTokens, addToken } = require("../token-registry");

/**
 * TokenRegistryService
 * --------------------
 * Wraps token registry operations behind a class API.
 */
class TokenRegistryService extends BaseService {
  constructor() {
    super("TokenRegistryService");
  }

  list() {
    return listTokens();
  }

  add(input) {
    return addToken(input);
  }
}

module.exports = { TokenRegistryService };
