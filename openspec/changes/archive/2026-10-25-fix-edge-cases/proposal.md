# Proposal

## Why

DevMatch's happy path is specified, but several real states produce a match explanation, a filter result, or a saved repo snapshot that contradicts what the student can actually do. Those gaps show up on demo day: a filled role still "matches", a GitHub hiccup erases stars, and a shared venue network or a missing deploy setting can lock people out or drop sessions.

## What Changes

- Score and explain a project from **unfilled** roles only. The viewer who owns the project, and any project with no open role, gets no match badge.
- When several open roles fit equally, pick the one with more overlapping skills, then the lowest role id. The three reason chips prefer that role's skills, then alphabetical order.
- Round match percentages half-up.
- Skill filters require each requested skill on an **unfilled** role. Card and detail tech tags still show the full role-skill union, including filled roles.
- Keep open projects with no roles, or with every role filled, on the open feed. Do not auto-close them. Closed projects stay readable by id; suggested teammates are returned only while the project is open.
- Trim search text. A page past the last page returns an empty item list and the real total, and the feed must not present that as "no projects".
- Reject newlines in title, summary, and role title. Cap search length and the number of skill filters.
- **BREAKING:** Replacing roles still replaces the whole set, but an existing role that omits `filled` keeps its stored value. A new role still defaults to unfilled.
- Show mailto whenever a logged-in viewer has a contact email, and show the contact URL as a second action when it is a valid http(s) link.
- A project deep link that 404s uses a not-found state. The edit form lives at `#/edit/{id}`.
- **BREAKING:** A failed GitHub refresh keeps the last snapshot when the repo URL did not change, clears it when the URL is removed, and does not keep the previous repo's stats on a new URL.
- **BREAKING:** Signup branch must be one of the canonical BIT Sindri codes. Password length is 8–128 characters on signup. Skill writes accept the canonical slug or a supported alias, case-insensitively, and store the canonical slug.
- The app refuses to boot outside `APP_ENV=development` unless `SECRET_KEY` is set. `project_skills` is not read or written.

Assumptions, because these were still open:

- Leads do not gain a way to contact a suggested student. Suggestions stay name, branch, year, and matched skills. Filling a role stays a boolean with no assignee.
- Description text is not scanned for leaked contact details.
- Auth rate limits and database-backed health checks stay as they are.

## Capabilities

### New Capabilities

- `project-matching`: Explainable scores and reasons from open roles only.
- `project-listings`: Feed, filters, pagination, role replacement, contact actions, and missing-project state.
- `github-metadata`: Fail-soft repository snapshots that survive a failed refetch.
- `canonical-skills`: Alias and case rules for the shared skill vocabulary, including `c++`.
- `student-accounts`: Signup bounds, canonical branch, and a stable signed session outside local development.

### Modified Capabilities

- None. The repository has no capability specs yet. `SPEC.md` remains the product document this change corrects.

## Impact

- Matcher (`app/matcher/matcher.py`) and project list, detail, update, and suggestions (`app/routers/projects.py`, `app/schemas/project.py`).
- Feed, project modal, and project form (`frontend/js/views/feed.js`, `frontend/js/components/modal.js`, `frontend/js/views/newProject.js`).
- Skill resolution (`frontend/js/helpers.js`, profile and project skill writes).
- Signup validation (`app/schemas/auth.py`) and process startup (`app/main.py`).
- `SPEC.md` sections 6–10 must be updated with the behavior above. The external database is not migrated and `project_skills` is not dropped.
- No new dependency. Automated matcher checks for the new cases are added in-repo; the rest of the suite stays manual, as `SPEC.md` already describes.
