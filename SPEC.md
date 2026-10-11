# DevMatch — Product & Technical Specification

| | |
|---|---|
| **Status** | Draft v1.1 — backend switched from Flask to FastAPI (source of truth for implementation) |
| **Event** | Hacktoberfest Hack Day Dhanbad (HnCC, BIT Sindri) — Track 3: Website Upgrade |
| **Team** | Pranjal Aman, Balmukund Pandey |
| **Rule** | If code and this spec disagree, fix one of them in the same commit. No silent drift. |

---

## 1. Overview

DevMatch is a campus project marketplace for BIT Sindri. Project leads post project ideas as listings with a tech stack and open roles. Students browse listings, get ranked suggestions based on their skills, open a detail popup, and contact the team lead or visit the GitHub repo.

**One-line pitch:** Find the right teammates for your campus project, regardless of branch or batch.

### 1.1 Problem
Students with good ideas can't find teammates with the right skills. Cross-branch and cross-year interaction is rare. Hackathons expect pre-formed teams, which excludes first-years and students without a fixed group.

### 1.2 Goals
- G1. A student can find a relevant project in under 60 seconds.
- G2. A project lead can publish a listing in under 3 minutes.
- G3. Matching is explainable: every ranking shows *why* a project matched.
- G4. A working, deployed demo with seeded data by demo time.

### 1.3 Non-goals (v1)
- In-app chat or messaging (we link out to email/WhatsApp/GitHub instead).
- Payments, ratings, reviews, or any "Fiverr-style" transaction logic. The marketplace metaphor is UI only.
- ML or LLM-based matching. Rule-based only (see §7). LLM is a stretch goal.
- Mobile app. Responsive web only.
- Multi-college tenancy.

---

## 2. Users & Personas

| Persona | Description | Primary need |
|---|---|---|
| **Seeker** | Student looking for a project or team (often 1st-year) | Find projects that fit my skills |
| **Lead** | Student who owns a project idea | Find people for missing roles |
| **Admin** (stretch) | Club member (e.g. HnCC) | Remove spam or stale listings |

A single account can act as both Seeker and Lead.

---

## 3. Scope & Prioritization

Priority: **P0** = must ship for demo, **P1** = should ship, **P2** = stretch.

| ID | Feature | Maps to abstract | Priority |
|---|---|---|---|
| F1 | Sign up / log in / log out | (enabler) | P0 |
| F2 | Profile with skills | Feature 3 | P0 |
| F3 | Project listing CRUD (with tech stack and open roles) | Feature 1 | P0 |
| F4 | Browse + search + filter project cards | Feature 1 | P0 |
| F5 | Project detail popup | Feature 2 | P0 |
| F6 | Skill-based match ranking with reasons | Feature 3 | P0 |
| F7 | Open-role highlighting / suggested members for leads | Feature 4 | P1 |
| F8 | Contact + GitHub repo links, GitHub metadata fetch | Feature 5 | P0 (links) / P1 (API fetch) |
| F9 | Mark role filled / project closed | (enabler) | P1 |
| F10 | GitHub OAuth login | — | P2 |
| F11 | Admin moderation | — | P2 |
| F12 | LLM-assisted card summaries | Section 7 of abstract | P2 |

---

## 4. User Stories & Acceptance Criteria

**US-1 (Seeker, F1/F2)** — As a student, I sign up and add my skills so I get relevant recommendations.
- AC: Signup requires name, email, password, branch, year. Duplicate email → `409`.
- AC: I can add/remove skills from a canonical list; free-text skills are normalized (§7.1).
- AC: After saving skills, the home feed reorders by match score without a page reload.

**US-2 (Seeker, F4)** — As a student, I browse project cards at a glance.
- AC: Each card shows title, 1–2 line summary, tech tags, count of open roles, and lead name.
- AC: Search by text (title/summary) and filter by one or more skills and status (open/closed).
- AC: Empty state is shown when there are no results, with a clear-filters action.

