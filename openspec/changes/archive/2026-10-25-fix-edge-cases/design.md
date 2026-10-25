# Design

## Context

See proposal.md for why these edges matter. Today the list query builds one skill set from every role and passes it to `calculate_match`, which already skips filled roles for role fit and still uses that full set for stack coverage. `fetch_repo_metadata` returns `None` on failure, and the project router writes that `None` into `repo_meta`. `ProjectRoleInput.filled` defaults to `false`, so an omitted flag reopens a role. Signup branch is unbounded text. Outside `APP_ENV=production`, a missing `SECRET_KEY` is generated in the process. The database is provisioned outside this repository, and nothing in the app reads `project_skills`.

## Goals / Non-Goals

**Goals:**

- Keep match math, skill resolution, and repo-snapshot updates as pure or narrowly scoped functions with explicit inputs for "open skills", "display skills", and "fetch failed".
- Make omitted `filled` distinguishable from `false`.
- Fail closed on a missing session secret whenever the process is not in development.
- Lock the new match cases in with stdlib unit tests. No new runtime dependency.

**Non-Goals:**

- Ranking in SQL, changing page size, or dropping `project_skills`.
- A contact channel for suggested students, email verification, or a database probe on `/api/health`.
- Retuning the in-memory auth rate limit.

## Decisions

### 1. Pass two skill sets into formatting, one into the matcher

Display tags stay the sorted union of every role skill. The matcher receives only the union of skills on unfilled roles, plus those roles. `calculate_match` continues to ignore filled roles for role fit. Callers stop passing filled-role skills as the stack.

The list and detail formatters set `match` to `null` when there is no viewer skill set, the viewer is the owner, or there is no unfilled role. They still attach a score of 0 when an unfilled role exists and the overlap is empty.

Alternative: teach the matcher about owners and HTTP. Rejected. Ownership is a request concern; the score function stays free of I/O.

### 2. Integer half-up, not `round`

Python `round` uses banker's rounding, so a weighted total of 12.5 would become 12 and miss the spec. The matcher SHALL compute the weighted total with integer numerators and denominators (tenths 6 and 4 over 10, overlap counts over set sizes) and apply half-up only on that positive rational. A single-role case of 1 shared skill out of 8 is the regression check for 13. A single shared skill on a one-skill role remains 100.

Alternative: `decimal.Decimal` from floats. Rejected. The inputs are counts, so integers avoid binary `0.6`.

### 3. Reason chips and role ties live in the matcher

Best role: highest fit, then larger overlap count, then lower role id. Roles need an id in the matcher input for that last key. Matched skills: alphabetical overlap of the winning role, then alphabetical overlap of the remaining open stack, cut at three. Suggestion ordering stays score, then case-insensitive name, and is covered by the same test module. The suggestions query runs only when `projects.status` is `open`.

### 4. One resolver for skill writes

A single server function normalizes a submitted skill before the database lookup: trim, casefold, apply the alias map, then match `skills.slug` or `skills.label` case-insensitively. Profile replace and role validation both use it. Unknown values still return 422 and do not insert skills. The alias map is the one in `canonical-skills`. The frontend shortcut map stays aligned with it; the client may still resolve labels locally, and the server accepts the same forms.

Skill filters are the decoded query values compared to canonical slugs. The server does not rewrite a raw `+` into a plus sign. Clients percent-encode `c++`.

Alternative: aliases only in the browser. Rejected. A direct API call with `cpp` would keep failing while the form succeeded.

### 5. `filled` is optional on input

`filled` on a role write is optional and defaults to "unspecified", not `false`. Insert of a role without the field stores `false`. Update of an existing role id without the field does not change `filled`. A submitted list is still the full set: missing ids are deleted, and an id from another project fails the request without committing the role rewrite. The database dependency already rolls back when the handler raises.

### 6. Repository fetch returns a result, not a bare `None`

The client distinguishes success, cache hit, and failure. The router keeps the current `repo_meta` when the URL is unchanged and the fetch fails, including forced refresh. It clears `repo_meta` when the URL is removed. It does not pass the old snapshot in when the URL changed, so a failed fetch on the new URL stores null. Cache hits inside 6 hours skip the network unless refresh is forced. Create and update still commit the project when GitHub fails. The modal copy for a URL with a null snapshot stays the unavailable state, separate from rendering stars.

### 7. Validation and boot at the edges that already exist

Search trimming and the 100-character cap, the 10-skill-filter cap, and newline checks on title, summary, and role title happen in the request models or query validation before SQL. Signup branch is the ten codes already shown in the account form. Password max length 128 is signup-only. Startup treats a missing `APP_ENV` as development and raises before serving when any other `APP_ENV` lacks `SECRET_KEY`. Production cookie flags stay HTTP-only, Secure, and SameSite Lax.

The feed treats `total > 0` with an empty page as "this page is out of range", not as an empty marketplace. The unknown-project popup stays a not-found state without retry. `#/edit/{id}` waits for the project read and does not render an editor when the response is forbidden.

## Risks / Trade-offs

- [Integer formula drifts from the written weights] → Unit tests for score 100, score 13, filled-role exclusion, and the role-id tie.
- [Clients that omitted `filled` to mean false will leave roles filled] → Called out as breaking in the proposal. The edit form sends the current flag explicitly.
- [Signup clients that send a full branch name start getting 422] → The form already submits codes. Existing rows with other text can still log in.
- [A deploy that sets `APP_ENV` to something other than `development` without `SECRET_KEY` will not boot] → README states both variables for a public deploy. Local unset `APP_ENV` still starts.
- [Ignored `project_skills` rows surprise anyone who seeded that table] → Documented in SPEC.md. No migration in this change.
- [Shared venue IPs can still trip the auth limit] → Accepted. Rate-limit policy is out of scope.

## Migration Plan

1. Deploy the application change only. Do not alter the external database.
2. Set `APP_ENV=production` and `SECRET_KEY` together on the public host before relying on sessions there.
3. Rollback is a code revert. Stored snapshots and filled flags remain valid. The previous code would again clear snapshots on a failed refetch.

## Open Questions

None. Product choices that would change these specs are already fixed in the proposal assumptions.
