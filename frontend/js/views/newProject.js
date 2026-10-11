// ===== Project form (#/new and #/edit/7) =====
// Used both for posting a new project and editing your own project.

let formRoles = [];         // roles added so far, e.g. [{ title: 'Frontend dev', skills: ['react'] }]
let editingRoleIndex = -1;  // which role is being edited right now (-1 = we're adding a new one)
let stackPicker = null;     // skill picker for the project's tech stack
let rolePicker = null;      // skill picker for the role being added

async function showProjectForm(projectId) {
  // New project: start with an empty form
  if (projectId === null) {
    drawProjectForm(null);
    return;
  }

  // Editing: load the project first
  mainArea.innerHTML = '<p class="result-meta">Loading project…</p>';
  let project;
  try {
    project = await callApi('GET', '/projects/' + projectId);
  } catch (error) {
    mainArea.innerHTML = messageBoxHtml('Couldn’t load this project', error.message,
      '<a class="btn" href="#/">Back to feed</a>', true);
    return;
  }

  // The user may have gone to another page while we were loading
  if (getRoute() !== '/edit/' + projectId) {
    return;
  }

  if (project.owner.id !== currentUser.id) {
    showToast('You can only edit your own projects.', 'error');
    goTo('/project/' + projectId);
    return;
  }

  drawProjectForm(project);
}

function drawProjectForm(project) {
  const isEditing = project !== null;

  // For a new project, use empty values
  if (!isEditing) {
    project = {
      title: '', summary: '', description: '', skills: [],
      contact_email: currentUser.email, contact_url: '', repo_url: '', roles: [],
    };
  }

  // Copy the roles so we can change them without touching the original project
  formRoles = [];
  for (const role of project.roles) {
    formRoles.push({ id: role.id, title: role.title, skills: role.skills.slice(), filled: role.filled });
  }
  editingRoleIndex = -1;

  mainArea.innerHTML = `
    <section class="form-page" aria-labelledby="form-title">
      <div class="form-head">
        <h1 id="form-title">${isEditing ? 'Edit Project' : 'Create a New Project'}</h1>
        <p>${isEditing ? 'Update the details of your listing.' : 'Fill out the details below to find the right developers for your project.'}</p>
      </div>

      <form class="form" id="project-form" novalidate>
        <div class="form-error" id="form-error" role="alert" hidden></div>

        ${fieldHtml('title', 'Project title',
          `<input class="input" id="title" maxlength="80" placeholder="e.g. Campus Bus Tracker" value="${escapeHtml(project.title)}" aria-describedby="title-error">`,
          'Max 80 characters.')}

        ${fieldHtml('summary', 'Project summary',
          `<input class="input" id="summary" maxlength="200" placeholder="One or two sentences that sell the idea" value="${escapeHtml(project.summary)}" aria-describedby="summary-error">`,
          'Shown on the project card. Max 200 characters.')}

        ${fieldHtml('description', 'Project description',
          `<textarea class="input" id="description" rows="6" maxlength="4000" placeholder="What are you building, why, and what's the plan?" aria-describedby="description-error">${escapeHtml(project.description)}</textarea>`,
          'Max 4000 characters.')}

        ${fieldHtml('skills', 'Required tech stack', '<div id="stack-picker"></div>', 'Type a skill and press Enter. Up to 15.')}

        <div class="form-row">
          ${fieldHtml('contact_email', 'Contact email',
            `<div class="input-icon">${icon('mail', 16)}<input class="input" id="contact_email" type="email" placeholder="you@example.com" value="${escapeHtml(project.contact_email)}" aria-describedby="contact_email-error"></div>`,
            'Only visible to logged-in students.')}

          ${fieldHtml('contact_url', 'Contact URL <span class="optional">(optional)</span>',
            `<div class="input-icon">${icon('link', 16)}<input class="input" id="contact_url" type="url" placeholder="https://wa.me/..." value="${escapeHtml(project.contact_url)}" aria-describedby="contact_url-error"></div>`)}
        </div>

        ${fieldHtml('repo_url', 'Repository URL <span class="optional">(optional)</span>',
          `<div class="input-icon">${icon('github', 16)}<input class="input" id="repo_url" type="url" placeholder="https://github.com/owner/repo" value="${escapeHtml(project.repo_url)}" aria-describedby="repo_url-error"></div>`)}

        <h2 class="section-title">Required roles</h2>
        <div class="role-builder">
          ${fieldHtml('role_title', 'Role title',
            '<input class="input" id="role_title" maxlength="60" placeholder="e.g. Frontend developer" aria-describedby="role_title-error">')}
          ${fieldHtml('role_skills', 'Required skills', '<div id="role-picker"></div>')}
        </div>
        <button class="add-role" type="button" id="add-role-button">${icon('plus', 16)} <span id="add-role-text">Add role</span></button>
        <p class="field-error" id="roles-error" hidden></p>
        <ul class="role-rows" id="role-list" aria-label="Roles added"></ul>

        <div class="form-actions">
          ${isEditing ? `<a class="btn btn-lg" href="#/project/${project.id}">Cancel</a>` : ''}
          <button class="btn btn-primary btn-lg" type="submit" id="submit-button">
            ${isEditing ? 'Save changes' : 'Publish project'} ${icon('arrowRight')}
          </button>
        </div>
      </form>
    </section>`;

  stackPicker = createSkillPicker(document.getElementById('stack-picker'), 'skills', project.skills, 15, 'Add tech stack… (e.g. React, Python)');
  rolePicker = createSkillPicker(document.getElementById('role-picker'), 'role_skills', [], 15, 'Skills for this role…');

  document.getElementById('add-role-button').onclick = saveRole;
  document.getElementById('role_title').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveRole();
    }
  });

  document.getElementById('project-form').addEventListener('submit', function (event) {
    event.preventDefault();
    submitProjectForm(project);
  });

  drawRoles();
}

