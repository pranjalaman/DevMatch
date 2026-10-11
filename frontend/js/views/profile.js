// ===== Profile page (#/profile) =====
// Shows your details and lets you choose your skills.

let profilePicker = null;

function showProfilePage() {
  let githubLink = '';
  if (currentUser.github_url && isWebLink(currentUser.github_url)) {
    githubLink = `<a class="chip" href="${escapeHtml(currentUser.github_url)}" target="_blank" rel="noopener noreferrer">${icon('github', 12)} GitHub</a>`;
  }

  mainArea.innerHTML = `
    <section class="panel profile-card" aria-labelledby="profile-title">
      <div class="profile-top">
        <span class="avatar avatar-lg" aria-hidden="true">${escapeHtml(getInitials(currentUser.name))}</span>
        <div>
          <h1 id="profile-title">${escapeHtml(currentUser.name)}</h1>
          <p class="muted">${escapeHtml(currentUser.email)}</p>
          <div class="profile-meta">
            <span class="chip">${escapeHtml(branchName(currentUser.branch))}</span>
            <span class="chip">Year ${currentUser.year}</span>
            ${githubLink}
          </div>
        </div>
      </div>

      <form class="profile-section" id="profile-form" novalidate>
        <h2><label for="profile_skills">Your skills</label></h2>
        <p>We use these to rank projects and show why each one matches you. Up to 30.</p>
        <div id="profile-picker"></div>
        <p class="field-error" id="profile_skills-error" hidden></p>
        <div class="profile-actions">
          <button class="btn btn-primary" type="submit" id="save-skills">${icon('check', 16)} Save skills</button>
          <a class="btn" href="#/">Browse matching projects ${icon('arrowRight', 16)}</a>
        </div>
      </form>
    </section>`;

  profilePicker = createSkillPicker(document.getElementById('profile-picker'), 'profile_skills',
    currentUser.skills, 30, 'Add a skill… (e.g. Python, Figma)');

  document.getElementById('profile-form').addEventListener('submit', saveProfileSkills);
}

async function saveProfileSkills(event) {
  event.preventDefault();
  const form = document.getElementById('profile-form');
  const saveButton = document.getElementById('save-skills');
  clearFieldErrors(form);

  saveButton.disabled = true;
  try {
    await callApi('PUT', '/me/skills', { skills: profilePicker.skills });
    currentUser = await callApi('GET', '/me'); // get the updated user
    showToast('Skills saved. Your feed is now ranked by match.');
  } catch (error) {
    showFieldError('profile_skills', error.fields.skills || error.message);
    profilePicker.input.focus();
  }
  saveButton.disabled = false;
}
