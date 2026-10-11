// ===== Toast =====
// Notification toasts that appear in the bottom-right corner.
// Supports error toasts with a 1-click copy button, clipboard fallback,
// pause-on-hover, smooth exit animations, and duplicate suppression.

async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback below
    }
  }
  try {
    const input = document.createElement('textarea');
    input.value = text;
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.top = '-9999px';
    input.setAttribute('readonly', '');
    document.body.appendChild(input);
    input.select();
    const success = document.execCommand('copy');
    document.body.removeChild(input);
    return success;
  } catch (err) {
    return false;
  }
}

function showToast(message, type, options) {
  if (!message) {
    return;
  }
  if (!type) {
    type = 'success';
  }
  const opts = options || {};

  const region = document.getElementById('toast-region');
  if (!region) {
    return;
  }

  // Deduplication: if the exact same toast is currently visible, refresh its timer and highlight it
  const existingToasts = region.querySelectorAll('.toast');
  for (const existing of existingToasts) {
    if (existing.dataset.message === message && existing.classList.contains('toast-' + type)) {
      existing.classList.remove('toast-pulse');
      // Trigger a subtle pulse animation to acknowledge the repeated event
      void existing.offsetWidth;
      existing.classList.add('toast-pulse');
      if (typeof existing._restartTimer === 'function') {
        existing._restartTimer();
      }
      return;
    }
  }

  let iconName = 'check';
  let hiddenPrefix = 'Success: ';
  let isError = false;
  if (type === 'error') {
    iconName = 'alert';
    hiddenPrefix = 'Error: ';
    isError = true;
  } else if (type === 'info') {
    iconName = 'info';
    hiddenPrefix = 'Note: ';
  }

  const isCopyable = opts.copyable !== undefined ? Boolean(opts.copyable) : isError;
  const copyText = opts.copyText || message;
  const duration = opts.duration || (isError ? 7000 : 4000);

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.setAttribute('role', isError ? 'alert' : 'status');
  toast.dataset.message = message;

  let copyButtonHtml = '';
  if (isCopyable) {
    copyButtonHtml = `
      <button class="toast-btn toast-copy-btn" type="button" aria-label="Copy error message" title="Copy error to clipboard">
        <span class="toast-copy-icon">${icon('copy', 13)}</span>
        <span class="toast-copy-label">Copy</span>
      </button>`;
  }

  toast.innerHTML = `
    <span class="toast-icon">${icon(iconName, 18)}</span>
    <div class="toast-content">
      <p class="toast-message"><span class="sr-only">${hiddenPrefix}</span>${escapeHtml(message)}</p>
    </div>
    <div class="toast-actions">
      ${copyButtonHtml}
      <button class="toast-close" type="button" aria-label="Dismiss notification" title="Dismiss">${icon('x', 14)}</button>
    </div>`;

  region.appendChild(toast);

  // Auto-dismiss with pause on hover/focus
  let dismissTimeout = null;
  let isDismissing = false;

  function dismissToast() {
    if (isDismissing) {
      return;
    }
    isDismissing = true;
    toast.classList.add('toast-out');
    setTimeout(function () {
      toast.remove();
    }, 160);
  }

  function startTimer(ms) {
    clearTimeout(dismissTimeout);
    dismissTimeout = setTimeout(dismissToast, ms || duration);
  }

  toast._restartTimer = function () {
    startTimer(duration);
  };

  startTimer(duration);

  // Pause auto-dismiss when hovering or focused
  toast.addEventListener('mouseenter', function () {
    clearTimeout(dismissTimeout);
  });
  toast.addEventListener('mouseleave', function () {
    startTimer(2500); // give 2.5 seconds after cursor leaves
  });
  toast.addEventListener('focusin', function () {
    clearTimeout(dismissTimeout);
  });
  toast.addEventListener('focusout', function () {
    startTimer(2500);
  });

  // Close button handler
  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.onclick = dismissToast;
  }

  // Copy button handler
  if (isCopyable) {
    const copyBtn = toast.querySelector('.toast-copy-btn');
    if (copyBtn) {
      let resetCopyTimeout = null;
      copyBtn.onclick = async function (event) {
        event.stopPropagation();
        const success = await copyTextToClipboard(copyText);
        if (success) {
          copyBtn.classList.add('is-copied');
          copyBtn.setAttribute('aria-label', 'Copied to clipboard');
          copyBtn.title = 'Copied!';
          const iconSpan = copyBtn.querySelector('.toast-copy-icon');
          const labelSpan = copyBtn.querySelector('.toast-copy-label');
          if (iconSpan) {
            iconSpan.innerHTML = icon('check', 13);
          }
          if (labelSpan) {
            labelSpan.textContent = 'Copied!';
          }

          // Keep toast open for user to appreciate feedback
          startTimer(3500);

          clearTimeout(resetCopyTimeout);
          resetCopyTimeout = setTimeout(function () {
            copyBtn.classList.remove('is-copied');
            copyBtn.setAttribute('aria-label', 'Copy error message');
            copyBtn.title = 'Copy error to clipboard';
            if (iconSpan) {
              iconSpan.innerHTML = icon('copy', 13);
            }
            if (labelSpan) {
              labelSpan.textContent = 'Copy';
            }
          }, 2000);
        }
      };
    }
  }
}
