// ===== Helpers =====
// Small functions used all over the app.

// Makes text safe to put inside HTML.
// ALWAYS use this for anything a user typed (titles, names, descriptions...),
// otherwise someone could type <script> tags into a project title and break the page.
function escapeHtml(text) {
  if (text === null || text === undefined) {
    return '';
  }
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// 'python' -> 'Python'
function skillLabel(slug) {
  for (const skill of allSkills) {
    if (skill.slug === slug) {
      return skill.label;
    }
  }
  return slug;
}

// Short names people often type, and the real skill they mean.
const SKILL_SHORTCUTS = {
  js: 'javascript',
  py: 'python',
  reactjs: 'react',
  'react.js': 'react',
  node: 'nodejs',
  'node.js': 'nodejs',
  postgres: 'postgresql',
  ml: 'machine-learning',
  cpp: 'c++',
  ts: 'typescript',
};

// Turns what the user typed ("JS", "Python", "machine learning") into a skill slug.
// Returns null if we don't know that skill.
function findSkill(typedText) {
  let text = typedText.trim().toLowerCase();
  if (SKILL_SHORTCUTS[text]) {
    text = SKILL_SHORTCUTS[text];
  }
  for (const skill of allSkills) {
    if (skill.slug === text || skill.label.toLowerCase() === text) {
      return skill.slug;
    }
  }
  return null;
}

// '2026-10-02T10:00:00Z' -> 'Oct 2026'
function formatMonthYear(dateText) {
  const date = new Date(dateText);
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

// '2026-10-02T10:00:00Z' -> '2 Oct 2026'
function formatDate(dateText) {
  const date = new Date(dateText);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// 'Priya Singh' -> 'PS'
function getInitials(name) {
  const words = name.trim().split(' ');
  let initials = words[0][0];
  if (words.length > 1) {
    initials = initials + words[1][0];
  }
  return initials.toUpperCase();
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

// Only allow normal web links (blocks tricks like "javascript:...")
function isWebLink(url) {
  const lower = url.toLowerCase();
  return lower.startsWith('https://') || lower.startsWith('http://');
}

// Must look like https://github.com/owner/repo
function isGithubRepoLink(url) {
  return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(url);
}

const BRANCHES = [
  { code: 'CSE', name: 'Computer Science & Engg.' },
  { code: 'IT', name: 'Information Technology' },
  { code: 'ECE', name: 'Electronics & Comm. Engg.' },
  { code: 'EE', name: 'Electrical Engg.' },
  { code: 'ME', name: 'Mechanical Engg.' },
  { code: 'CE', name: 'Civil Engg.' },
  { code: 'CHE', name: 'Chemical Engg.' },
  { code: 'MIN', name: 'Mining Engg.' },
  { code: 'MET', name: 'Metallurgical Engg.' },
  { code: 'PIE', name: 'Production & Industrial Engg.' },
];

// 'CSE' -> 'Computer Science & Engg.'
function branchName(code) {
  for (const branch of BRANCHES) {
    if (branch.code === code) {
      return branch.name;
    }
  }
  return code;
}

// ----- Icons -----
// Each icon is a small SVG drawing. icon('mail') gives back the HTML for it.
const ICONS = {
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  chevronDown: '<polyline points="6 9 12 15 18 9"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 14 0v1"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
};

function icon(name, size) {
  if (!size) {
    size = 18;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

// ----- Common bits of HTML -----

// Grey placeholder cards shown while projects are loading
function loadingCardsHtml(count) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="card skeleton" aria-hidden="true">
        <div class="sk sk-title"></div>
        <div class="sk sk-line"></div>
        <div class="sk sk-line short"></div>
        <div class="sk-chips"><div class="sk sk-chip"></div><div class="sk sk-chip"></div><div class="sk sk-chip"></div></div>
        <div class="card-foot"><div class="sk sk-line short"></div></div>
      </div>`;
  }
  return html;
}

// A big box with an icon, a title, a message and some buttons.
// Used for "nothing found" and "something went wrong" messages.
function messageBoxHtml(title, message, buttonsHtml, isError) {
  let boxClass = 'state';
  let iconName = 'inbox';
  if (isError) {
    boxClass = 'state state-error';
    iconName = 'alert';
  }
  return `
    <div class="${boxClass}" ${isError ? 'role="alert"' : ''}>
      <span class="state-icon">${icon(iconName, 26)}</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(message)}</p>
      <div class="state-actions">${buttonsHtml}</div>
    </div>`;
}

// ----- Form helpers -----
// Every form field has an error line under it with the id "<field id>-error".

function showFieldError(fieldId, message) {
  const errorLine = document.getElementById(fieldId + '-error');
  if (errorLine) {
    errorLine.textContent = message;
    errorLine.hidden = false;
  }
  const input = document.getElementById(fieldId);
  if (input) {
    input.setAttribute('aria-invalid', 'true');
  }
}

function clearFieldErrors(form) {
  form.querySelectorAll('.field-error').forEach(function (errorLine) {
    errorLine.textContent = '';
    errorLine.hidden = true;
  });
  form.querySelectorAll('[aria-invalid]').forEach(function (input) {
    input.removeAttribute('aria-invalid');
  });
}

// Puts the cursor in the first field that has an error
function focusFirstError(form) {
  const badField = form.querySelector('[aria-invalid="true"]');
  if (badField) {
    badField.focus();
  }
}

// HTML for one labelled form field with an error line under it
function fieldHtml(id, labelText, inputHtml, hintText) {
  let hint = '';
  if (hintText) {
    hint = `<p class="field-hint">${hintText}</p>`;
  }
  return `
    <div class="field">
      <label class="field-label" for="${id}">${labelText}</label>
      ${inputHtml}
      ${hint}
      <p class="field-error" id="${id}-error" hidden></p>
    </div>`;
}