// ----- Roles -----

function drawRoles() {
  let html = '';
  formRoles.forEach(function (role, index) {
    let chips = '';
    for (const slug of role.skills) {
      chips += `<li class="chip chip-tag">${escapeHtml(skillLabel(slug))}</li>`;
    }
    const filledBadge = role.filled ? '<span class="status status-filled">Filled</span>' : '';

    html += `
      <li class="role-row">
        <div class="role-row-main">
          <strong>Role ${index + 1}: ${escapeHtml(role.title)}</strong>
          <ul class="chips">${chips}</ul>
          ${filledBadge}
        </div>
        <div class="role-row-actions">
          <button class="btn icon-btn btn-sm edit-role" type="button" data-index="${index}" aria-label="Edit role ${escapeHtml(role.title)}">${icon('edit', 14)}</button>
          <button class="btn icon-btn btn-sm remove-role" type="button" data-index="${index}" aria-label="Remove role ${escapeHtml(role.title)}">${icon('trash', 14)}</button>
        </div>
      </li>`;
  });
  document.getElementById('role-list').innerHTML = html;

  // Edit button: put the role back in the inputs above
  document.querySelectorAll('.edit-role').forEach(function (button) {
    button.onclick = function () {
      editingRoleIndex = Number(button.dataset.index);
      const role = formRoles[editingRoleIndex];
      document.getElementById('role_title').value = role.title;
      rolePicker.setSkills(role.skills);
      document.getElementById('add-role-text').textContent = 'Update role';
      document.getElementById('role_title').focus();
    };
  });

  // Remove button
  document.querySelectorAll('.remove-role').forEach(function (button) {
    button.onclick = function () {
      formRoles.splice(Number(button.dataset.index), 1);
      clearRoleInputs();
      drawRoles();
    };
  });
}

function clearRoleInputs() {
  editingRoleIndex = -1;
  document.getElementById('role_title').value = '';
  rolePicker.clear();
  document.getElementById('add-role-text').textContent = 'Add role';
}

