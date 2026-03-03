/**
 * API helper with timeout + safe JSON error parsing.
 */
export async function api(path, method = 'GET', body, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });

    let json;
    try {
      json = await res.json();
    } catch {
      throw new Error(`HTTP ${res.status}: non-JSON response`);
    }

    if (!json.ok) throw new Error(json.error || 'API error');
    return json.result;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`Request timed out after ${timeoutMs}ms`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
