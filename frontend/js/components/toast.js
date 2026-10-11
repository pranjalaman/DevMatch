// ===== Toast =====
// A small message that pops up in the bottom-right corner and disappears by itself.
// type can be 'success', 'error' or 'info'.

function showToast(message, type) {
  if (!type) {
    type = 'success';
  }

  let iconName = 'check';
  let hiddenPrefix = 'Success: ';
  if (type === 'error') {
    iconName = 'alert';
    hiddenPrefix = 'Error: ';
  } else if (type === 'info') {
    iconName = 'info';
    hiddenPrefix = 'Note: ';
  }

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.innerHTML = `
    ${icon(iconName)}
    <p><span class="sr-only">${hiddenPrefix}</span>${escapeHtml(message)}</p>
    <button class="toast-close" type="button" aria-label="Dismiss notification">${icon('x', 14)}</button>`;

  document.getElementById('toast-region').appendChild(toast);

  function removeToast() {
    toast.remove();
  }
  toast.querySelector('.toast-close').onclick = removeToast;
  setTimeout(removeToast, 4000); // disappear after 4 seconds
}
