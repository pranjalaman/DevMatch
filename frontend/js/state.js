// ===== App state =====
// Global variables that every page of the app can read and change.

// The logged-in user, for example:
// { id: 1, name: 'Priya', email: 'priya@x.com', branch: 'CSE', year: 2, skills: ['python', 'react'] }
// It is null when nobody is logged in.
let currentUser = null;

// Every skill the app knows about, for example: [{ slug: 'python', label: 'Python' }, ...]
let allSkills = [];

// What the user has chosen on the feed page.
let feedFilters = {
  search: '',   // text typed in the search bar
  skills: [],   // skill chips that are switched on
  status: 'open',
  sort: '',     // '' means "let the server decide"
  page: 1,
};

// How many project cards to show on one page
const PAGE_SIZE = 12;

// The <main> element. Every page of the app is drawn inside it.
const mainArea = document.getElementById('main');

function resetFeedFilters() {
  feedFilters = { search: '', skills: [], status: 'open', sort: '', page: 1 };
}

function userHasSkills() {
  return currentUser !== null && currentUser.skills.length > 0;
}
