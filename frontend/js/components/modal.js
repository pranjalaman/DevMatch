// ===== Project popup =====
// Shows all the details of one project on top of the feed.
//
// The popup is controlled by the page address:
//   #/project/7  -> router.js calls openProjectModal(7)
//   #/           -> router.js calls closeProjectModal()
// So to close the popup we just go back to '#/' with goTo('/').

let openProjectId = null; // id of the project shown in the popup, or null when closed

function openProjectModal(projectId) {
  closeProjectModal(false); // close any popup that is already open
  openProjectId = projectId;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
      <h2 id="modal-title" class="sr-only">Loading project</h2>
      <div class="sk sk-title"></div>
      <div class="sk sk-line"></div>
      <div class="sk sk-line"></div>
      <div class="sk sk-line short"></div>
    </div>`;

  // Clicking the dark area outside the popup closes it
  overlay.addEventListener('mousedown', function (event) {
    if (event.target === overlay) {
      goTo('/');
    }
  });

  document.body.appendChild(overlay);
  document.body.classList.add('modal-open'); // stops the page behind from scrolling
  document.getElementById('modal').focus();

  loadProjectIntoModal();
}

// returnFocus: move keyboard focus back to the card that opened the popup
function closeProjectModal(returnFocus) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    return;
  }
  overlay.remove();
  document.body.classList.remove('modal-open');

  if (returnFocus !== false) {
    const card = document.querySelector(`.card[data-id="${openProjectId}"]`);
    if (card) {
      card.focus();
    }
  }
  openProjectId = null;
}

async function loadProjectIntoModal() {
  const projectId = openProjectId;
  const modal = document.getElementById('modal');

  try {
    const project = await callApi('GET', '/projects/' + projectId);
    // While we were waiting, the user may have closed the popup or opened another one
    if (projectId !== openProjectId) {
      return;
    }
    drawModal(project);
  } catch (error) {
    if (projectId !== openProjectId) {
      return;
    }
    let title = 'Couldn’t load this project';
    let buttons = '<button class="btn btn-primary" type="button" id="modal-retry">Try again</button>';
    if (error.status === 404) {
      title = 'Project not found';
      buttons = '';
    }
    modal.innerHTML = closeButtonHtml() +
      `<h2 id="modal-title" class="sr-only">${title}</h2>` +
      messageBoxHtml(title, error.message, buttons + '<button class="btn" type="button" id="modal-back">Back to feed</button>', true);

    document.getElementById('modal-close').onclick = function () { goTo('/'); };
    document.getElementById('modal-back').onclick = function () { goTo('/'); };
    const retryButton = document.getElementById('modal-retry');
    if (retryButton) {
      retryButton.onclick = loadProjectIntoModal;
    }
  }
}

function closeButtonHtml() {
  return `<button class="btn icon-btn btn-sm modal-close" type="button" id="modal-close" aria-label="Close dialog">${icon('x', 16)}</button>`;
}

// Chip colours for the tech stack. Each skill always gets the same colour.
const CHIP_COLOURS = ['yellow', 'green', 'blue', 'pink', 'purple', 'orange'];

function chipColour(slug) {
  let total = 0;
  for (let i = 0; i < slug.length; i++) {
    total = total + slug.charCodeAt(i);
  }
  return CHIP_COLOURS[total % CHIP_COLOURS.length];
}

function drawModal(project) {
  const modal = document.getElementById('modal');
  const isOwner = currentUser !== null && project.owner.id === currentUser.id;
  const openRoleCount = project.roles.filter(function (role) { return !role.filled; }).length;

  // --- Tech stack chips ---
  let stackChips = '';
  for (const slug of project.skills) {
    stackChips += `<li class="chip chip-tag" data-tone="${chipColour(slug)}">${escapeHtml(skillLabel(slug))}</li>`;
  }

  // --- "Why it matches you" box ---
  let matchSection = '';
  if (project.match) {
    let bestRole = '';
    if (project.match.best_role) {
      bestRole = `<span>Best fit: <strong>${escapeHtml(project.match.best_role)}</strong></span>`;
    }
    const matchedNames = project.match.matched_skills.map(skillLabel).join(', ');
    matchSection = `
      <section class="modal-section">
        <h3>Why it matches you</h3>
        <div class="repo-stats">
          <span><strong>${project.match.score}%</strong> match</span>
          ${bestRole}
          <span>Skills: ${escapeHtml(matchedNames)}</span>
        </div>
      </section>`;
  }

  // --- GitHub repository stats ---
  let repoSection = '';
  if (project.repo_meta) {
    let refreshButton = '';
    if (isOwner) {
      refreshButton = `<button class="btn btn-sm" type="button" id="refresh-repo">${icon('refresh', 14)} Refresh</button>`;
    }
    let language = '';
    if (project.repo_meta.language) {
      language = `<span>${icon('code', 14)} ${escapeHtml(project.repo_meta.language)}</span>`;
    }
    repoSection = `
      <section class="modal-section">
        <h3>Repository</h3>
        <div class="repo-stats">
          <span>${icon('star', 14)} ${project.repo_meta.stars} stars</span>
          ${language}
          <span>${icon('clock', 14)} Last push ${formatDate(project.repo_meta.pushed_at)}</span>
          ${refreshButton}
        </div>
      </section>`;
  }

  // --- Roles ---
  let rolesHtml = '<p class="muted">No roles listed yet.</p>';
  if (project.roles.length > 0) {
    rolesHtml = '<ul class="role-list">';
    for (const role of project.roles) {
      const skillNames = role.skills.map(skillLabel).join(', ');

      let roleStatus = '<span class="status status-open">Open</span>';
      let filledClass = '';
      if (role.filled) {
        roleStatus = '<span class="status status-filled">Filled</span>';
        filledClass = 'is-filled';
      }

      // The owner gets a button to mark the role filled / open again
      let toggleButton = '';
      if (isOwner) {
        const buttonText = role.filled ? 'Reopen' : 'Mark filled';
        toggleButton = `<button class="btn btn-sm role-toggle" type="button" data-role-id="${role.id}" data-filled="${role.filled}">${buttonText}</button>`;
      }

      rolesHtml += `
        <li class="role-item ${filledClass}" id="role-${role.id}">
          <span class="role-icon">${icon('user', 16)}</span>
          <div>
            <p class="role-title">${escapeHtml(role.title)}</p>
            <p class="role-skills">Required skills: ${escapeHtml(skillNames)}</p>
          </div>
          <div class="role-side">${roleStatus}${toggleButton}</div>
        </li>`;
    }
    rolesHtml += '</ul>';
  }

  // --- Owner tools (edit / close / delete) ---
  let ownerSection = '';
  if (isOwner) {
    const statusButtonText = project.status === 'closed' ? 'Reopen project' : 'Close project';
    ownerSection = `
      <section class="modal-section">
        <h3>Manage project</h3>
        <div class="owner-tools">
          <span class="label">Only you can see this</span>
          <a class="btn btn-sm" href="#/edit/${project.id}">${icon('edit', 14)} Edit project</a>
          <button class="btn btn-sm" type="button" id="toggle-status">${statusButtonText}</button>
          <button class="btn btn-sm btn-danger" type="button" id="delete-project">${icon('trash', 14)} Delete</button>
        </div>
      </section>`;
  }

  // --- Contact and repo buttons at the bottom ---
  let contactButton;
  if (currentUser === null) {
    contactButton = `<a class="btn btn-primary" href="#/login" id="login-to-contact">${icon('lock', 16)} Log in to contact</a>`;
  } else if (project.contact_url && isWebLink(project.contact_url)) {
    contactButton = `<a class="btn btn-primary" href="${escapeHtml(project.contact_url)}" target="_blank" rel="noopener noreferrer">${icon('link', 16)} Contact lead</a>`;
  } else if (project.contact_email) {
    const subject = encodeURIComponent('DevMatch: ' + project.title);
    contactButton = `<a class="btn btn-primary" href="mailto:${escapeHtml(project.contact_email)}?subject=${subject}">${icon('mail', 16)} Contact lead</a>`;
  } else {
    contactButton = '<button class="btn btn-primary" type="button" disabled>No contact info</button>';
  }

  let repoButton = '<button class="btn" type="button" disabled>No repo linked</button>';
  if (project.repo_url && isWebLink(project.repo_url)) {
    repoButton = `<a class="btn" href="${escapeHtml(project.repo_url)}" target="_blank" rel="noopener noreferrer">${icon('github', 16)} View repo<span class="sr-only"> (opens in a new tab)</span></a>`;
  }

  const statusBadge = project.status === 'open'
    ? '<span class="status status-open">Open</span>'
    : '<span class="status status-closed">Closed</span>';

  // --- Put it all together ---
  modal.innerHTML = `
    ${closeButtonHtml()}
    <header class="modal-head">
      <h2 id="modal-title" class="modal-title">Project: ${escapeHtml(project.title)}</h2>
      <p class="modal-meta">
        <span>Posted: <strong>${formatMonthYear(project.created_at)}</strong></span>
        <span class="sep" aria-hidden="true">|</span>
        <span>${openRoleCount} open role${openRoleCount === 1 ? '' : 's'}</span>
        <span class="sep" aria-hidden="true">|</span>
        <span>Status: ${statusBadge}</span>
      </p>
      <p class="modal-meta">Lead: <strong>${escapeHtml(project.owner.name)}</strong></p>
    </header>

    <p class="modal-summary">${escapeHtml(project.summary)}</p>

    <section class="modal-section">
      <h3>Description</h3>
      <div class="desc-box">${escapeHtml(project.description)}</div>
    </section>

    <section class="modal-section">
      <h3>Tech Stack</h3>
      <ul class="chips">${stackChips}</ul>
    </section>

    ${matchSection}
    ${repoSection}

    <section class="modal-section">
      <h3>Roles</h3>
      ${rolesHtml}
    </section>

    ${ownerSection}

    <div class="modal-actions">
      ${contactButton}
      ${repoButton}
    </div>`;

  // --- Make the buttons work ---
  document.getElementById('modal-close').onclick = function () { goTo('/'); };

  const loginLink = document.getElementById('login-to-contact');
  if (loginLink) {
    // After logging in, come back to this project
    loginLink.onclick = function () {
      sessionStorage.setItem('afterLogin', '/project/' + project.id);
    };
  }

  if (isOwner) {
    setUpOwnerButtons(project);
    loadSuggestions(project.id);
  }
}

function setUpOwnerButtons(project) {
  document.querySelectorAll('.role-toggle').forEach(function (button) {
    button.onclick = function () {
      const isFilled = button.dataset.filled === 'true';
      runOwnerAction(button, 'PATCH', `/projects/${project.id}/roles/${button.dataset.roleId}`,
        { filled: !isFilled }, isFilled ? 'Role reopened' : 'Role marked as filled');
    };
  });

  const refreshButton = document.getElementById('refresh-repo');
  if (refreshButton) {
    refreshButton.onclick = function () {
      runOwnerAction(refreshButton, 'POST', `/projects/${project.id}/refresh-repo`, {}, 'Repository stats refreshed');
    };
  }

  const statusButton = document.getElementById('toggle-status');
  statusButton.onclick = function () {
    const newStatus = project.status === 'closed' ? 'open' : 'closed';
    runOwnerAction(statusButton, 'PATCH', '/projects/' + project.id, { status: newStatus },
      newStatus === 'open' ? 'Project reopened' : 'Project closed');
  };

  const deleteButton = document.getElementById('delete-project');
  deleteButton.onclick = async function () {
    const sure = confirm(`Delete "${project.title}"? This cannot be undone.`);
    if (!sure) {
      return;
    }
    deleteButton.disabled = true;
    try {
      await callApi('DELETE', '/projects/' + project.id);
      showToast('Project deleted');
      goTo('/');
      reloadFeedIfVisible();
    } catch (error) {
      deleteButton.disabled = false;
      showToast(error.message, 'error');
    }
  };
}

// Sends an owner change to the server, then redraws the popup and the feed
async function runOwnerAction(button, method, path, body, successMessage) {
  button.disabled = true;
  try {
    await callApi(method, path, body);
    showToast(successMessage);
    reloadFeedIfVisible();
    await loadProjectIntoModal();
    document.getElementById('modal').focus();
  } catch (error) {
    button.disabled = false;
    showToast(error.message, 'error');
  }
}

// Shows "suggested teammates" under each open role (owner only)
async function loadSuggestions(projectId) {
  try {
    const answer = await callApi('GET', `/projects/${projectId}/suggestions`);
    if (projectId !== openProjectId) {
      return;
    }

    for (const group of answer.roles) {
      const roleBox = document.getElementById('role-' + group.role_id);
      if (!roleBox) {
        continue;
      }

      let html = '<ul class="suggest-list">';
      if (group.suggestions.length === 0) {
        html += '<li class="label">No matching students yet</li>';
      } else {
        html += '<li class="label">Suggested teammates</li>';
      }
      for (const person of group.suggestions) {
        let chips = '';
        for (const slug of person.matched_skills) {
          chips += `<li class="chip chip-match">${escapeHtml(skillLabel(slug))}</li>`;
        }
        html += `
          <li class="suggest-item">
            <span><strong>${escapeHtml(person.name)}</strong>
              <span class="muted">· ${escapeHtml(branchName(person.branch))}, Year ${person.year}</span></span>
            <ul class="chips">${chips}</ul>
          </li>`;
      }
      html += '</ul>';

      // insertAdjacentHTML adds to the end WITHOUT redrawing the role (so its button keeps working)
      roleBox.insertAdjacentHTML('beforeend', html);
    }
  } catch (error) {
    // Suggestions are optional, so if they fail we just don't show them
  }
}

// Keyboard support for the popup:
//   Esc closes it
//   Tab stays inside it (it doesn't jump to the page behind)
document.addEventListener('keydown', function (event) {
  const modal = document.getElementById('modal');
  if (!modal) {
    return;
  }

  if (event.key === 'Escape') {
    goTo('/');
    return;
  }

  if (event.key === 'Tab') {
    const focusable = modal.querySelectorAll('a[href], button:not([disabled]), input, select, textarea');
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && (document.activeElement === first || document.activeElement === modal)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
