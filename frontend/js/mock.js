// ===== Demo server =====
// When the real backend is not running, the app talks to this fake server instead.
// It pretends to be the API from SPEC.md section 8 and keeps its data in localStorage.
// Passwords are stored as plain text here, so it is ONLY for demos.

const DEMO_SKILLS = [
  { slug: 'python', label: 'Python' }, { slug: 'flask', label: 'Flask' }, { slug: 'fastapi', label: 'FastAPI' },
  { slug: 'django', label: 'Django' }, { slug: 'javascript', label: 'JavaScript' }, { slug: 'typescript', label: 'TypeScript' },
  { slug: 'react', label: 'React' }, { slug: 'nextjs', label: 'Next.js' }, { slug: 'vue', label: 'Vue' },
  { slug: 'nodejs', label: 'Node.js' }, { slug: 'express', label: 'Express' }, { slug: 'html', label: 'HTML' },
  { slug: 'css', label: 'CSS' }, { slug: 'tailwind', label: 'Tailwind' }, { slug: 'sql', label: 'SQL' },
  { slug: 'postgresql', label: 'PostgreSQL' }, { slug: 'mongodb', label: 'MongoDB' }, { slug: 'firebase', label: 'Firebase' },
  { slug: 'redis', label: 'Redis' }, { slug: 'git', label: 'Git' }, { slug: 'github', label: 'GitHub' },
  { slug: 'docker', label: 'Docker' }, { slug: 'linux', label: 'Linux' }, { slug: 'aws', label: 'AWS' },
  { slug: 'c', label: 'C' }, { slug: 'c++', label: 'C++' }, { slug: 'java', label: 'Java' },
  { slug: 'kotlin', label: 'Kotlin' }, { slug: 'flutter', label: 'Flutter' }, { slug: 'dart', label: 'Dart' },
  { slug: 'android', label: 'Android' }, { slug: 'machine-learning', label: 'Machine Learning' },
  { slug: 'deep-learning', label: 'Deep Learning' }, { slug: 'pytorch', label: 'PyTorch' },
  { slug: 'tensorflow', label: 'TensorFlow' }, { slug: 'nlp', label: 'NLP' }, { slug: 'pandas', label: 'Pandas' },
  { slug: 'numpy', label: 'NumPy' }, { slug: 'opencv', label: 'OpenCV' }, { slug: 'data-analysis', label: 'Data Analysis' },
  { slug: 'figma', label: 'Figma' }, { slug: 'ui-design', label: 'UI Design' },
  { slug: 'technical-writing', label: 'Technical Writing' }, { slug: 'embedded', label: 'Embedded' },
  { slug: 'arduino', label: 'Arduino' }, { slug: 'raspberry-pi', label: 'Raspberry Pi' }, { slug: 'iot', label: 'IoT' },
  { slug: 'matlab', label: 'MATLAB' }, { slug: 'autocad', label: 'AutoCAD' }, { slug: 'solidity', label: 'Solidity' },
  { slug: 'rust', label: 'Rust' }, { slug: 'go', label: 'Go' },
];

// A date that was `days` days ago, in the format the API uses
function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

