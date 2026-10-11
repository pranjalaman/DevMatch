// ===== Log in (#/login) and Sign up (#/signup) pages =====

function showLoginPage() {
  // Already logged in? Go to the feed.
  if (currentUser !== null) {
    goTo('/');
    return;
  }

  mainArea.innerHTML = `
    <section class="panel auth-card" aria-labelledby="auth-title">
      <h1 id="auth-title">Welcome back</h1>
      <p>Log in to see contact details and your matches.</p>
      <form class="form" id="login-form" novalidate>
        <div class="form-error" id="form-error" role="alert" hidden></div>
        ${fieldHtml('email', 'Email', '<input class="input" id="email" type="email" autocomplete="email" placeholder="you@example.com" aria-describedby="email-error">')}
        ${fieldHtml('password', 'Password', '<input class="input" id="password" type="password" autocomplete="current-password" aria-describedby="password-error">')}
        <button class="btn btn-primary btn-lg btn-block" type="submit" id="submit-button">Log in</button>
      </form>
      <p class="auth-switch">New to DevMatch? <a href="#/signup">Create an account</a></p>
    </section>`;

  document.getElementById('email').focus();
  document.getElementById('login-form').addEventListener('submit', submitLogin);
}

async function submitLogin(event) {
  event.preventDefault();
  const form = document.getElementById('login-form');
  const formError = document.getElementById('form-error');
  clearFieldErrors(form);
  formError.hidden = true;

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  let hasErrors = false;
  if (!isValidEmail(email)) { showFieldError('email', 'Enter a valid email address'); hasErrors = true; }
  if (password === '') { showFieldError('password', 'Enter your password'); hasErrors = true; }
  if (hasErrors) {
    focusFirstError(form);
    return;
  }

  const submitButton = document.getElementById('submit-button');
  submitButton.disabled = true;
  try {
    await callApi('POST', '/auth/login', { email: email, password: password });
    currentUser = await callApi('GET', '/me');
    drawHeader();
    showToast('Welcome back, ' + currentUser.name.split(' ')[0] + '!');

    // Go back to where the user was before logging in (if we saved it)
    const nextPage = sessionStorage.getItem('afterLogin') || '/';
    sessionStorage.removeItem('afterLogin');
    goTo(nextPage);
  } catch (error) {
    submitButton.disabled = false;
    formError.textContent = error.status === 401 ? 'Invalid email or password.' : error.message;
    formError.hidden = false;
  }
}

function showSignupPage() {
  if (currentUser !== null) {
    goTo('/');
    return;
  }

  let branchOptions = '<option value="">Select branch</option>';
  for (const branch of BRANCHES) {
    branchOptions += `<option value="${branch.code}">${branch.name}</option>`;
  }

  let yearOptions = '<option value="">Select year</option>';
  for (let year = 1; year <= 5; year++) {
    yearOptions += `<option value="${year}">Year ${year}</option>`;
  }

  mainArea.innerHTML = `
    <section class="panel auth-card" aria-labelledby="auth-title">
      <h1 id="auth-title">Create your account</h1>
      <p>Join DevMatch to find projects that fit your skills.</p>
      <form class="form" id="signup-form" novalidate>
        <div class="form-error" id="form-error" role="alert" hidden></div>
        ${fieldHtml('name', 'Full name', '<input class="input" id="name" autocomplete="name" placeholder="e.g. Priya Singh" aria-describedby="name-error">')}
        ${fieldHtml('email', 'Email', '<input class="input" id="email" type="email" autocomplete="email" placeholder="you@example.com" aria-describedby="email-error">')}
        ${fieldHtml('password', 'Password', '<input class="input" id="password" type="password" autocomplete="new-password" aria-describedby="password-error">', 'At least 8 characters.')}
        <div class="form-row">
          ${fieldHtml('branch', 'Branch', `<select class="select select-block" id="branch" aria-describedby="branch-error">${branchOptions}</select>`)}
          ${fieldHtml('year', 'Year', `<select class="select select-block" id="year" aria-describedby="year-error">${yearOptions}</select>`)}
        </div>
        <button class="btn btn-primary btn-lg btn-block" type="submit" id="submit-button">Create account</button>
      </form>
      <p class="auth-switch">Already have an account? <a href="#/login">Log in</a></p>
    </section>`;

  document.getElementById('name').focus();
  document.getElementById('signup-form').addEventListener('submit', submitSignup);
}

async function submitSignup(event) {
  event.preventDefault();
  const form = document.getElementById('signup-form');
  const formError = document.getElementById('form-error');
  clearFieldErrors(form);
  formError.hidden = true;

  const data = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value,
    branch: document.getElementById('branch').value,
    year: Number(document.getElementById('year').value),
  };

  let hasErrors = false;
  if (data.name === '') { showFieldError('name', 'Enter your name'); hasErrors = true; }
  if (!isValidEmail(data.email)) { showFieldError('email', 'Enter a valid email address'); hasErrors = true; }
  if (data.password.length < 8) { showFieldError('password', 'Use at least 8 characters'); hasErrors = true; }
  if (data.branch === '') { showFieldError('branch', 'Select your branch'); hasErrors = true; }
  if (data.year === 0) { showFieldError('year', 'Select your year'); hasErrors = true; }
  if (hasErrors) {
    focusFirstError(form);
    return;
  }

  const submitButton = document.getElementById('submit-button');
  submitButton.disabled = true;
  try {
    await callApi('POST', '/auth/signup', data);
    currentUser = await callApi('GET', '/me');
    drawHeader();
    showToast('Welcome to DevMatch! Add your skills to get matched.');
    goTo('/profile');
  } catch (error) {
    submitButton.disabled = false;
    if (error.status === 409) {
      showFieldError('email', 'An account with this email already exists.');
      focusFirstError(form);
      return;
    }
    const fieldNames = Object.keys(error.fields);
    if (fieldNames.length > 0) {
      for (const name of fieldNames) {
        showFieldError(name, error.fields[name]);
      }
      focusFirstError(form);
    } else {
      formError.textContent = error.message;
      formError.hidden = false;
    }
  }
}
