// ===== Router =====
// Decides which page to show based on the part of the address after '#'.
//   index.html#/            -> feed
//   index.html#/project/7   -> feed + popup for project 7
//   index.html#/new         -> new project form
//   index.html#/edit/7      -> edit project 7
//   index.html#/profile     -> profile
//   index.html#/login       -> log in
//   index.html#/signup      -> sign up

// '#/project/7' -> '/project/7'
function getRoute() {
  const route = location.hash.slice(1); // remove the '#'
  if (route === '') {
    return '/';
  }
  return route;
}

// Go to another page, e.g. goTo('/profile')
function goTo(route) {
  if (getRoute() === route) {
    showPage(); // same address: the browser won't notice, so redraw ourselves
  } else {
    location.hash = route; // the 'hashchange' event below will call showPage()
  }
}

// Pages that need a logged-in user call this first.
// It returns true if the user is logged in, otherwise sends them to the login page.
function requireLogin() {
  if (currentUser !== null) {
    return true;
  }
  sessionStorage.setItem('afterLogin', getRoute()); // come back here after logging in
  showToast('Please log in to continue.', 'info');
  goTo('/login');
  return false;
}

function showPage() {
  const route = getRoute();
  const parts = route.split('/'); // '/edit/7' -> ['', 'edit', '7']

  // The popup only belongs on #/project/... addresses
  if (parts[1] !== 'project') {
    closeProjectModal();
  }

  if (route === '/') {
    showFeedPage();
  } else if (parts[1] === 'project' && Number(parts[2]) > 0) {
    showFeedPage();
    openProjectModal(Number(parts[2]));
  } else if (route === '/new') {
    if (requireLogin()) {
      window.scrollTo(0, 0);
      showProjectForm(null);
    }
  } else if (parts[1] === 'edit' && Number(parts[2]) > 0) {
    if (requireLogin()) {
      window.scrollTo(0, 0);
      showProjectForm(Number(parts[2]));
    }
  } else if (route === '/profile') {
    if (requireLogin()) {
      window.scrollTo(0, 0);
      showProfilePage();
    }
  } else if (route === '/login') {
    showLoginPage();
  } else if (route === '/signup') {
    showSignupPage();
  } else {
    mainArea.innerHTML = messageBoxHtml('Page not found', 'That link doesn’t lead anywhere.',
      '<a class="btn btn-primary" href="#/">Go to feed</a>', false);
  }
}

window.addEventListener('hashchange', showPage);
