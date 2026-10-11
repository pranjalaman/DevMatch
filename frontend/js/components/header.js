// ===== Header =====
// The bar at the top: logo, search box, "+" button and the login / account menu.
// Call drawHeader() again whenever someone logs in or out.

let searchTimer = null;

function drawHeader() {
  let rightSide;

  if (currentUser === null) {
    rightSide = `
      <a class="btn icon-btn" href="#/new" aria-label="Post a new project" title="Post a new project">${icon('plus')}</a>
      <a class="btn btn-sm btn-ghost hide-sm" href="#/login">Log in</a>
      <a class="btn btn-sm btn-primary" href="#/signup">Sign up</a>`;
  } else {
    rightSide = `
      <a class="btn icon-btn" href="#/new" aria-label="Post a new project" title="Post a new project">${icon('plus')}</a>
      <div class="user-menu-wrap" id="user-menu-wrap">
        <button class="btn menu-btn" type="button" id="menu-button" aria-expanded="false" aria-controls="user-menu"
          aria-label="Account menu for ${escapeHtml(currentUser.name)}">
          <span class="avatar">${escapeHtml(getInitials(currentUser.name))}</span>
          ${icon('chevronDown', 16)}
        </button>
        <div class="menu" id="user-menu" hidden>
          <div class="menu-head">
            <strong>${escapeHtml(currentUser.name)}</strong>
            <span>${escapeHtml(currentUser.email)}</span>
          </div>
          <a class="menu-item" href="#/profile">${icon('user', 16)} Profile &amp; skills</a>
          <a class="menu-item" href="#/new">${icon('plus', 16)} Post a project</a>
          <button class="menu-item" type="button" id="logout-button">${icon('logout', 16)} Log out</button>
        </div>
      </div>`;
  }

  document.getElementById('header').innerHTML = `
    <div class="container header-inner">
      <a class="brand" href="#/" aria-label="DevMatch home">
        <span class="brand-mark">${icon('code')}</span>
        <span class="brand-text">DevMatch</span>
      </a>
      <form class="search" role="search" id="search-form">
        ${icon('search', 16)}
        <input class="input" type="search" id="search-input" placeholder="Search projects…"
          aria-label="Search projects by title or summary" autocomplete="off">
      </form>
      <div class="header-actions">${rightSide}</div>
    </div>`;

  // --- Search box ---
  const searchInput = document.getElementById('search-input');
  searchInput.value = feedFilters.search;

  // Wait until the user stops typing for 300ms before searching
  searchInput.addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      runSearch(searchInput.value);
    }, 300);
  });

  document.getElementById('search-form').addEventListener('submit', function (event) {
    event.preventDefault();
    clearTimeout(searchTimer);
    runSearch(searchInput.value);
  });

  // --- Account menu ---
  const menuButton = document.getElementById('menu-button');
  if (menuButton) {
    menuButton.onclick = function () {
      const menu = document.getElementById('user-menu');
      menu.hidden = !menu.hidden;
      menuButton.setAttribute('aria-expanded', String(!menu.hidden));
    };
    document.getElementById('logout-button').onclick = logOut;
    document.querySelectorAll('#user-menu a').forEach(function (link) {
      link.addEventListener('click', closeUserMenu);
    });
  }
}

function closeUserMenu() {
  const menu = document.getElementById('user-menu');
  if (menu) {
    menu.hidden = true;
    document.getElementById('menu-button').setAttribute('aria-expanded', 'false');
  }
}

// Close the account menu when clicking anywhere else, or pressing Esc
document.addEventListener('click', function (event) {
  const wrap = document.getElementById('user-menu-wrap');
  if (wrap && !wrap.contains(event.target)) {
    closeUserMenu();
  }
});
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeUserMenu();
  }
});

function runSearch(text) {
  const search = text.trim();
  if (search === feedFilters.search) {
    return; // nothing changed
  }
  feedFilters.search = search;
  feedFilters.page = 1;

  reloadFeedIfVisible();
  if (getRoute() !== '/') {
    goTo('/'); // show the feed if we're on another page
  }
}

async function logOut() {
  try {
    await callApi('POST', '/auth/logout', {});
  } catch (error) {
    showToast(error.message, 'error');
    return;
  }
  currentUser = null;
  drawHeader();
  showToast('You’ve been logged out', 'info');
  mainArea.innerHTML = ''; // forces the feed to be drawn again without match scores
  goTo('/');
}
