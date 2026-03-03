const STORAGE_KEY = 'clawdcombo:mode';
const DEFAULT_MODE = 'easy';

export function getMode() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'advanced' ? 'advanced' : DEFAULT_MODE;
}

export function setMode(mode) {
  const next = mode === 'advanced' ? 'advanced' : DEFAULT_MODE;
  localStorage.setItem(STORAGE_KEY, next);
  return next;
}

export function toggleMode() {
  return setMode(getMode() === 'easy' ? 'advanced' : 'easy');
}

export function modeToggleView() {
  const mode = getMode();
  const isAdvanced = mode === 'advanced';
  return `
    <div class="modebar">
      <div class="modebar-left">
        <strong>Mode:</strong> ${isAdvanced ? 'Advanced' : 'Easy'}
      </div>
      <button id="modeToggleBtn" class="mode-toggle" title="Switch between Easy and Advanced mode">
        ${isAdvanced ? 'Switch to Easy' : 'Switch to Advanced'}
      </button>
    </div>
  `;
}

export function bindModeToggle(onChanged) {
  const btn = document.getElementById('modeToggleBtn');
  if (!btn) return;
  btn.onclick = () => {
    const next = toggleMode();
    if (typeof onChanged === 'function') onChanged(next);
  };
}