// The starting demo data: 12 students and 16 projects
function makeDemoData() {
  const users = [
    { id: 1, name: 'Demo Student', email: 'demo@devmatch.dev', branch: 'CSE', year: 2, skills: ['python', 'fastapi', 'react', 'postgresql', 'git'] },
    { id: 2, name: 'Aarav Kumar', email: 'aarav@devmatch.dev', branch: 'CSE', year: 3, skills: ['react', 'typescript', 'nodejs', 'figma'] },
    { id: 3, name: 'Priya Singh', email: 'priya@devmatch.dev', branch: 'ECE', year: 2, skills: ['embedded', 'arduino', 'c', 'python'] },
    { id: 4, name: 'Rohan Mehta', email: 'rohan@devmatch.dev', branch: 'IT', year: 4, skills: ['machine-learning', 'python', 'pandas', 'numpy'] },
    { id: 5, name: 'Sneha Verma', email: 'sneha@devmatch.dev', branch: 'ME', year: 3, skills: ['autocad', 'matlab', 'python'] },
    { id: 6, name: 'Ishaan Gupta', email: 'ishaan@devmatch.dev', branch: 'CSE', year: 1, skills: ['html', 'css', 'javascript'] },
    { id: 7, name: 'Ananya Rao', email: 'ananya@devmatch.dev', branch: 'EE', year: 2, skills: ['raspberry-pi', 'python', 'linux', 'iot'] },
    { id: 8, name: 'Kabir Das', email: 'kabir@devmatch.dev', branch: 'IT', year: 3, skills: ['docker', 'linux', 'postgresql', 'fastapi'] },
    { id: 9, name: 'Meera Iyer', email: 'meera@devmatch.dev', branch: 'CSE', year: 4, skills: ['figma', 'ui-design', 'technical-writing'] },
    { id: 10, name: 'Vikram Patel', email: 'vikram@devmatch.dev', branch: 'CE', year: 2, skills: ['data-analysis', 'python', 'sql'] },
    { id: 11, name: 'Neha Sharma', email: 'neha@devmatch.dev', branch: 'MIN', year: 1, skills: ['python', 'react', 'css'] },
    { id: 12, name: 'Arjun Nair', email: 'arjun@devmatch.dev', branch: 'ECE', year: 3, skills: ['flutter', 'dart', 'firebase', 'android'] },
  ];

  // Every demo account has the same password
  for (const user of users) {
    user.password = 'demo1234';
  }

  const projects = [
    {
      id: 1, owner_id: 8, created_at: daysAgo(1), status: 'open',
      title: 'Campus Bus Tracker',
      summary: 'Live location of college buses with ETA predictions for every stop on campus routes.',
      description: 'Students waste time waiting at stops without knowing where the bus is. We are building a GPS-based tracker: drivers run a lightweight app that pushes location, and students see a live map with ETAs.\n\nPhase 1: FastAPI backend + PostgreSQL for routes and pings.\nPhase 2: React map UI with stop-level ETAs.\nPhase 3: Push notifications when your bus is 5 minutes away.',
      skills: ['python', 'fastapi', 'postgresql', 'react'],
      roles: [
        { id: 1, title: 'Backend dev', skills: ['python', 'fastapi', 'postgresql'], filled: false },
        { id: 2, title: 'Frontend dev', skills: ['react', 'css'], filled: false },
      ],
      repo_url: 'https://github.com/devmatch-demo/bus-tracker',
      repo_meta: { stars: 14, language: 'Python', pushed_at: daysAgo(3) },
    },
    {
      id: 2, owner_id: 4, created_at: daysAgo(2), status: 'open',
      title: 'AI Code Review Assistant',
      summary: 'An ML model that flags common bugs and style issues in student assignments before submission.',
      description: 'A VS Code extension + API that runs a fine-tuned model over submitted code and highlights likely bugs, missing edge cases, and style issues with explanations.\n\nWe already have a labelled dataset of ~4k snippets from previous lab submissions.',
      skills: ['python', 'machine-learning', 'fastapi', 'docker', 'nlp'],
      roles: [
        { id: 3, title: 'ML engineer', skills: ['python', 'machine-learning', 'pandas'], filled: false },
        { id: 4, title: 'API developer', skills: ['fastapi', 'docker'], filled: false },
      ],
      repo_url: 'https://github.com/devmatch-demo/code-review-ai',
      repo_meta: { stars: 31, language: 'Python', pushed_at: daysAgo(4) },
    },
    {
      id: 3, owner_id: 2, created_at: daysAgo(3), status: 'open',
      title: 'Hostel Mess Feedback App',
      summary: 'Rate daily meals, suggest menu changes, and give the mess committee real data.',
      description: 'Simple mobile-first web app: students rate each meal (1-5), add comments, and vote on next week\'s menu. The mess committee gets a weekly dashboard with trends.',
      skills: ['react', 'nodejs', 'express', 'mongodb'],
      roles: [
        { id: 5, title: 'Backend developer', skills: ['nodejs', 'express', 'mongodb'], filled: false },
        { id: 6, title: 'UI designer', skills: ['figma', 'ui-design'], filled: false },
      ],
    },
    {
      id: 4, owner_id: 3, created_at: daysAgo(4), status: 'open',
      title: 'Smart Irrigation Controller',
      summary: 'Soil-moisture driven irrigation for the college garden using low-cost sensors.',
      description: 'Arduino nodes read soil moisture and temperature and decide when to open a solenoid valve. A small dashboard shows water usage per bed.\n\nHardware is sponsored by the robotics club.',
      skills: ['arduino', 'embedded', 'c', 'python', 'iot'],
      roles: [
        { id: 7, title: 'Firmware developer', skills: ['embedded', 'c', 'arduino'], filled: false },
        { id: 8, title: 'Dashboard developer', skills: ['python', 'flask'], filled: false },
      ],
      repo_url: 'https://github.com/devmatch-demo/smart-irrigation',
      repo_meta: { stars: 6, language: 'C++', pushed_at: daysAgo(6) },
    },
    {
      id: 5, owner_id: 6, created_at: daysAgo(5), status: 'open',
      title: 'BIT Sindri Notes Hub',
      summary: 'Organised, searchable notes and previous-year papers for every branch and semester.',
      description: 'A simple site where seniors upload notes and PYQs, tagged by branch, semester and subject. Firebase for storage and login; search on titles.',
      skills: ['html', 'css', 'javascript', 'firebase'],
      roles: [
        { id: 9, title: 'Frontend developer', skills: ['javascript', 'css'], filled: false },
        { id: 10, title: 'Content curator', skills: ['technical-writing'], filled: false },
      ],
    },
    {
      id: 6, owner_id: 10, created_at: daysAgo(6), status: 'open',
      title: 'Placement Stats Dashboard',
      summary: 'Interactive dashboard of placement data by branch, company, and package over the years.',
      description: 'We have cleaned CSVs of the last 6 years of placement data. Goal: an interactive dashboard with filters and trend charts so juniors can make informed choices.',
      skills: ['python', 'pandas', 'data-analysis', 'react'],
      roles: [
        { id: 11, title: 'Data analyst', skills: ['pandas', 'data-analysis'], filled: false },
        { id: 12, title: 'Frontend developer', skills: ['react', 'typescript'], filled: false },
      ],
    },
    {
      id: 7, owner_id: 1, created_at: daysAgo(7), status: 'open',
      title: 'Lab Equipment Booking',
      summary: 'Book oscilloscopes, 3D printers and lab slots without the paper register.',
      description: 'Departments still use a paper register to book shared equipment. This app lets students reserve slots, lab assistants approve them, and everyone see availability in a calendar.',
      skills: ['fastapi', 'postgresql', 'react', 'docker'],
      roles: [
        { id: 13, title: 'Backend developer', skills: ['python', 'fastapi'], filled: true },
        { id: 14, title: 'Frontend developer', skills: ['react', 'typescript', 'css'], filled: false },
        { id: 15, title: 'DevOps', skills: ['docker', 'linux'], filled: false },
      ],
      repo_url: 'https://github.com/devmatch-demo/lab-booking',
      repo_meta: { stars: 9, language: 'TypeScript', pushed_at: daysAgo(9) },
    },
    {
      id: 8, owner_id: 5, created_at: daysAgo(8), status: 'open',
      title: 'CAD Model Library',
      summary: 'A shared library of reusable CAD parts for mechanical and civil projects.',
      description: 'Upload, preview and download AutoCAD/STEP parts with tags and version history. Django backend with a simple viewer.',
      skills: ['autocad', 'python', 'django'],
      roles: [
        { id: 16, title: 'Django developer', skills: ['python', 'django'], filled: false },
      ],
    },
    {
      id: 9, owner_id: 12, created_at: daysAgo(9), status: 'open',
      title: 'Event Check-in with QR',
      summary: 'Fast QR-based check-in for fests and club events, works offline at the gate.',
      description: 'Organisers scan attendee QR codes with a Flutter app; check-ins sync to Firebase when online. Includes a live headcount screen for the stage.',
      skills: ['flutter', 'dart', 'firebase', 'android'],
      roles: [
        { id: 17, title: 'Mobile developer', skills: ['flutter', 'dart'], filled: false },
        { id: 18, title: 'Backend (Firebase)', skills: ['firebase'], filled: false },
      ],
    },
    {
      id: 10, owner_id: 7, created_at: daysAgo(10), status: 'open',
      title: 'Air Quality Monitor',
      summary: 'Raspberry Pi sensor stations reporting PM2.5 and CO2 levels around campus.',
      description: 'Deploy 5 sensor stations near hostels and academic blocks, publish readings every minute, and show trends and alerts.',
      skills: ['raspberry-pi', 'python', 'linux', 'data-analysis', 'iot'],
      roles: [
        { id: 19, title: 'Hardware lead', skills: ['raspberry-pi', 'linux'], filled: false },
        { id: 20, title: 'Data visualisation', skills: ['python', 'data-analysis'], filled: false },
      ],
    },
    {
      id: 11, owner_id: 6, created_at: daysAgo(11), status: 'open',
      title: 'Library Seat Finder',
      summary: 'Computer vision counts free seats in the central library in real time.',
      description: 'A ceiling camera feeds an OpenCV program that detects occupied seats. Students check a web page before walking over.',
      skills: ['python', 'opencv', 'javascript', 'nodejs'],
      roles: [
        { id: 21, title: 'CV engineer', skills: ['opencv', 'python'], filled: false },
        { id: 22, title: 'Web developer', skills: ['javascript', 'nodejs'], filled: false },
      ],
    },
    {
      id: 12, owner_id: 9, created_at: daysAgo(12), status: 'open',
      title: 'Alumni Mentorship Portal',
      summary: 'Connect juniors with alumni mentors by domain, company and availability.',
      description: 'Alumni sign up with their domain and free slots; students request 30-minute sessions. Admin approval for alumni accounts.',
      skills: ['django', 'python', 'postgresql', 'tailwind'],
      roles: [
        { id: 23, title: 'Backend developer', skills: ['django', 'postgresql'], filled: false },
        { id: 24, title: 'Frontend developer', skills: ['tailwind', 'javascript'], filled: false },
      ],
    },
    {
      id: 13, owner_id: 2, created_at: daysAgo(13), status: 'open',
      title: 'Hackathon Team Finder Bot',
      summary: 'A Discord bot that matches hackathon participants by skills and timezone.',
      description: 'Members register skills with slash commands; the bot suggests balanced teams and creates private channels.',
      skills: ['nodejs', 'javascript', 'mongodb'],
      roles: [
        { id: 25, title: 'Bot developer', skills: ['nodejs', 'javascript'], filled: false },
      ],
    },
    {
      id: 14, owner_id: 11, created_at: daysAgo(14), status: 'open',
      title: 'Hostel Expense Splitter',
      summary: 'Track shared hostel expenses and settle up with UPI links in one tap.',
      description: 'Roommates add expenses, the app works out the fewest payments needed, and makes UPI links to settle.',
      skills: ['react', 'firebase', 'css'],
      roles: [
        { id: 26, title: 'Frontend developer', skills: ['react', 'css'], filled: false },
        { id: 27, title: 'UI designer', skills: ['figma'], filled: false },
      ],
    },
    {
      id: 15, owner_id: 9, created_at: daysAgo(20), status: 'closed',
      title: 'Club Website Revamp',
      summary: 'Redesign of the HnCC club website with an events calendar and blog.',
      description: 'Completed! Thanks to everyone who helped. Kept here for reference.',
      skills: ['figma', 'ui-design', 'html', 'css', 'javascript'],
      roles: [
        { id: 28, title: 'UI designer', skills: ['figma', 'ui-design'], filled: true },
      ],
    },
    {
      id: 16, owner_id: 3, created_at: daysAgo(30), status: 'closed',
      title: 'Robotics Line Follower',
      summary: 'PID-tuned line follower robot for the inter-college robotics competition.',
      description: 'Team is full and the competition is over. Code and schematics are in the repo.',
      skills: ['arduino', 'c++', 'embedded'],
      roles: [
        { id: 29, title: 'Controls engineer', skills: ['c++', 'embedded'], filled: true },
      ],
    },
  ];

  // Fill in the fields we didn't write out above
  for (const project of projects) {
    const owner = users.find(function (user) { return user.id === project.owner_id; });
    project.contact_email = owner.email;
    project.contact_url = null;
    if (!project.repo_url) {
      project.repo_url = null;
      project.repo_meta = null;
    }
  }

  return { users: users, projects: projects, nextUserId: 13, nextProjectId: 17, nextRoleId: 30 };
}

