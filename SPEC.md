# DevMatch

DevMatch is a campus project marketplace for BIT Sindri. A student posts a project with the roles it still needs. Other students browse those listings, see which ones fit the skills on their profile, and contact the lead or open the GitHub repo. A lead, looking at their own project, sees students who fit each open role.

This document is the read-through for that product. The first half is the picture: who it is for, what a visit looks like, and how the pieces fit. The second half is how it is built: data, matching, the API, the browser app, and how to run it. Ideas that are not built yet live in [New ideas](#new-ideas), not in the sections above. The README stays the short public page. This file is the longer read, for someone who already has the project and wants the real picture. If the code and this document disagree, fix one of them in the same change.

## The product

Students with a project idea often cannot find teammates who have the skills the work actually needs. Cross-branch and cross-year collaboration is rare, and hackathons tend to assume a team already exists. DevMatch is the board where an idea and a set of skills can meet without that pre-formed group.

Two people use the same account:

| Person | What they are trying to do |
|---|---|
| Seeker | Find a project that fits the skills they already have, often across branch or year. |
| Lead | Publish an idea, name the roles that are still open, and see who could fill them. |

One student is often both. They browse as a seeker and post as a lead.

The product promises four things:

- A seeker can find a relevant project quickly: search, skill filters, and a ranked feed.
- A lead can publish a listing in one sitting: title, summary, description, contact, and roles.
- Every match can be explained. A score always comes with the skills that produced it and, when one role clearly fits, the name of that role.
- The board stays useful after a single event. Open work is what the feed shows. Closed work remains readable, and it leaves the default feed.

DevMatch is a campus board, not a job marketplace. It does not take payment, collect ratings, or run an in-app conversation. Matching is a formula over skill sets, not a model. There is one college, BIT Sindri, and the interface is a responsive website. Admin moderation, GitHub login, and generated summaries are not part of the product today. A lead's suggested students are names, branch, and study standing. The product does not hand the lead that student's email.

Signup asks for a real email address, the calendar year the student joined, and one of the campus branches: CSE, IT, ECE, EE, ME, CE, CHE, MIN, MET, PIE. The address does not have to be a college domain. An account created earlier with some other branch can still log in.

## A visit

```
Seeker                         Lead
  |                              |
  |  sign up, pick skills        |  post a project and its roles
  v                              v
+----------------+         +------------------+
| Feed           |         | Own project      |
| search, filter |         | suggestions per  |
| ranked cards   |         | open role        |
+-------+--------+         +------------------+
        |
        |  open a card
        v
+----------------+
| Project        |
| roles, contact,|
| repo stats     |
+----------------+
```

A seeker lands on the feed. Cards show the title, a short summary, tech tags, how many roles are open, the lead's name, and, once the seeker has skills, a match score with up to three matched skills. Search looks at title and summary. Skill filters keep only projects that still need every chosen skill on an unfilled role. The default feed hides closed projects.

Opening a card shows the full description, each role and whether it is filled, and the repository when the lead added one. Contact details appear only after login: an email action when the project has a contact email, and a separate link when the contact URL is a normal http(s) address. The same screen is reachable at `#/project/{id}`.

A lead uses the same form to create or edit. They can close a project or mark a role filled. Filling the last role does not close the project by itself. On their own open project they can ask for suggestions: up to five other students per open role, ranked by how much of that role's skill list they cover.

Someone who is logged out, who has no skills yet, or who owns the project sees the feed in newest-first order and no match badge on cards. The owner is not matched against their own listing.

## How the system is built

The browser and the API are one deploy. FastAPI serves the HTML and the static files, and it serves `/api` on the same origin, so the browser does not need a cross-origin setup.

```
Browser
  HTML, CSS, vanilla JavaScript
  hash routes, no build step
        |
        |  JSON, session cookie
        v
FastAPI  (uvicorn)
  app/routers          HTTP
  app/schemas          request limits and shapes
  app/matcher          scores, no database and no network
  app/github_client    repository snapshot, fail-soft
  app/database         one PostgreSQL connection per request
        |
        +----> PostgreSQL
        |
        +----> GitHub REST API   (only for repo stats)
```

A few choices explain the shape of the code:

- **FastAPI with ordinary** `def` **routes and sync** `psycopg`**.** FastAPI runs those routes on a threadpool. The handlers stay straight-line database code.
- **Pydantic for every write.** Limits live next to the fields. Validation errors are rewritten into one JSON shape the forms already understand.
- **No ORM.** Queries are SQL strings with parameters. The matching math never runs inside SQL. The database returns rows, and `app/matcher` scores them.
- **No frontend build.** Pages are script files loaded in order from `index.html`. Shared decisions such as "is this page out of range?" live in `frontend/js/helpers.js` so the views stay thin.
- **Sessions, not tokens in** `localStorage`**.** The password is stored as an Argon2 hash (`pwdlib`). Starlette's session middleware signs a cookie. Production refuses to boot without `SECRET_KEY` and marks that cookie `Secure`.
- **The database is provisioned outside this repository.** Schema, the canonical skill list, and any sample rows are applied to PostgreSQL directly. This repo owns the application that reads and writes them.

`/api/health` answers `{ "status": "ok" }` when the process is up. It does not open the database. A missing `DATABASE_URL`, or a connection failure, becomes `503` on the request that needed the database. Each request opens one connection, commits when the handler returns, and rolls back when the handler raises.

## Where the code lives

```
devmatch/
├─ SPEC.md                 this document
├─ README.md               local run steps
├─ requirements.txt
├─ app/
│  ├─ main.py              app, errors, session, static files, /api/health
│  ├─ runtime.py           when a session secret is required
│  ├─ rate_limit.py        in-memory auth and write limits
│  ├─ skill_names.py       aliases and the canonical skill resolver
│  ├─ academic_year.py     session year and study standing
│  ├─ database/db.py       connection per request
│  ├─ routers/             auth.py, me.py, projects.py, skills.py
│  ├─ schemas/             auth, profile, user, project
│  ├─ matcher/matcher.py   scores and suggestions
│  └─ github_client.py     fetch and the snapshot decision
├─ frontend/               index.html, css/, js/
└─ tests/                  unittest modules and a small browser-free UI check
```

Static files are the `frontend/` directory mounted at `/static`. `/` returns `frontend/index.html`.

## Data

PostgreSQL. Timestamps are `timestamptz` and default to `now()`. Identifiers are `bigserial`. Email columns use `citext` (`CREATE EXTENSION IF NOT EXISTS citext`).

```sql
CREATE TABLE users (
  id            bigserial PRIMARY KEY,
  name          text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  email         citext      NOT NULL UNIQUE,
  password_hash text        NOT NULL,
  branch        text        NOT NULL,
  joined_year   smallint    NOT NULL,          -- calendar year they entered college
  github_url    text,                  -- https://github.com/{username}
  gender        text        CHECK (gender IS NULL OR gender IN ('female', 'male', 'other')),
  dob           date,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE skills (
  id    bigserial PRIMARY KEY,
  slug  text NOT NULL UNIQUE,      -- canonical: 'python', 'c++'
  label text NOT NULL              -- display: 'Python', 'C++'
);

CREATE TABLE user_skills (
  user_id  bigint NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  skill_id bigint NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE projects (
  id            bigserial PRIMARY KEY,
  owner_id      bigint      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         text        NOT NULL CHECK (char_length(title) <= 80),
  summary       text        NOT NULL CHECK (char_length(summary) <= 200),
  description   text        NOT NULL CHECK (char_length(description) <= 4000),
  status        text        NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  contact_email citext      NOT NULL,
  contact_url   text,
  repo_url      text,
  repo_meta     jsonb,                 -- {stars, language, pushed_at, fetched_at}
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE project_skills (
  project_id bigint NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id   bigint NOT NULL REFERENCES skills(id)   ON DELETE CASCADE,
  PRIMARY KEY (project_id, skill_id)
);

CREATE TABLE roles (
  id         bigserial PRIMARY KEY,
  project_id bigint NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      text   NOT NULL CHECK (char_length(title) <= 60),
  filled     boolean NOT NULL DEFAULT false
);

CREATE TABLE role_skills (
  role_id  bigint NOT NULL REFERENCES roles(id)  ON DELETE CASCADE,
  skill_id bigint NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, skill_id)
);

CREATE INDEX idx_projects_status_created ON projects (status, created_at DESC);
CREATE INDEX idx_project_skills_skill    ON project_skills (skill_id);
CREATE INDEX idx_user_skills_skill       ON user_skills (skill_id);
CREATE INDEX idx_roles_project           ON roles (project_id);
```

`project_skills` is part of the provisioned schema. The application does not read or write it. A project's visible tech tags are the skills attached to its roles. Filters and match scores use only the skills on roles that are still unfilled. A project with no roles has no tags.

Deleting a user deletes their projects. Deleting a project deletes its roles and the skills on those roles. A skill row is created only in the database, never by a signup or a project form.

`joined_year` is the stored fact. The study standing shown on a profile, a card, and a suggestion is calculated from it, as described under Academic year. The profile can also store a GitHub profile URL (`https://github.com/{username}`), a gender (`female`, `male`, or `other`), and a date of birth. A blank value clears that field. A repository URL is not a profile URL. A date of birth cannot be in the future.

## Skills

Every skill is stored once, as a canonical slug. Writers may send that slug, its display label, or a known alias, in any letter case. The API trims the value, resolves it, and stores the slug. It never inserts a new skill because someone typed one.

| Alias | Slug |
|---|---|
| `js` | `javascript` |
| `py` | `python` |
| `reactjs`, `react.js` | `react` |
| `node`, `node.js` | `nodejs` |
| `postgres` | `postgresql` |
| `ml` | `machine-learning` |
| `cpp` | `c++` |
| `ts` | `typescript` |

An unknown value is a `422`, with close suggestions when the catalog has them. The same resolver is used for profile skills and for role skills. The browser's skill shortcuts in `frontend/js/helpers.js` match this table, so a typed alias does not depend on the server alone, and the server still checks it.

A profile holds at most 30 skills. A project holds at most 15 distinct skills across its roles, counted after aliases have been folded into slugs. Skill filters compare the decoded query value with the slug. In a query string, `c++` has to be percent-encoded, because a raw `+` means a space.

The seeded catalog is the campus-sized list the pickers search: languages and frameworks (`python`, `fastapi`, `react`, `c++`, …), tools (`git`, `docker`, `figma`), and a few non-code skills (`ui-design`, `technical-writing`). The database is the source of that list. `GET /api/skills` returns `{ slug, label }` ordered by label.

## Academic year

The year a student is in is not stored. Signup stores the calendar year they joined, and `app/academic_year.py` turns that into a standing for a given date. The academic session turns on 1 August. On and after that date the session year is the calendar year. Before that date it is the previous calendar year.

```
study year = session year - joining year + 1
```

A study year from 1 to 5 is shown as `Year N`. Below 1 is `Incoming`. Above 5 is `Finished`.

| Date | Session year | Joined 2024 |
|---|---|---|
| 26 October 2026 | 2026 | Year 3 |
| 31 July 2027 | 2026 | Year 3 |
| 1 August 2027 | 2027 | Year 4 |

A joining year ahead of the session would be Incoming, and a joining year of 2020 is Finished on 26 October 2026. Signup and the profile only offer the calendar year and the five years before it, newest first. On 26 October 2026 those years are 2026 through 2021.

## Matching

Matching is a pure function in `app/matcher/matcher.py`. It receives sets. It does not query the database.

The stack `S` is the union of skills on **unfilled** roles. A skill that exists only on a filled role is invisible to the score, and it is invisible to skill filters. It still shows up as a tech tag on the card, because the tag describes the project, not the opening. A role with an empty skill list adds nothing.

```
stack_coverage = |U ∩ S| / |S|          (0 when S is empty)
role_fit       = max |U ∩ Ri| / |Ri|    over unfilled roles that have skills
score          = half_up(100 × (0.6 × role_fit + 0.4 × stack_coverage))
```

`U` is the viewer's skill set. Role fit is weighted more than stack coverage because the useful question is "can I fill a role?", and the stack is context.

Half-up is arithmetic rounding: 12.5 becomes 13. The implementation uses integer counts (`tests.test_matcher`), so Python's bankers' rounding cannot turn that case into 12. One skill out of eight open-role skills, with no stronger single role, is that 13.

The match object is left off the response when the viewer is logged out, has no skills, owns the project, or the project has no unfilled role. A score of 0 is still returned when an unfilled role exists and the overlap is empty. Closed projects stay out of the default feed. When the viewer can be matched, the feed sorts by score, then by role fit, then by newer `created_at`, then by higher project id. Without a match, the feed is newest first.

The best role is the unfilled role with the greatest fit. Ties go to the larger overlap count, then to the lower role id. The role is omitted when that fit is 0. `matched_skills` holds at most three slugs: the overlap with the best role, alphabetically, and then any remaining overlap with the open stack, alphabetically.

These rows are the cases `python -m unittest tests.test_matcher` locks in:

| Viewer skills | Open stack | Roles | Result |
|---|---|---|---|
| python | python | open Backend: python | score 100, best role Backend |
| one of eight skills | those eight | one open generalist role | score 13 |
| python | figma | filled Backend: python; open Design: figma | score 0, no chips, no best role |
| python | empty | open role with no skills | score 0, no division error |
| python, react | both | Later id 5 needs react; Earlier id 2 needs python | best role is Earlier |
| python, django | both | Narrow needs python; Wide needs both | best role is Wide |
| owner, or no skills, or every role filled | anything | anything | no match object |

Suggestions use the same overlap idea, per role. They are returned only while the project is open. For each unfilled role that has skills, other students are ranked by the fraction of that role they cover. The owner is excluded. So is anyone with no overlap. Equal fractions sort by name, case-insensitively. At most five people are returned, each with name, branch, calculated study standing, matched skills, and score. No email, no joining year, and no contact link.

## Projects and the feed

A listing needs a title (80 characters), a summary (200), a description (4000), and a contact email. The repo URL and the contact URL are optional. The repo URL, when present, must look like `https://github.com/{owner}/{repo}`. Title, summary, and role title are a single line. The description may contain line breaks. A project has at most 10 roles. Each role has a title (60) and a skill list. A new role that does not say whether it is filled starts unfilled.

Editing roles sends the full list. A role left out of that list is deleted. A role id that belongs to another project is rejected, and the current roles stay as they were. Omitting `filled` on a role that already exists keeps the stored value. Omitting the roles field entirely leaves roles alone.

`GET /api/projects` accepts:

| Param | Meaning |
|---|---|
| `q` | Title and summary, case-insensitive. Trimmed. Blank is ignored. Longer than 100 characters is a validation error. `%`, `_`, and `\` are escaped so they are not wildcards. |
| `skill` | Repeatable. The project must have **each** skill on some unfilled role. Repeated values count once. More than 10 parameters is a validation error, before duplicates are folded. |
| `status` | `open` or `closed`. Default `open`. |
| `sort` | `match` or `new`. Default `match` when the viewer has skills, otherwise `new`. |
| `page`, `page_size` | Default 1 and 12. `page_size` max is 50. A page past the end returns an empty `items` list and the real `total`. The feed then says the page is out of range and offers a way back to page 1. That is a different screen from "no projects matched". |

List items include `skills` (the sorted union of every role's skills, filled roles included), `open_roles`, `status`, the owner's id and name, and `match` or `null`. Detail adds the description, the roles, the repo URL, `repo_meta`, and `created_at`. Contact email and contact URL are added only when the viewer is logged in. Detail does not repeat the project-level `skills` array. The client builds the stack from the roles.

Only the owner can update or delete a project, mark a role filled, refresh repo stats, or read suggestions. Anyone else receives `403`.

## Accounts

Signup creates the user and starts the session. The body is name, email, password, branch, and `joined_year`. The password is 8 to 128 characters. Login checks the email and password and does not reject a password only because it is longer than 128. A duplicate email is `409`. Email is stored in lowercase. Signup, login, and `GET /api/me` return `joined_year` and the calculated `standing`. `PATCH /api/me` saves the joining year, GitHub profile URL, gender, and date of birth together. The profile page shows the standing and those fields.

The session cookie is `HttpOnly` and `SameSite=Lax`. When `APP_ENV=production` it is also `Secure`, and `/docs` and `/redoc` are turned off. If `APP_ENV` is missing or `development`, a missing `SECRET_KEY` is replaced with a generated secret for that process. Any other `APP_ENV` without `SECRET_KEY` raises before the process serves traffic.

Logout clears the session. `GET /api/me` returns the current user and their skills. `PUT /api/me/skills` replaces the whole skill set with `{ "skills": ["python", "react"] }`.

State-changing `/api` requests must send `Content-Type: application/json`. Anything else is `415`. That, plus `SameSite=Lax`, is the CSRF boundary. Passwords are never logged. Request logs are method, path, status, and duration.

Auth routes allow 10 requests a minute per client IP. Authenticated writes allow 60 a minute per user. The counters live in the process (`app/rate_limit.py`). They reset when the process restarts, and they are not shared across more than one instance.

## GitHub

Saving a project with a repository URL asks GitHub for that repo. Only four fields are kept, in `repo_meta`: `stars`, `language`, `pushed_at`, and `fetched_at`. `GITHUB_TOKEN` is optional. Without it the unauthenticated rate limit applies. The token needs no scopes.

The call times out after 3 seconds. Project creation never waits on a failure. What gets stored depends on what changed:

| Situation | Snapshot |
|---|---|
| Fetch succeeded, or the previous snapshot is still younger than 6 hours | Store that snapshot |
| Same URL, and the fetch failed, including a forced refresh | Keep the previous snapshot |
| URL removed | Clear the snapshot |
| URL replaced, and the fetch of the new repo failed | Clear the snapshot. The previous repo's numbers are not kept |

The project screen says repository stats are unavailable when a URL is set and the snapshot is empty. A snapshot with no language omits the language. It does not guess one. The owner can force a refresh at `POST /api/projects/{id}/refresh-repo`.

## API

Base path `/api`. JSON in and out. The session cookie authenticates the viewer. Writes require login except signup and login.

Success is `200` or `201` with a body. Delete is `204`. Every error uses the same envelope:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid input",
    "fields": { "title": "String should have at most 80 characters" }
  }
}
```

`fields` is empty when the error is not about a specific input. FastAPI's default `{"detail": [...]}` body is not used. Handlers in `app/main.py` reshape `RequestValidationError`, `HTTPException`, and unexpected exceptions into this envelope.

| Status | Code | When |
|---|---|---|
| 400 | `bad_request` | Malformed request |
| 401 | `unauthorized` | Not logged in |
| 403 | `forbidden` | Logged in, not the owner |
| 404 | `not_found` | Missing project or route |
| 409 | `conflict` | Email already registered |
| 415 | `bad_request` | A write without `application/json` |
| 422 | `validation_error` | A field failed its limit or an unknown skill |
| 429 | `rate_limited` | Auth or write limit |
| 500 | `internal_error` | Unexpected failure |
| 503 | `service_unavailable` | Database URL missing, or the database is unreachable |

| Method | Path | Auth | What it does |
|---|---|---|---|
| POST | `/auth/signup` | no | Create an account and start the session |
| POST | `/auth/login` | no | Start the session |
| POST | `/auth/logout` | yes | End the session |
| GET | `/me` | yes | Current user, joining year, standing, and skills |
| PATCH | `/me` | yes | Replace the joining year |
| PUT | `/me/skills` | yes | Replace the skill set |
| GET | `/skills` | no | Canonical skill list |
| GET | `/projects` | optional | Search, filter, and list |
| GET | `/projects/{id}` | optional | Full detail. Contact fields only if logged in |
| POST | `/projects` | yes | Create, including optional roles |
| PATCH | `/projects/{id}` | owner | Update fields or status |
| DELETE | `/projects/{id}` | owner | Delete |
| PATCH | `/projects/{id}/roles/{roleId}` | owner | `{ "filled": true }` or `false` |
| GET | `/projects/{id}/suggestions` | owner | Suggested students per open role |
| POST | `/projects/{id}/refresh-repo` | owner | Fetch GitHub again |
| GET | `/health` | no | Process is up |

A list item looks like this. `match` is `null` in the cases described under Matching.

```json
{
  "items": [{
    "id": 7,
    "title": "Campus Bus Tracker",
    "summary": "Live bus locations for campus routes.",
    "skills": ["python", "flask"],
    "open_roles": 2,
    "status": "open",
    "owner": { "id": 3, "name": "A. Kumar", "standing": "Year 3" },
    "match": {
      "score": 72,
      "matched_skills": ["flask", "python"],
      "best_role": "Backend dev"
    }
  }],
  "page": 1,
  "page_size": 12,
  "total": 31
}
```

While the feed is sorting, a list item also carries the private fit counts the sort key needs. Those counts are removed before the JSON is sent. Detail responses never include them.

Interactive API docs are at `/docs` whenever `APP_ENV` is not `production`.

## The browser app

One page, hash-routed. There is no framework and no build. `index.html` loads the scripts in this order, and `script.js` starts the app: `state.js`, `helpers.js`, `toast.js`, `api.js`, `card.js`, `skillPicker.js`, `modal.js`, `header.js`, then the views (`feed`, `newProject`, `profile`, `auth`), then `router.js`.

| Route | Screen |
|---|---|
| `#/` | Feed: search, skill chips, cards, pages |
| `#/project/{id}` | The same feed, with that project open in a dialog |
| `#/new` | Create a project |
| `#/edit/{id}` | Edit. Only the owner sees the form. Anyone else sees a short message and no form |
| `#/profile` | Name, branch, study standing, joining year, skills |
| `#/login`, `#/signup` | Account forms |

Cards clamp the summary to two lines and show at most four tech chips plus a "+N". The lead's standing is written beside their name. In both themes the card background is yellow for Year 1, green for Year 2, blue for Year 3, pink for Year 4, and purple for Year 5, using the accent colors that already darken with the theme. Incoming and Finished stay on the plain card surface. The dialog has the overview, the stack, each role with its skills, contact, the repo link, and repo stats when a snapshot exists. A missing project is a not-found message with a way back to the feed, and it does not offer a retry. Contact for a logged-in viewer is "Email lead" when there is a contact email, and "Open contact link" when the contact URL is http(s). "View repo" opens in a new tab with `rel="noopener noreferrer"`. Logged-out viewers get a path to log in instead of the contact actions.

The skill picker is a typeahead over `GET /api/skills`. Toasts are non-blocking.

Every data view has a loading state, an empty state, an error state with a retry, and a populated state. Search input waits 300ms and drops the previous request when the query changes. User-written text is rendered as text, not as HTML.

The dialog is `role="dialog"` and `aria-modal="true"`, labelled by the project title. Focus stays inside it until it closes. Escape, the backdrop, and the close button all close it, and focus returns to the card that opened it. Interactive controls are reachable from the keyboard, with a visible focus ring. Contrast meets WCAG AA, and status is not communicated by color alone. The grid is one column below 640px, two below 1024px, and three from there up. The page follows the `prefers-color-scheme` setting and remembers a manual light or dark choice in `localStorage`.

## Configuration and running

| Variable | Role |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. Neon uses `sslmode=require` |
| `SECRET_KEY` | Signs the session cookie. Required when `APP_ENV` is anything other than `development` |
| `GITHUB_TOKEN` | Optional. Raises the GitHub rate limit |
| `APP_ENV` | `development`, or unset, is local. `production` also sets the `Secure` cookie and hides API docs |

Locally, put those in a git-ignored `.env`, install `requirements.txt`, and run `uvicorn app.main:app --reload`. The site is at `http://127.0.0.1:8000`.

A public process runs `uvicorn app.main:app --host 0.0.0.0 --port $PORT` after `pip install -r requirements.txt`. Set the variables in the host's environment. Point the health check at `/api/health`. On a free web tier the process can sleep after idle time. The first request after sleep pays the cold start. The health check does not warm the database.

## How the behavior is checked

`python -m unittest discover -s tests` covers the rules that do not need a live database:

| Module | What it locks |
|---|---|
| `tests.test_matcher` | Scores, best role, chips, owner and filled-role cases, suggestions |
| `tests.test_listings` | Search and skill-filter limits, role replacement, single-line titles |
| `tests.test_github_meta` | When a snapshot is kept, cleared, or replaced |
| `tests.test_academic_year` | Session dates, standing labels, joining-year window, lead and suggestion standing |
| `tests.test_accounts` | Aliases, unknown skills, signup password, branch, and joining year |
| `tests.test_runtime` | When the process refuses to start without `SECRET_KEY` |
| `tests/render_states.js` | Feed out-of-range copy, contact actions, not-found copy, edit permission, empty repo stats. Run with `node tests/render_states.js` |

A live pass still needs a database and a browser: signup and login, the feed re-ranking after a skill save, opening a project from a card and from a deep link, focus in the dialog, contact hidden until login, and an owner-only edit.

## What this document is for

Read it from the top when you need the picture. Drop to Matching, the API, or the data section when you need a rule. When a behavior changes, change the section that states it. A thought that is not built yet goes in New ideas. The OpenSpec files under `openspec/specs/` are the requirement-sized contracts for skills, listings, matching, accounts, and GitHub metadata. This document is the one narrative those contracts belong to.

## New ideas

This is the place for a 3am idea. Write it at the top of the list, in a sentence or two: what it is, and why it might matter. Leave it here until it is actually built.

An entry in this list is not a promise and it is not how the product works. The sections above stay the description of what is shipped. When an idea ships, move the behavior into the section it belongs to and delete the entry.

- **Let a lead reach a suggested student.** Suggestions today are name, branch, and study standing. A lead still has no way to contact that person, and the student's email stays off the suggestion on purpose.
- **Someone besides the owner can take a listing down.** Spam and abandoned posts can only be edited or deleted by the student who created them.
- **Open listings that go quiet.** A project can stay `open` forever, including one whose roles are all filled. Nothing nudges the lead or moves a stale listing off the default feed. [Add End Date ]
- **Feed mixes all the listings** Seperate the own listing from others. 
- **Prove the signup email.** Any address is accepted, and the branch list is the only campus fence. Confirming the inbox, or requiring a college domain, would make an account harder to fake.
- **Sign in with GitHub.** Accounts are email and password only.
- **Generated card summaries.** Descriptions are whatever the lead wrote. Nothing rewrites them.
- **A conversation inside the product.** Contact leaves the site through email, a contact link, or GitHub.
- **Decide what** `project_skills` **is for.** The table is in the database. The app derives tags from role skills and does not read or write `project_skills`.
- **A health check that notices the database.** `/api/health` only reports that the process is up. A bad `DATABASE_URL` shows up later, as a `503` on a real request.
- **Rate limits that survive a restart.** Auth is 10 requests a minute per IP and writes are 60 a minute per user, counted in memory inside one process.
- **AI for generating clean and better summary and descriptions when adding a project**