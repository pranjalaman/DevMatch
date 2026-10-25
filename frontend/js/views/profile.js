// ===== Profile page (#/profile) =====
// Shows your details and lets you choose your skills.

let profilePicker = null;

function showProfilePage() {
  let githubLink = '';
  if (currentUser.github_url && isWebLink(currentUser.github_url)) {
    githubLink = `<a class="chip" href="${escapeHtml(currentUser.github_url)}" target="_blank" rel="noopener noreferrer">${icon('github', 12)} GitHub</a>`;
  }

  let yearOptions = '';
  for (const year of joiningYearChoices()) {
    const selected = year === currentUser.joined_year ? ' selected' : '';
    yearOptions += `<option value="${year}"${selected}>${year}</option>`;
  }

  const genders = [
    { value: '', label: 'Prefer not to say' },
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'other', label: 'Other' },
  ];
  let genderOptions = '';
  for (const gender of genders) {
    const selected = gender.value === (currentUser.gender || '') ? ' selected' : '';
    genderOptions += `<option value="${gender.value}"${selected}>${gender.label}</option>`;
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
            <span class="chip">${escapeHtml(currentUser.standing)}</span>
            ${githubLink}
          </div>
        </div>
      </div>

      <form class="profile-section" id="joined-year-form" novalidate>
        <h2>About you</h2>
        <p>Your study standing, ${escapeHtml(currentUser.standing)}, moves forward on 1 August.</p>
        ${fieldHtml('joined_year', 'Year you joined', `<select class="select select-block" id="joined_year" aria-describedby="joined_year-error">${yearOptions}</select>`)}
        ${fieldHtml('github_url', 'GitHub profile', `<input class="input" id="github_url" type="url" placeholder="https://github.com/your-name" value="${escapeHtml(currentUser.github_url || '')}" aria-describedby="github_url-error">`)}
        ${fieldHtml('gender', 'Gender', `<select class="select select-block" id="gender" aria-describedby="gender-error">${genderOptions}</select>`)}
        ${fieldHtml('dob', 'Date of birth', `<input class="input" id="dob" type="date" value="${escapeHtml(currentUser.dob || '')}" aria-describedby="dob-error">`)}
        <div class="profile-actions">
          <button class="btn btn-primary" type="submit" id="save-joined-year">${icon('check', 16)} Save profile</button>
        </div>
      </form>

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

  document.getElementById('joined-year-form').addEventListener('submit', saveJoinedYear);
  document.getElementById('profile-form').addEventListener('submit', saveProfileSkills);
}

async function saveJoinedYear(event) {
  event.preventDefault();
  const form = document.getElementById('joined-year-form');
  const saveButton = document.getElementById('save-joined-year');
  clearFieldErrors(form);
  saveButton.disabled = true;
  try {
    const githubUrl = document.getElementById('github_url').value.trim();
    if (githubUrl !== '' && !isGithubProfileLink(githubUrl)) {
      showFieldError('github_url', 'Use a profile link like https://github.com/your-name');
      saveButton.disabled = false;
      return;
    }
    currentUser = await callApi('PATCH', '/me', {
      joined_year: Number(document.getElementById('joined_year').value),
      github_url: githubUrl,
      gender: document.getElementById('gender').value,
      dob: document.getElementById('dob').value,
    });
    showToast('Profile saved.');
    showProfilePage();
  } catch (error) {
    saveButton.disabled = false;
    const fields = error.fields || {};
    const names = Object.keys(fields);
    if (names.length === 0) {
      showFieldError('joined_year', error.message);
      return;
    }
    for (const name of names) {
      showFieldError(name, fields[name]);
    }
  }
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