**US-3 (Seeker, F5/F8)** — As a student, I open a card and see everything needed to join.
- AC: Clicking a card opens a popup (modal) with full description, tech stack, open roles with required skills, lead contact, repo link.
- AC: Popup is deep-linkable (`/#/project/{id}`), closable with Esc, click-outside, and a close button, and keyboard focus is trapped inside while open.
- AC: Contact details are visible only to logged-in users.

**US-4 (Lead, F3)** — As a lead, I post a project.
- AC: Required fields: title (≤80 chars), summary (≤200), description (≤4000), ≥1 tech tag, contact email. Optional: repo URL, contact URL, roles.
- AC: I can edit, close, or delete only my own projects (`403` otherwise).
- AC: Invalid input returns field-level errors shown inline in the form.

**US-5 (Seeker, F6)** — As a student, I see why a project matched.
- AC: Cards show a match percentage and up to 3 "matched skills" chips when logged in with ≥1 skill.
- AC: Logged-out or no-skill users see the default sort (newest first) and no match badge.

**US-6 (Lead, F7)** — As a lead, I see suggested teammates.
- AC: For each open role, I see up to 5 users whose skills overlap the role's required skills, ranked by overlap, with their name, branch/year, and matched skills.

**US-7 (Seeker, F8)** — As a student, I jump to the repo or contact the lead in one tap.
- AC: "Contact lead" opens `mailto:` (or the optional contact URL). "View repo" opens GitHub in a new tab with `rel="noopener noreferrer"`.
- AC: If the GitHub API fails, the popup still renders; repo stats are simply omitted.

---

## 5. System Architecture

```
Browser (HTML/CSS/vanilla JS, served as static files by FastAPI)
        │  JSON over HTTPS (same origin, no CORS needed)
        ▼
FastAPI app on Render ──► PostgreSQL on NeonDB
   ├─ auth (session cookie)
   ├─ projects / roles / skills API
   ├─ matcher.py (pure functions, no I/O)
   └─ github_client.py (fail-soft, cached)
        │
        ▼
GitHub REST API (repo metadata)
```

### 5.1 Key decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend framework | **FastAPI** (run with `uvicorn`) | Backend owner's choice (Balmukund); abstract lists Flask/FastAPI. Gives Pydantic validation and Swagger `/docs` for free |
| Validation | Pydantic models in `app/schemas/` | Separate auth, profile, and shared user models; custom exception handlers reshape errors to §8.1 |
| Sync vs async | Plain `def` endpoints + sync `psycopg` | FastAPI runs `def` routes in a threadpool, so no `async` complexity and no async DB driver needed |
| Frontend | Vanilla JS + CSS, no build step | Zero tooling risk; matches abstract |
| Serving | FastAPI mounts `StaticFiles` for `/static` and serves `index.html` at `/` | Single deploy, same origin, no CORS. Register `/api` routes before the static mount |
| Auth | Email + password hashed with Argon2 (`pwdlib[argon2]`); Starlette `SessionMiddleware` signed session cookie | Fastest secure option; OAuth is P2 |
| API docs | Auto-generated at `/docs` | Free endpoint testing for the frontend dev; disable in production if desired |
| DB access | `psycopg` (v3) with parameterized SQL | No ORM overhead; every query reviewable |
| Matching | Pure Python functions in `matcher.py` | Unit-testable, explainable, no model dependency |
| Database provisioning | Existing pre-provisioned PostgreSQL database | Schema, canonical skills, and demo data are managed outside this repository |

---

## 6. Data Model

PostgreSQL. All timestamps `timestamptz`, default `now()`. All IDs `bigserial`.