// ----- Saving and loading the demo data -----

function loadDemoData() {
  const saved = localStorage.getItem('devmatch-demo-data');
  if (saved) {
    return JSON.parse(saved);
  }
  return makeDemoData();
}

function saveDemoData(data) {
  localStorage.setItem('devmatch-demo-data', JSON.stringify(data));
}

function getDemoUser(data) {
  const userId = Number(localStorage.getItem('devmatch-demo-user'));
  return data.users.find(function (user) { return user.id === userId; }) || null;
}

// ----- Matching (SPEC.md section 7.2) -----

function calculateMatch(userSkills, project) {
  if (userSkills.length === 0) {
    return null;
  }

  // Skills the user has that the project also uses
  const matchedSkills = project.skills.filter(function (skill) { return userSkills.includes(skill); });

  let stackCoverage = 0;
  if (project.skills.length > 0) {
    stackCoverage = matchedSkills.length / project.skills.length;
  }

  // Find the open role the user fits best
  let roleFit = 0;
  let bestRole = null;
  for (const role of project.roles) {
    if (role.filled || role.skills.length === 0) {
      continue;
    }
    const haveCount = role.skills.filter(function (skill) { return userSkills.includes(skill); }).length;
    const fit = haveCount / role.skills.length;
    if (fit > roleFit) {
      roleFit = fit;
      bestRole = role.title;
    }
  }

  return {
    score: Math.round(100 * (0.6 * roleFit + 0.4 * stackCoverage)),
    matched_skills: matchedSkills.sort().slice(0, 3),
    best_role: bestRole,
    role_fit: roleFit,
  };
}

