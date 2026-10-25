# Design

## Context

`users.year` is a `smallint` from 1 to 5, written only by signup. The profile reads it and cannot change it. Project payloads expose the lead as `{ id, name }`. Suggestion rows copy `users.year` through the matcher, which does no calendar math. Cards use `background: var(--surface)` in both themes. The accent variables `--yellow`, `--green`, `--blue`, `--pink`, and `--purple` already switch to darker shades under `[data-theme="dark"]`. The database is provisioned outside this repository. See proposal.md for why the stored study year is the wrong fact.

## Goals / Non-Goals

**Goals:**

- One pure function owns the 1 August rule, the standing labels, and the accepted joining-year window.
- Signup, profile correction, feed cards, and suggestions all read that result.
- Light and dark cards share one color mapping by reusing the existing accent variables.

**Non-Goals:**

- Teaching the matcher the calendar.
- A scheduled job that increments a stored year.
- Setting `users.github_url`.
- Changing dark mode beyond the card background.

## Decisions

### Calculate standing outside the database

A function of `(joining year, date)` returns the session year, the standing label, and the inclusive window. Callers pass today's date. The matcher keeps ranking by skills. The suggestion query selects `joined_year`, and the router attaches the standing before the matcher sees the student. Project formatting does the same for the lead.

Alternative: store the study year and add 1 every August. Rejected. The process sleeps, a second run would skip a year, and the column cannot hold 6.

### Replace `users.year` with `joined_year`

The column is `joined_year smallint NOT NULL`. The app stops reading `year`. There is no static check constraint, because the legal window moves every August. The API rejects values outside the window.

Public project owners and suggestions gain `standing` (`"Year 1"` … `"Year 5"`, `"Incoming"`, `"Finished"`) and do not gain the joining year. The signed-in profile returns both `joined_year` and `standing`. Signup and login user objects do too, so the browser session has them.

Alternative: keep sending a numeric `year` and let the browser calculate. Rejected. The card and the suggestions would each need the same calendar, and a numeric year cannot say Incoming or Finished.

### Profile correction is its own write

`PATCH /api/me` with `{ "joined_year": 2024 }` updates that column only. `PUT /api/me/skills` stays the skill replacement. The profile page shows the standing, the joining year, and a control to save a new joining year.

### Cards reuse the accent variables

The card element sets `data-standing` to `1`–`5`. CSS maps those to `--yellow`, `--green`, `--blue`, `--pink`, and `--purple`. Incoming and Finished omit the attribute and stay on `--surface`. The lead line includes the same standing text. Because the accent variables already change with the theme, there is no second dark palette.

The signup and profile controls build their year list with the same window rule in the browser. The server remains the check. The browser copy is locked to the same dates as the Python tests.

## Risks / Trade-offs

- [Conversion uses the session of the day it runs] → Run it while the stored study years are still true for that session. A conversion after the next 1 August treats a stale "year 2" as current and stores the wrong joining year.
- [Dropping `year` before the new process is up breaks the old process] → Add and backfill `joined_year` first, deploy the app, then drop `year`.
- [The browser window can drift from the server] → The same dated examples are asserted in the Python tests and the browser check.
- [Standing text is public on every card] → That is the point of the color. The joining year stays on the signed-in profile.

## Migration Plan

Apply this to the external database before deploying the new process. The session year is taken from the database clock: the calendar year when the month is August or later, otherwise the previous calendar year.

```sql
ALTER TABLE users ADD COLUMN joined_year smallint;

UPDATE users
SET joined_year = (
  CASE
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 8
      THEN EXTRACT(YEAR FROM CURRENT_DATE)
    ELSE EXTRACT(YEAR FROM CURRENT_DATE) - 1
  END
) - year + 1;

ALTER TABLE users ALTER COLUMN joined_year SET NOT NULL;
```

Deploy the app that reads `joined_year`. After that deploy is serving traffic, drop the old column:

```sql
ALTER TABLE users DROP COLUMN year;
```

Rollback before the drop: deploy the previous app, which still reads `year`. Rollback after the drop requires restoring `year` from `joined_year` with the inverse formula for that same session.

## Open Questions

None.