```sql
CREATE TABLE users (
  id            bigserial PRIMARY KEY,
  name          text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  email         citext      NOT NULL UNIQUE,
  password_hash text        NOT NULL,
  branch        text        NOT NULL,
  year          smallint    NOT NULL CHECK (year BETWEEN 1 AND 5),
  github_url    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE skills (
  id    bigserial PRIMARY KEY,
  slug  text NOT NULL UNIQUE,      -- canonical, lowercase: 'python', 'react'
  label text NOT NULL              -- display: 'Python', 'React'
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

CREATE TABLE project_skills (          -- the project's tech stack
  project_id bigint NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id   bigint NOT NULL REFERENCES skills(id)   ON DELETE CASCADE,
  PRIMARY KEY (project_id, skill_id)
);

CREATE TABLE roles (
  id         bigserial PRIMARY KEY,
  project_id bigint NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      text   NOT NULL CHECK (char_length(title) <= 60),  -- 'Frontend dev'
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

Requires `CREATE EXTENSION IF NOT EXISTS citext;`.

**Invariants**
- Email is case-insensitive unique.
- Deleting a user deletes their projects (cascade). Deleting a project deletes roles and tags.
- A skill is referenced by `skills.slug`; the UI never creates arbitrary skills except via the normalization path in §7.1.

---

## 7. Matching Engine (`matcher.py`)

Pure functions. No database or network calls inside. Inputs are plain sets.

### 7.1 Skill normalization
1. Lowercase, trim, collapse whitespace.
2. Apply alias map (examples): `js`→`javascript`, `py`→`python`, `reactjs`→`react`, `node`→`nodejs`, `postgres`→`postgresql`, `ml`→`machine-learning`, `cpp`→`c++`.
3. If the result exists in `skills.slug`, use it. Otherwise it is rejected with a `422` and suggestions (v1 does not allow arbitrary new skills; seed a generous list of ~80).

### 7.2 Scoring

Given user skill set `U`, project stack set `S`, and open (unfilled) roles `R₁…Rₙ` each with required set `Rᵢ.skills`:

```
stack_coverage = |U ∩ S| / |S|                       (0 if S empty)
role_fit       = max over open roles of |U ∩ Rᵢ| / |Rᵢ|   (0 if no open roles)
score          = round(100 × (0.6 × role_fit + 0.4 × stack_coverage))
```

- Closed projects are excluded from ranking by default.
- Tie-break: higher `role_fit`, then newer `created_at`.
- Returned reasons: `matched_skills` (top 3 of `U ∩ S`, alphabetical), `best_role` (title of the role giving `role_fit`, if > 0).

### 7.3 Suggested members (F7)
For a given open role with required set `Rᵢ`, rank users by `|U ∩ Rᵢ| / |Rᵢ|` descending, excluding the project owner and users with overlap 0. Return top 5.

### 7.4 Test cases (must pass before merge)
| User skills | Stack | Open roles | Expected |
|---|---|---|---|
| {python, flask} | {python, flask, postgresql} | [] | coverage 0.667 → score 27 |
| {react} | {python} | [Frontend: {react, css}] | role_fit 0.5, coverage 0 → score 30 |
| {} | any | any | score 0, no badge |
| {python} | {} | [] | score 0, no division error |
| {python} | {python} | [Backend: {python}] | score 100 |

---

## 8. API Contract

Base path `/api`. JSON in/out. Auth via session cookie. All write endpoints require login unless noted.

### 8.1 Conventions
- Success: `200/201` with body. Delete: `204`.
- Error shape (always):
```json
{ "error": { "code": "validation_error", "message": "Invalid input", "fields": { "title": "Max 80 characters" } } }
```
- Codes: `400` malformed, `401` not logged in, `403` not owner, `404` not found, `409` conflict, `422` validation, `429` rate limited, `500` server.
- **FastAPI note:** its default validation error body (`{"detail": [...]}`) does not match this shape. Register exception handlers for `RequestValidationError`, `HTTPException`, and unhandled exceptions so every error returns the shape above, with Pydantic's per-field messages mapped into `fields`. The frontend relies on this shape.

### 8.2 Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/signup` | no | Create account, start session |
| POST | `/auth/login` | no | Start session |
| POST | `/auth/logout` | yes | End session |
| GET | `/me` | yes | Current user + skills |
| PUT | `/me/skills` | yes | Replace skill set `{ "skills": ["python","react"] }` |
| GET | `/skills` | no | Canonical skill list (for pickers) |
| GET | `/projects` | optional | List/search/filter (see below) |
| GET | `/projects/{id}` | optional | Full detail (contact fields only if logged in) |
| POST | `/projects` | yes | Create (with `skills[]` and `roles[]`) |
| PATCH | `/projects/{id}` | owner | Update fields, status |
| DELETE | `/projects/{id}` | owner | Delete |
| PATCH | `/projects/{id}/roles/{roleId}` | owner | `{ "filled": true }` |
| GET | `/projects/{id}/suggestions` | owner | Suggested members per open role (§7.3) |
| POST | `/projects/{id}/refresh-repo` | owner | Re-fetch GitHub metadata |
| GET | `/health` | no | Liveness for Render (full path `/api/health`) |