// ----- Turning saved projects into API answers -----

// The short version of a project, used for cards in the feed
function projectForCard(data, project, user) {
  const owner = data.users.find(function (u) { return u.id === project.owner_id; });
  const openRoles = project.roles.filter(function (role) { return !role.filled; });

  let match = null;
  if (user && user.skills.length > 0) {
    match = calculateMatch(user.skills, project);
  }

  return {
    id: project.id,
    title: project.title,
    summary: project.summary,
    skills: project.skills,
    open_roles: openRoles.length,
    status: project.status,
    owner: { id: owner.id, name: owner.name },
    created_at: project.created_at,
    match: match,
  };
}

// The full version of a project, used in the popup
function projectForPopup(data, project, user) {
  const details = projectForCard(data, project, user);
  details.description = project.description;
  details.roles = project.roles;
  details.repo_url = project.repo_url;
  details.repo_meta = project.repo_meta;
  // Contact details are only shown to logged-in users
  if (user) {
    details.contact_email = project.contact_email;
    details.contact_url = project.contact_url;
  }
  return details;
}

// ----- Checking project input -----

function isKnownSkill(slug) {
  return DEMO_SKILLS.some(function (skill) { return skill.slug === slug; });
}

// Returns an object like { title: 'Title is required' }. Empty object = no problems.
// When isUpdate is true, fields that were not sent are skipped.
function checkProjectInput(body, isUpdate) {
  const errors = {};

  if (!isUpdate || body.title !== undefined) {
    if (!body.title) errors.title = 'Title is required';
    else if (body.title.length > 80) errors.title = 'Max 80 characters';
  }
  if (!isUpdate || body.summary !== undefined) {
    if (!body.summary) errors.summary = 'Summary is required';
    else if (body.summary.length > 200) errors.summary = 'Max 200 characters';
  }
  if (!isUpdate || body.description !== undefined) {
    if (!body.description) errors.description = 'Description is required';
    else if (body.description.length > 4000) errors.description = 'Max 4000 characters';
  }
  if (!isUpdate || body.skills !== undefined) {
    if (!body.skills || body.skills.length === 0) errors.skills = 'Add at least one tech tag';
    else if (body.skills.length > 15) errors.skills = 'Max 15 skills';
    else if (!body.skills.every(isKnownSkill)) errors.skills = 'Unknown skill';
  }
  if (!isUpdate || body.contact_email !== undefined) {
    if (!isValidEmail(body.contact_email || '')) errors.contact_email = 'Enter a valid email';
  }
  if (body.contact_url && !isWebLink(body.contact_url)) {
    errors.contact_url = 'Enter a valid http(s) link';
  }
  if (body.repo_url && !isGithubRepoLink(body.repo_url)) {
    errors.repo_url = 'Must look like https://github.com/owner/repo';
  }
  if (body.roles !== undefined) {
    if (body.roles.length > 10) errors.roles = 'Max 10 roles';
    for (const role of body.roles) {
      if (!role.title || role.title.length > 60) errors.roles = 'Each role needs a title (max 60 characters)';
    }
  }
  return errors;
}

