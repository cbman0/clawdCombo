/**
 * BaseService
 * ----------
 * Tiny base class to keep service-style modules consistent and beginner-friendly.
 */
class BaseService {
  constructor(name) {
    this.name = name;
  }

  fail(message, details) {
    const err = new Error(`[${this.name}] ${message}`);
    if (details) err.details = details;
    return err;
  }
}

module.exports = { BaseService };