### 8.3 `GET /projects` query params
| Param | Type | Notes |
|---|---|---|
| `q` | string | Case-insensitive match on title/summary |
| `skill` | repeatable | Project must contain **all** given skills |
| `status` | `open`\|`closed` | Default `open` |
| `sort` | `match`\|`new` | Default `match` if logged in with skills, else `new` |
| `page`, `page_size` | int | Defaults 1 and 12; max page_size 50 |

Response:
```json
{
  "items": [{
    "id": 7, "title": "Campus Bus Tracker", "summary": "...",
    "skills": ["python","flask"], "open_roles": 2, "status": "open",
    "owner": { "id": 3, "name": "A. Kumar" },
    "match": { "score": 72, "matched_skills": ["flask","python"], "best_role": "Backend dev" }
  }],
  "page": 1, "page_size": 12, "total": 31
}
```
`match` is `null` when logged out or user has no skills.

### 8.4 `GET /projects/{id}` additions
Adds `description`, `roles[{id,title,skills[],filled}]`, `repo_url`, `repo_meta`, `created_at`. Adds `contact_email` and `contact_url` **only if authenticated**.

### 8.5 Validation limits
Title ≤80, summary ≤200, description ≤4000, role title ≤60, ≤10 roles per project, ≤15 skills per project, ≤30 per user, password ≥8 chars. `repo_url` must match `^https://github\.com/[\w.-]+/[\w.-]+/?$`.

---

## 9. GitHub Integration

- On project create/update with a `repo_url`, parse `owner/repo` and call `GET https://api.github.com/repos/{owner}/{repo}`.
- Store only `{stars, language, pushed_at, fetched_at}` in `repo_meta`.
- Use `GITHUB_TOKEN` (read-only, no scopes) to raise the rate limit from 60/hr to 5000/hr.
- **Fail-soft:** timeout 3s; on any error, store nothing, log a warning, and continue. Never block project creation on GitHub.
- Cache: do not refetch if `fetched_at` < 6 hours old unless `refresh-repo` is called.

---

## 10. Frontend Specification

Single page, hash-routed. No framework, no build step.

### 10.1 Structure
```
/static
  index.html
  css/   tokens.css, base.css, components.css
  js/    api.js, state.js, router.js, views/{feed,profile,newProject}.js,
         components/{card,modal,skillPicker,toast}.js
```

### 10.2 Views
| Route | View | Notes |
|---|---|---|
| `#/` | Feed | Search bar, skill filter chips, card grid, pagination |
| `#/project/{id}` | Feed + Modal | Popup opens over the feed; closing returns to `#/` |
| `#/new` | Project form | Create/edit; inline validation |
| `#/profile` | Profile | Name, branch, year, skill picker |
| `#/login`, `#/signup` | Auth forms | |