// Replaces a project's roles with the roles sent from the form
function saveRoles(data, project, newRoles) {
  const roles = [];
  for (const newRole of newRoles) {
    let id = newRole.id;
    if (!id) {
      id = data.nextRoleId;
      data.nextRoleId = data.nextRoleId + 1;
    }
    roles.push({ id: id, title: newRole.title, skills: newRole.skills, filled: newRole.filled === true });
  }
  project.roles = roles;
}

// ----- The fake server -----

function reply(status, body) {
  return { status: status, data: body };
}

// A copy of the user without the password (never send passwords back!)
function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    branch: user.branch,
    year: user.year,
    skills: user.skills,
  };
}

function replyError(status, message, fields) {
  return { status: status, data: { error: { message: message, fields: fields || {} } } };
}

function wait(milliseconds) {
  return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

async function fakeServer(method, path, body) {
  await wait(300); // pretend the internet is a bit slow

  const data = loadDemoData();
  const user = getDemoUser(data);

  // Split "/projects/7/roles/3?x=1" into the path parts and the ?query part
  const url = new URL(path, 'http://demo');
  const parts = url.pathname.split('/'); // ['', 'projects', '7', 'roles', '3']

  let result;

  if (url.pathname === '/health') {
    result = reply(200, { status: 'ok' });
  } else if (url.pathname === '/skills') {
    result = reply(200, DEMO_SKILLS);
  } else if (url.pathname === '/auth/signup') {
    result = demoSignup(data, body);
  } else if (url.pathname === '/auth/login') {
    result = demoLogin(data, body);
  } else if (url.pathname === '/auth/logout') {
    localStorage.removeItem('devmatch-demo-user');
    result = reply(200, { ok: true });
  } else if (url.pathname === '/me') {
    result = user ? reply(200, safeUser(user)) : replyError(401, 'Please log in.');
  } else if (url.pathname === '/me/skills') {
    result = demoSaveSkills(user, body);
  } else if (url.pathname === '/projects' && method === 'GET') {
    result = demoListProjects(data, user, url.searchParams);
  } else if (url.pathname === '/projects' && method === 'POST') {
    result = demoCreateProject(data, user, body);
  } else if (parts[1] === 'projects') {
    result = demoProjectRoutes(data, user, method, parts, body);
  } else {
    result = replyError(404, 'Not found');
  }

  saveDemoData(data);
  return result;
}

function demoSignup(data, body) {
  const errors = {};
  if (!body.name) errors.name = 'Enter your name';
  if (!isValidEmail(body.email || '')) errors.email = 'Enter a valid email';
  if (!body.password || body.password.length < 8) errors.password = 'At least 8 characters';
  if (!body.branch) errors.branch = 'Select your branch';
  if (!body.year) errors.year = 'Select your year';
  if (Object.keys(errors).length > 0) {
    return replyError(422, 'Invalid input', errors);
  }

  const emailTaken = data.users.some(function (u) { return u.email.toLowerCase() === body.email.toLowerCase(); });
  if (emailTaken) {
    return replyError(409, 'An account with this email already exists.', { email: 'Email already registered' });
  }

  const newUser = {
    id: data.nextUserId,
    name: body.name,
    email: body.email,
    password: body.password,
    branch: body.branch,
    year: body.year,
    skills: [],
  };
  data.nextUserId = data.nextUserId + 1;
  data.users.push(newUser);
  localStorage.setItem('devmatch-demo-user', newUser.id);
  return reply(201, safeUser(newUser));
}

function demoLogin(data, body) {
  const found = data.users.find(function (u) {
    return u.email.toLowerCase() === (body.email || '').toLowerCase() && u.password === body.password;
  });
  if (!found) {
    return replyError(401, 'Invalid email or password.');
  }
  localStorage.setItem('devmatch-demo-user', found.id);
  return reply(200, safeUser(found));
}

function demoSaveSkills(user, body) {
  if (!user) return replyError(401, 'Please log in.');
  if (body.skills.length > 30) return replyError(422, 'Invalid input', { skills: 'Max 30 skills' });
  if (!body.skills.every(isKnownSkill)) return replyError(422, 'Invalid input', { skills: 'Unknown skill' });
  user.skills = body.skills;
  return reply(200, safeUser(user));
}

function demoListProjects(data, user, query) {
  const search = (query.get('q') || '').toLowerCase();
  const wantedSkills = query.getAll('skill');
  const status = query.get('status') || 'open';
  const page = Number(query.get('page')) || 1;
  const pageSize = Number(query.get('page_size')) || 12;
  const userHasSkills = user !== null && user.skills.length > 0;

  let sort = query.get('sort');
  if (!sort) {
    sort = userHasSkills ? 'match' : 'new';
  }

  // 1. Keep only the projects that pass every filter
  const results = [];
  for (const project of data.projects) {
    if (project.status !== status) continue;

    const text = (project.title + ' ' + project.summary).toLowerCase();
    if (search && !text.includes(search)) continue;

    const hasAllSkills = wantedSkills.every(function (skill) { return project.skills.includes(skill); });
    if (!hasAllSkills) continue;

    results.push(projectForCard(data, project, user));
  }

  // 2. Sort: newest first, then (if asked) best match first
  results.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
  if (sort === 'match' && userHasSkills) {
    results.sort(function (a, b) {
      if (b.match.score !== a.match.score) return b.match.score - a.match.score;
      return b.match.role_fit - a.match.role_fit;
    });
  }

  // 3. Cut out just the page that was asked for
  const start = (page - 1) * pageSize;
  const pageItems = results.slice(start, start + pageSize);

  return reply(200, { items: pageItems, page: page, page_size: pageSize, total: results.length });
}

function demoCreateProject(data, user, body) {
  if (!user) return replyError(401, 'Please log in.');

  const errors = checkProjectInput(body, false);
  if (Object.keys(errors).length > 0) {
    return replyError(422, 'Invalid input', errors);
  }

  const project = {
    id: data.nextProjectId,
    owner_id: user.id,
    created_at: new Date().toISOString(),
    status: 'open',
    title: body.title,
    summary: body.summary,
    description: body.description,
    skills: body.skills,
    contact_email: body.contact_email,
    contact_url: body.contact_url,
    repo_url: body.repo_url,
    repo_meta: null,
    roles: [],
  };
  if (project.repo_url) {
    project.repo_meta = { stars: 0, language: null, pushed_at: new Date().toISOString() };
  }
  data.nextProjectId = data.nextProjectId + 1;
  saveRoles(data, project, body.roles || []);
  data.projects.push(project);
  return reply(201, projectForPopup(data, project, user));
}

// Handles everything under /projects/{id}/...
function demoProjectRoutes(data, user, method, parts, body) {
  const projectId = Number(parts[2]);
  const project = data.projects.find(function (p) { return p.id === projectId; });
  if (!project) {
    return replyError(404, 'Project not found.');
  }

  // GET /projects/{id} - anyone can look
  if (method === 'GET' && parts.length === 3) {
    return reply(200, projectForPopup(data, project, user));
  }

  // Everything else is only for the owner
  if (!user) return replyError(401, 'Please log in.');
  if (project.owner_id !== user.id) return replyError(403, 'Only the project owner can do that.');

  // DELETE /projects/{id}
  if (method === 'DELETE') {
    data.projects = data.projects.filter(function (p) { return p.id !== projectId; });
    return reply(204, null);
  }

  // PATCH /projects/{id}
  if (method === 'PATCH' && parts.length === 3) {
    const errors = checkProjectInput(body, true);
    if (Object.keys(errors).length > 0) {
      return replyError(422, 'Invalid input', errors);
    }
    const simpleFields = ['title', 'summary', 'description', 'skills', 'status', 'contact_email', 'contact_url', 'repo_url'];
    for (const field of simpleFields) {
      if (body[field] !== undefined) {
        project[field] = body[field];
      }
    }
    if (body.roles !== undefined) {
      saveRoles(data, project, body.roles);
    }
    return reply(200, projectForPopup(data, project, user));
  }

  // PATCH /projects/{id}/roles/{roleId}  - mark a role filled / open
  if (parts[3] === 'roles') {
    const role = project.roles.find(function (r) { return r.id === Number(parts[4]); });
    if (!role) return replyError(404, 'Role not found.');
    role.filled = body.filled;
    return reply(200, role);
  }

  // GET /projects/{id}/suggestions  - students who fit each open role
  if (parts[3] === 'suggestions') {
    const result = [];
    for (const role of project.roles) {
      if (role.filled) continue;

      const people = [];
      for (const student of data.users) {
        if (student.id === project.owner_id) continue;
        const matched = role.skills.filter(function (skill) { return student.skills.includes(skill); });
        if (matched.length === 0) continue;
        people.push({
          id: student.id,
          name: student.name,
          branch: student.branch,
          year: student.year,
          matched_skills: matched,
          score: Math.round((100 * matched.length) / role.skills.length),
        });
      }
      people.sort(function (a, b) { return b.score - a.score; });
      result.push({ role_id: role.id, title: role.title, suggestions: people.slice(0, 5) });
    }
    return reply(200, { roles: result });
  }

  // POST /projects/{id}/refresh-repo
  if (parts[3] === 'refresh-repo') {
    if (project.repo_meta) {
      project.repo_meta.pushed_at = new Date().toISOString();
    }
    return reply(200, projectForPopup(data, project, user));
  }

  return replyError(404, 'Not found');
}
