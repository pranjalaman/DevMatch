// ===== Feed page (#/) =====
// Search results, skill filter chips, the grid of project cards and page numbers.

// Skill chips shown above the cards
const POPULAR_SKILLS = ['python', 'react', 'javascript', 'machine-learning', 'fastapi', 'nodejs', 'figma', 'embedded', 'data-analysis', 'flutter', 'docker'];

// Counts how many times we asked for projects.
// If the user types fast, older answers can arrive late - we ignore those.
let feedRequestNumber = 0;

function showFeedPage() {
  // If the feed is already on screen (e.g. we just closed the popup), keep it as it is
  if (document.getElementById('feed-page')) {
    return;
  }

  mainArea.innerHTML = `
    <section id="feed-page" aria-labelledby="feed-title">
      <div class="page-head">
        <h1 id="feed-title" tabindex="-1">Project Feed</h1>
        <p>Discover campus projects and find the role that fits your skills.</p>
      </div>
      <div class="toolbar" id="feed-toolbar"></div>
      <p class="result-meta" id="feed-info" aria-live="polite"></p>
      <div class="grid" id="project-grid"></div>
      <nav class="pagination" id="feed-pages" aria-label="Pagination" hidden></nav>
    </section>`;

  drawFilters();
  loadProjects();
}

// Reload the cards, but only if the feed is the page on screen
function reloadFeedIfVisible() {
  if (document.getElementById('feed-page')) {
    drawFilters();
    loadProjects();
  }
}

// Which sort is being used right now: 'match' or 'new'
function currentSort() {
  if (feedFilters.sort !== '') {
    return feedFilters.sort;
  }
  if (userHasSkills()) {
    return 'match';
  }
  return 'new';
}

// ----- Filters (skill chips, open/closed, sort) -----

function drawFilters() {
  let chips = `<button class="filter-chip" type="button" data-skill="" aria-pressed="${feedFilters.skills.length === 0}">All</button>`;
  for (const slug of POPULAR_SKILLS) {
    const isOn = feedFilters.skills.includes(slug);
    chips += `<button class="filter-chip" type="button" data-skill="${slug}" aria-pressed="${isOn}">${escapeHtml(skillLabel(slug))}</button>`;
  }

  // "Best match / Newest" only makes sense when the user has skills
  let sortButtons = '';
  if (userHasSkills()) {
    sortButtons = `
      <div class="segmented" role="group" aria-label="Sort projects">
        <button type="button" data-sort="match" aria-pressed="${currentSort() === 'match'}">Best match</button>
        <button type="button" data-sort="new" aria-pressed="${currentSort() === 'new'}">Newest</button>
      </div>`;
  }

  const toolbar = document.getElementById('feed-toolbar');
  toolbar.innerHTML = `
    <div class="filter-chips" role="group" aria-label="Filter by skill">${chips}</div>
    <div class="toolbar-controls">
      <select class="select" id="status-filter" aria-label="Project status">
        <option value="open">Open projects</option>
        <option value="closed">Closed projects</option>
      </select>
      ${sortButtons}
    </div>`;

  // Skill chips
  toolbar.querySelectorAll('.filter-chip').forEach(function (button) {
    button.onclick = function () {
      toggleSkillFilter(button.dataset.skill);
    };
  });

  // Open / closed dropdown
  const statusFilter = document.getElementById('status-filter');
  statusFilter.value = feedFilters.status;
  statusFilter.onchange = function () {
    feedFilters.status = statusFilter.value;
    feedFilters.page = 1;
    loadProjects();
  };

  // Sort buttons
  toolbar.querySelectorAll('[data-sort]').forEach(function (button) {
    button.onclick = function () {
      feedFilters.sort = button.dataset.sort;
      feedFilters.page = 1;
      drawFilters();
      loadProjects();
    };
  });
}

function toggleSkillFilter(slug) {
  if (slug === '') {
    feedFilters.skills = []; // "All" clears every skill filter
  } else if (feedFilters.skills.includes(slug)) {
    feedFilters.skills = feedFilters.skills.filter(function (s) { return s !== slug; });
  } else {
    feedFilters.skills.push(slug);
  }
  feedFilters.page = 1;

  drawFilters();
  // Redrawing removed the button the user clicked, so put keyboard focus back on it
  document.querySelector(`.filter-chip[data-skill="${slug}"]`).focus();
  loadProjects();
}

