let container;

export function initToasts() {
  container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
}

export function toast(message, variant = 'info', ttlMs = 2800) {
  if (!container) initToasts();
  const el = document.createElement('div');
  el.className = `toast toast-${variant}`;
  el.textContent = message;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 220);
  }, ttlMs);
}