// Adds a new role (or updates the one being edited) from the role inputs
function saveRole() {
  const form = document.getElementById('project-form');
  clearFieldErrors(form);

  const title = document.getElementById('role_title').value.trim();
  const skills = rolePicker.skills;

  if (title === '') {
    showFieldError('role_title', 'Give the role a title');
    document.getElementById('role_title').focus();
    return;
  }
  if (skills.length === 0) {
    showFieldError('role_skills', 'Add at least one skill');
    rolePicker.input.focus();
    return;
  }

  if (editingRoleIndex === -1) {
    if (formRoles.length >= 10) {
      showFieldError('roles', 'You can add up to 10 roles.');
      return;
    }
    formRoles.push({ title: title, skills: skills.slice(), filled: false });
  } else {
    formRoles[editingRoleIndex].title = title;
    formRoles[editingRoleIndex].skills = skills.slice();
  }

  clearRoleInputs();
  drawRoles();
  document.getElementById('role_title').focus();
}

// ----- Submitting -----

async function submitProjectForm(project) {
  const form = document.getElementById('project-form');
  const formError = document.getElementById('form-error');
  clearFieldErrors(form);
  formError.hidden = true;

  // 1. Collect what the user typed
  const data = {
    title: document.getElementById('title').value.trim(),
    summary: document.getElementById('summary').value.trim(),
    description: document.getElementById('description').value.trim(),
    skills: stackPicker.skills,
    contact_email: document.getElementById('contact_email').value.trim(),
    contact_url: document.getElementById('contact_url').value.trim() || null,
    repo_url: document.getElementById('repo_url').value.trim() || null,
    roles: formRoles,
  };

  // 2. Check it before sending
  let hasErrors = false;
  if (data.title === '') { showFieldError('title', 'Title is required'); hasErrors = true; }
  if (data.summary === '') { showFieldError('summary', 'Summary is required'); hasErrors = true; }
  if (data.description === '') { showFieldError('description', 'Description is required'); hasErrors = true; }
  if (data.skills.length === 0) { showFieldError('skills', 'Add at least one technology'); hasErrors = true; }
  if (!isValidEmail(data.contact_email)) { showFieldError('contact_email', 'Enter a valid email address'); hasErrors = true; }
  if (data.contact_url && !isWebLink(data.contact_url)) { showFieldError('contact_url', 'Enter a full link starting with https://'); hasErrors = true; }
  if (data.repo_url && !isGithubRepoLink(data.repo_url)) { showFieldError('repo_url', 'Must look like https://github.com/owner/repo'); hasErrors = true; }

  const roleTitleTyped = document.getElementById('role_title').value.trim() !== '';
  if (roleTitleTyped || rolePicker.skills.length > 0) {
    showFieldError('roles', 'You have a role that is not added yet. Click "Add role" or clear the role fields.');
    hasErrors = true;
  }

  if (hasErrors) {
    focusFirstError(form);
    return;
  }

  // 3. Send it
  const submitButton = document.getElementById('submit-button');
  submitButton.disabled = true;
  try {
    let saved;
    if (project.id) {
      saved = await callApi('PATCH', '/projects/' + project.id, data);
      showToast('Project updated');
    } else {
      saved = await callApi('POST', '/projects', data);
      showToast('Project published!');
    }
    goTo('/project/' + saved.id); // open the popup for the saved project
  } catch (error) {
    submitButton.disabled = false;

    // The server tells us which fields are wrong, e.g. { title: 'Max 80 characters' }
    const fieldNames = Object.keys(error.fields);
    if (fieldNames.length > 0) {
      for (const name of fieldNames) {
        // Names like "roles.0.title" belong to the "roles" field
        showFieldError(name.split('.')[0], error.fields[name]);
      }
      focusFirstError(form);
    } else {
      formError.textContent = error.message;
      formError.hidden = false;
      formError.scrollIntoView();
    }
  }
}