### 10.3 Components
- **ProjectCard:** title, summary (2-line clamp), tech chips (max 4 + "+N"), open-role count, match badge (if present), lead name.
- **ProjectModal:** sections — overview, stack, open roles (each with required skill chips), contact (`Contact lead`, `View repo`), repo stats if available.
- **SkillPicker:** type-ahead over `/skills`, multi-select chips.
- **Toast:** non-blocking success/error messages.

### 10.4 States (every data view must handle all four)
Loading (skeleton cards) · Empty (message + action) · Error (message + retry) · Populated.

### 10.5 UX and accessibility requirements
- Modal: `role="dialog"`, `aria-modal="true"`, labelled by its title, focus trapped, Esc closes, focus returns to the originating card.
- All interactive elements keyboard reachable; visible focus ring.
- Color contrast ≥ WCAG AA. Never encode meaning by color alone.
- Responsive: 1 column <640px, 2 columns <1024px, 3 columns otherwise.
- Debounce search input 300ms. Cancel in-flight request on new input.
- Render user-generated text with `textContent`, never `innerHTML`.

---

## 11. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Performance** | `GET /projects` p95 < 400ms for ≤500 projects (Render free tier cold start excepted). First paint < 2s on 4G. |
| **Security** | Passwords hashed with Argon2 (`pwdlib`). Session cookie `HttpOnly`, `Secure`, `SameSite=Lax`. Parameterized SQL only. CSRF: state-changing endpoints require `Content-Type: application/json` and `SameSite=Lax`; add token if time permits. Escape all output. |
| **Privacy** | Contact email only shown to logged-in users. No emails in list endpoints. Passwords never logged. |
| **Rate limiting** | Auth endpoints: 10/min/IP. Writes: 60/min/user. (`slowapi`, in-memory is fine for v1.) |
| **Reliability** | `/api/health` endpoint. GitHub and any LLM calls are fail-soft. |
| **Observability** | Structured request logs (method, path, status, duration). No PII in logs. |
| **Config** | All secrets via environment variables. Use local `.env`; keep it git-ignored and never commit secrets. |

---

## 12. Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon connection string (`sslmode=require`) |
| `SECRET_KEY` | Session cookie signing (`SessionMiddleware`) |
| `GITHUB_TOKEN` | Optional, raises rate limit |
| `APP_ENV` | `development` / `production` (controls `Secure` cookie flag and `/docs`) |

---

## 13. Repository Layout

```
devmatch/
├─ SPEC.md
├─ README.md
├─ .env
├─ requirements.txt
├─ app/
│  ├─ main.py            # FastAPI app, middleware, exception handlers, static mount
│  ├─ db.py              # connection + helpers
│  ├─ deps.py            # dependencies: get_db, current_user, require_owner
│  ├─ security.py        # password hashing
│  ├─ routers/           # auth.py, projects.py, skills.py, me.py
│  ├─ schemas/           # Pydantic models: auth.py, profile.py, user.py (§8.5 limits live here)
│  ├─ matcher.py         # pure functions (§7)
│  └─ github_client.py
├─ frontend/             # static HTML/CSS/JavaScript app
└─ render.yaml           # Render web-service configuration
```

---

## 14. Testing Strategy

Automated tests are not checked into this repository. The existing database has
demo data, but that does not replace validating application changes; run an
external test suite when available and complete the smoke checklist manually:

- Signup/login, add skills, and confirm the feed re-ranks.
- Open a project from a card and by deep link; verify Escape, click-outside,
  close button, keyboard focus trapping, and focus restoration.
- Check logged-out contact privacy, then contact and repository links after login.
- Create/edit/delete a project, change role status, and verify another account
  cannot edit or delete it.
- Exercise loading, empty, retry, and validation-error states.

---

## 15. Deployment

