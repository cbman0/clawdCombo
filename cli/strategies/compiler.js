function validateStrategy(strategy = {}) {
  const errors = [];
  if (!strategy || typeof strategy !== 'object') errors.push('strategy object is required');
  if (!strategy.name) errors.push('name is required');
  if (!strategy.chain) errors.push('chain is required');
  if (!strategy.flashloan || typeof strategy.flashloan !== 'object') errors.push('flashloan object is required');
  if (!Array.isArray(strategy.actions) || strategy.actions.length < 1) errors.push('at least one action is required');
  return { ok: errors.length === 0, errors };
}

function compileStrategy(strategy = {}) {
  const check = validateStrategy(strategy);
  if (!check.ok) {
    const e = new Error(`invalid strategy: ${check.errors.join('; ')}`);
    e.validation = check;
    throw e;
  }

  const steps = strategy.actions.map((action, index) => ({
    id: index + 1,
    type: action.type || 'unknown',
    adapterHint: action.dex || action.protocol || 'unassigned',
    params: action,
  }));

  return {
    version: '0.1-draft',
    name: strategy.name,
    chain: strategy.chain,
    flashloan: strategy.flashloan,
    steps,
    repay: strategy.repay || null,
    metadata: {
      compiledAt: new Date().toISOString(),
      actionCount: steps.length,
    },
  };
}

module.exports = { validateStrategy, compileStrategy };
