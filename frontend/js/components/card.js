// ===== Project card =====
// Builds the HTML for one project card in the feed.

function projectCardHtml(project) {
  // Tech stack chips: show the first 4, then "+N" for the rest
  const firstSkills = project.skills.slice(0, 4);
  const extraCount = project.skills.length - firstSkills.length;
  let skillChips = '';
  for (const slug of firstSkills) {
    skillChips += `<li class="chip">${escapeHtml(skillLabel(slug))}</li>`;
  }
  if (extraCount > 0) {
    skillChips += `<li class="chip chip-more">+${extraCount}<span class="sr-only"> more</span></li>`;
  }

  // Match badge and "your matching skills" (only when logged in with skills)
  let matchBadge = '';
  let matchedSkills = '<div class="card-foot-spacer"></div>';
  if (project.match) {
    matchBadge = `<span class="match-badge">${project.match.score}% match</span>`;

    if (project.match.matched_skills.length > 0) {
      let chips = '';
      for (const slug of project.match.matched_skills) {
        chips += `<li class="chip chip-match">${icon('check', 12)} ${escapeHtml(skillLabel(slug))}</li>`;
      }
      matchedSkills = `
        <div class="card-matched">
          <span class="label">Your matching skills</span>
          <ul class="chips">${chips}</ul>
        </div>`;
    }
  }

  let closedBadge = '';
  if (project.status === 'closed') {
    closedBadge = '<span><span class="status status-closed">Closed</span></span>';
  }

  return `
    <a class="card" href="#/project/${project.id}" data-id="${project.id}">
      <div class="card-top">
        <h3 class="card-title">${escapeHtml(project.title)}</h3>
        ${matchBadge}
      </div>
      ${closedBadge}

      <span class="label">Summary</span>
      <p class="card-summary">${escapeHtml(project.summary)}</p>

      <span class="label">Tech stack</span>
      <ul class="chips" aria-label="Tech stack">${skillChips}</ul>

      ${matchedSkills}

      <div class="card-foot">
        <span class="card-roles">Open roles: <span class="count-badge">${project.open_roles}</span></span>
        <span class="card-lead">Lead: <strong>${escapeHtml(project.owner.name)}</strong></span>
      </div>
    </a>`;
}
