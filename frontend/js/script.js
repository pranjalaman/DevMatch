// ===== Start the app =====
// This file runs last (see the <script> tags at the bottom of index.html).

async function startApp() {
  // 1. Is the real backend running? If not, use demo data.
  await checkBackend();
  if (useDemoData) {
    document.getElementById('banner').innerHTML = `
      <div class="demo-banner" role="note">
        Demo mode: backend not detected, using sample data stored in your browser.
        Log in with demo@devmatch.dev / demo1234.
      </div>`;
  }

  // 2. Load the list of skills and fill the suggestion list used by every skill picker
  try {
    allSkills = await callApi('GET', '/skills');
  } catch (error) {
    showToast('Couldn’t load the skills list.', 'error');
  }
  let options = '';
  for (const skill of allSkills) {
    options += `<option value="${escapeHtml(skill.label)}"></option>`;
  }
  document.getElementById('skill-options').innerHTML = options;

  // 3. Is someone already logged in?
  try {
    currentUser = await callApi('GET', '/me');
  } catch (error) {
    currentUser = null; // not logged in, that's fine
  }

  // 4. Draw the header and the page for the current address
  drawHeader();
  showPage();
}

// "Skip to content" link for keyboard users
document.getElementById('skip-link').addEventListener('click', function (event) {
  event.preventDefault();
  mainArea.focus();
});

startApp();
