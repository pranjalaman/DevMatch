# Tasks

## 1. Match engine

- [x] 1.1 Change `calculate_match` so the stack is only the skills passed in (callers will pass unfilled-role skills), pick the best role by fit, then overlap count, then lower role id, and order matched skills from that role before the rest of the open stack, capped at 3. Use integer half-up for the score. Verify `python -m unittest tests.test_matcher` covers score 100, score 13 for 1-of-8, a filled role that must be omitted by the caller, an empty required set, and the role-id tie.
- [x] 1.2 Pass only unfilled-role skills into the matcher from list and detail formatting. Omit `match` for a logged-out viewer, a viewer with no skills, the owner, and a project with no unfilled role. Keep a score of 0 when an unfilled role exists and nothing overlaps. Return suggestions only when the project is open, still excluding the owner and zero-overlap students, ordered by score then case-insensitive name. Verify with a formatter or suggestions unit test that an owner and an all-filled project produce no match object, and a closed project produces an empty suggestion list.
- [x] 1.3 Update `SPEC.md` §7 so stack coverage, reasons, rounding, owner omission, and the §7.4 table match these cases. Verify the table's expected scores are the ones asserted in `tests.test_matcher`.

## 2. Listings and feed

- [x] 2.1 Restrict the skill filter to unfilled roles, count a repeated skill once, reject more than 10 skill parameters, trim search text, ignore a whitespace-only search, and reject a search longer than 100 characters. Reject newlines in title, summary, and role title. Verify with schema or query-validation unit tests for the newline, the long search, and the 11th skill filter.
- [x] 2.2 Treat omitted `filled` as unspecified: keep the stored value on an existing role, default a new role to unfilled, delete roles missing from a submitted list, and reject a role id from another project without leaving a partial role rewrite. Verify with a unit test that an omitted flag does not clear `filled` and that a foreign role id leaves the current rows unchanged.
- [x] 2.3 On the feed, show an out-of-range page state when `total` is greater than zero and `items` is empty, instead of the empty-marketplace or no-filter-match states. On the popup, show mailto and a valid contact URL as separate actions for a logged-in viewer, and show a not-found state with a path back to the feed and no retry for an unknown project id. Keep `#/edit/{id}` from rendering an editor when the viewer is not the owner. Verify by exercising those four UI states in the browser, or by a DOM-free render check if no browser is available, and record which one was used.
- [x] 2.4 Update `SPEC.md` §8 and §10 for open-role filters, pagination past the end, role replacement, both contact actions, the edit route, and the rule that `project_skills` is not read or written. Verify those sections no longer say the stack used for filters is the union of every role.

## 3. GitHub snapshots

- [x] 3.1 Return success, cache hit, and failure separately from the GitHub client. Keep the current snapshot when the URL is unchanged and the fetch fails, including a forced refresh. Clear it when the URL is removed. Do not reuse the old snapshot after the URL changes; a failed fetch then stores null. Keep the 3-second timeout and still save the project. Verify with a unit test of the keep/clear decision for unchanged URL, cleared URL, and replaced URL, without calling GitHub.
- [x] 3.2 Show the unavailable-stats state when a repository URL is set and the snapshot is null, and omit language when the snapshot has none. Verify the modal renders that unavailable copy for a null snapshot and does not invent a language.
- [x] 3.3 Update `SPEC.md` §9 so a failed refetch keeps the last snapshot for the same URL. Verify the section no longer says every error stores nothing.

## 4. Skills, signup, and session boot

- [x] 4.1 Add one server skill resolver used by profile skill replace and role skill validation: trim, casefold, alias map, then canonical slug or display label. Store only the canonical slug and reject unknown values without inserting skills. Keep the frontend shortcut map aligned with that alias list, including `cpp` to `c++`. Verify a unit test that `cpp`, `JS`, and an unknown token resolve or fail as `canonical-skills` specifies.
- [x] 4.2 Limit signup passwords to 8–128 characters and signup branch to CSE, IT, ECE, EE, ME, CE, CHE, MIN, MET, and PIE. Do not apply the password maximum on login. Verify schema unit tests for a too-long signup password, a rejected branch, and a login password longer than 128 characters that is still accepted by the schema.
- [x] 4.3 Refuse to start when `APP_ENV` is set to anything other than `development` and `SECRET_KEY` is missing. Keep a missing `APP_ENV` on the development path. Document both variables for a public deploy in `README.md`. Verify a unit test that production without a secret fails and that an unset `APP_ENV` does not, and verify the README names both variables.
- [x] 4.4 Update `SPEC.md` §7.1, §8.5, and §12 for aliases, signup bounds, and the session-secret rule. Verify those sections list `cpp` and the ten branch codes and no longer say the API rejects every non-canonical slug without alias resolution.

## Workflow follow-up

- Archive the change after implementation and review.
- Sync the delta specs into `openspec/specs/` only when the behavior is actually shipped.