function clearFilters() {
  resetFeedFilters();
  document.getElementById('search-input').value = '';
  drawFilters();
  loadProjects();
}

// ----- Loading and drawing the cards -----

async function loadProjects() {
  feedRequestNumber = feedRequestNumber + 1;
  const thisRequest = feedRequestNumber;

  const grid = document.getElementById('project-grid');
  const info = document.getElementById('feed-info');

  // Show grey placeholder cards while we wait
  grid.setAttribute('aria-busy', 'true');
  grid.innerHTML = loadingCardsHtml(6);
  info.textContent = 'Loading projects…';
  document.getElementById('feed-pages').hidden = true;

  // Build the address, e.g. /projects?q=bus&skill=python&status=open&page=1&page_size=12
  const params = new URLSearchParams();
  if (feedFilters.search !== '') {
    params.append('q', feedFilters.search);
  }
  for (const slug of feedFilters.skills) {
    params.append('skill', slug);
  }
  params.append('status', feedFilters.status);
  if (feedFilters.sort !== '') {
    params.append('sort', feedFilters.sort);
  }
  params.append('page', feedFilters.page);
  params.append('page_size', PAGE_SIZE);

  try {
    const answer = await callApi('GET', '/projects?' + params.toString());
    if (thisRequest !== feedRequestNumber) {
      return; // a newer request was started, so ignore this old answer
    }
    drawProjects(answer);
  } catch (error) {
    if (thisRequest !== feedRequestNumber) {
      return;
    }
    info.textContent = '';
    grid.innerHTML = messageBoxHtml('Couldn’t load projects', error.message,
      `<button class="btn btn-primary" type="button" id="feed-retry">${icon('refresh', 16)} Try again</button>`, true);
    document.getElementById('feed-retry').onclick = loadProjects;
  }
  grid.removeAttribute('aria-busy');
}

function drawProjects(answer) {
  const grid = document.getElementById('project-grid');
  const info = document.getElementById('feed-info');

  // Nothing found
  if (answer.items.length === 0) {
    info.textContent = '';
    const hasFilters = feedFilters.search !== '' || feedFilters.skills.length > 0 || feedFilters.status !== 'open';

    if (hasFilters) {
      grid.innerHTML = messageBoxHtml('No projects match your filters',
        'Try removing a skill filter or searching for something else.',
        '<button class="btn btn-primary" type="button" id="clear-filters">Clear filters</button>', false);
      document.getElementById('clear-filters').onclick = clearFilters;
    } else {
      grid.innerHTML = messageBoxHtml('No projects yet', 'Be the first to post a project and find your teammates.',
        `<a class="btn btn-primary" href="#/new">${icon('plus', 16)} Post a project</a>`, false);
    }
    return;
  }

  // Some projects found
  let sortText = 'newest first';
  if (currentSort() === 'match') {
    sortText = 'best match first';
  }
  info.textContent = `${answer.total} project${answer.total === 1 ? '' : 's'} · ${sortText}`;

  let cardsHtml = '';
  for (const project of answer.items) {
    cardsHtml += projectCardHtml(project);
  }
  grid.innerHTML = cardsHtml;

  const totalPages = Math.ceil(answer.total / PAGE_SIZE);
  drawPageNumbers(totalPages);
}

// ----- Page numbers at the bottom -----

function drawPageNumbers(totalPages) {
  const nav = document.getElementById('feed-pages');
  if (totalPages <= 1) {
    nav.hidden = true;
    return;
  }

  const page = feedFilters.page;
  let buttons = `<li><button class="page-btn" type="button" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>Prev</button></li>`;
  for (let number = 1; number <= totalPages; number++) {
    const current = number === page ? 'aria-current="page"' : '';
    buttons += `<li><button class="page-btn" type="button" data-page="${number}" aria-label="Page ${number}" ${current}>${number}</button></li>`;
  }
  buttons += `<li><button class="page-btn" type="button" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next</button></li>`;

  nav.innerHTML = `
    <p class="page-info">Page ${page} of ${totalPages}</p>
    <ul class="page-list">${buttons}</ul>`;
  nav.hidden = false;

  nav.querySelectorAll('.page-btn').forEach(function (button) {
    button.onclick = function () {
      feedFilters.page = Number(button.dataset.page);
      loadProjects();
      window.scrollTo(0, 0);
      document.getElementById('feed-title').focus();
    };
  });
}