- **Render** web service, Python runtime. Build: `pip install -r requirements.txt`. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Neon** database is provisioned and seeded outside this repository.
- Set env vars in Render dashboard. Health check path `/api/health`.
- Free tier sleeps after inactivity: **hit the URL a few minutes before the demo** to warm it up.
- Keep a local run path (`uvicorn app.main:app --reload`) as a fallback if venue Wi-Fi fails.

---

## 16. Demo Data

The existing database contains the demo users, projects, canonical skills, and match-ready examples. Manage changes to that data outside this repository.

---

## 17. Milestones

> Confirm event rules first (see Open Questions) — whether pre-event code is allowed decides how this is split.

| Phase | Deliverable | Exit criteria |
|---|---|---|
| **M0 — by Oct 8** | Abstract submitted, MLH registration done, repo created with this SPEC | Repo URL filled in the abstract form |
| **M1 — Schema + skeleton** | Provisioned database, FastAPI app, `/api/health`, deployed to Render | `/api/health` returns 200 on the live URL |
| **M2 — Auth + profile** | F1, F2 | US-1 acceptance criteria pass |
| **M3 — Projects + feed** | F3, F4, F5 | US-2, US-3, US-4 pass |
| **M4 — Matching** | F6 with tests | US-5 passes, §7.4 tests green |
| **M5 — Polish** | F7, F8, F9 as time allows, empty/error states, accessibility pass | Smoke checklist passes |
| **M6 — Demo prep** | Seed data, warm-up, 3-minute demo script, fallback plan | Dry run completed |

**Cut line:** if behind schedule, drop in this order: F9 → F7 → GitHub API fetch (keep plain repo links) → pagination UI. Never cut F1–F6.

---

## 18. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Render cold start during demo | Slow first load | Warm up beforehand; keep local fallback |
| Venue Wi-Fi unreliable | Cannot reach Neon/Render | Local run with local Postgres or SQLite-compatible seed as fallback |
| Cold-start "empty marketplace" | Demo looks dead | Seed realistic data (§16) |
| Scope creep (chat, OAuth, LLM) | Core features unfinished | Non-goals in §1.3; cut line in §17 |
| GitHub rate limit / outage | Popup breaks | Fail-soft design in §9 |
| Spam / abusive listings | Trust issue | Owner-only edits, rate limits; admin moderation is P2 |

---

## 19. Open Questions

1. **Do the event rules allow pre-built code/scaffolding before Oct 11, or must all code be written on the day?** This decides whether M1–M4 happen before the event. Confirm with the organizers.
2. Is a live deployed URL required for judging, or is a local demo acceptable?
3. Should sign-up be restricted to `@bitsindri.ac.in` emails? (Adds trust; adds friction for demo accounts.)
4. Abstract mentions "Jev/Laya" models. Confirm the exact model name before claiming it in the final submission; v1 does not depend on any model.
5. Abstract Section 8 lists "Flask" under open-source components; change it to FastAPI (Section 7 already says Flask/FastAPI, which is fine). Also, it says the app won't be open-sourced, but the event is Hacktoberfest/open-source themed. Decide whether the repo will be public, since the judging criteria may reward it.

---

## 20. Definition of Done

A feature is done when:
- [ ] Its acceptance criteria in §4 pass.
- [ ] Inputs are validated server-side with the error shape in §8.1.
- [ ] Loading, empty, and error states exist in the UI.
- [ ] Tests listed in §14 for that feature pass.
- [ ] No secrets in the repo; `.env` updated if config changed.
- [ ] Deployed and verified on the live URL.
- [ ] SPEC.md updated if behavior differs from what is written here.

---

## Appendix A — Suggested Seed Skills (excerpt)

`python, flask, fastapi, django, javascript, typescript, react, nodejs, express, html, css, tailwind, sql, postgresql, mongodb, git, github, docker, linux, c, c++, java, kotlin, flutter, android, machine-learning, pandas, numpy, opencv, figma, ui-design, technical-writing, embedded, arduino, raspberry-pi, matlab, autocad, data-analysis`