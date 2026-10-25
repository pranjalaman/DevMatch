# Tasks

## 1. Academic year

- [x] 1.1 Add a pure function that, for a given date, returns the session year (calendar year on and after 1 August, otherwise the previous calendar year), the standing for a joining year (`Year 1` through `Year 5`, `Incoming`, or `Finished`), and the inclusive joining-year window from session year minus 7 through calendar year plus 1. Verify `python -m unittest` covers 26 October 2026 as session 2026, 31 July 2027 as session 2026, joining year 2024 as Year 3 on that October date and Year 4 on 1 August 2027, 2027 as Incoming, 2020 as Finished, and the window 2019 through 2027 for 26 October 2026.
- [x] 1.2 Document that calculation in `SPEC.md`, including the 1 August rule and the Incoming / Year N / Finished labels. Verify the documented October, July, and August examples match the test dates.

## 2. Accounts and stored joining year

- [x] 2.1 Add `schema/joined-year.sql` that adds `joined_year`, backfills it from `users.year` using the database clock and the 1 August session rule, then sets the column NOT NULL. Keep `DROP COLUMN year` in a separate statement that is not run as part of the backfill. Verify the file contains both statements and the backfill matches the design.
- [x] 2.2 Accept `joined_year` on signup instead of a study year from 1 to 5, store that column, and return `joined_year` plus `standing` on signup, login, and `GET /api/me`. Reject a joining year outside the window with a field error. Verify a schema or router-free unit test that joining year 2024 is accepted in the 2026 session, a body that only sends study year 2 is rejected, and 2018 is rejected on 26 October 2026.
- [x] 2.3 Add `PATCH /api/me` with `{ "joined_year" }` that updates only that column and uses the same window. Show the standing and a joining-year control on `#/profile`, and change signup to ask "Year you joined" with the same window. Verify the profile read model includes joining year 2024 and standing `Year 3` for the 2026 session, and that the signup control no longer offers study years 1 through 5.
- [x] 2.4 Update `SPEC.md` so the user column, signup, and profile describe `joined_year` and the calculated standing. Verify those sections no longer tell a student to pick a study year from 1 to 5 as the stored value.

## 3. Cards and suggestions

- [x] 3.1 Include the lead's `standing` on project list and detail owners, and on each suggestion, computed by the academic-year function. Do not add the joining year to those public payloads. Leave match ranking in the matcher. Verify a unit test that a lead who joined in 2024 is `Year 3` during the 2026 session, and that a suggestion for that same joining year is `Year 3` with no email.
- [x] 3.2 Color project cards in both themes with the existing accent variables: year 1 yellow, 2 green, 3 blue, 4 pink, 5 purple, via `data-standing`. Leave Incoming and Finished on the plain card surface. Print the same standing beside the lead's name. Verify a DOM-free render check that a Year 3 card has `data-standing="3"` and the text `Year 3`, a Year 1 card resolves to the yellow accent, and a Finished card has the text `Finished` and no year color. Verify the CSS maps those five values onto `--yellow`, `--green`, `--blue`, `--pink`, and `--purple` without a second dark palette.
- [x] 3.3 Update `SPEC.md` for the feed card, the lead payload, and suggestion standing. Verify the card section names the five colors and says Incoming and Finished stay on the plain surface.

## Workflow follow-up

- Apply `schema/joined-year.sql` to the external database before the new process starts, and drop `users.year` only after that process is serving.
- Archive the change after implementation and review.
- Sync the delta specs into `openspec/specs/` only when the behavior is actually shipped.
