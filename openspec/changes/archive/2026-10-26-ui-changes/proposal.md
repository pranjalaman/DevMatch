# Proposal

## Why

A student's year of study is chosen once at signup and never moves, so a card colored by that number would be wrong the next August. The year they joined does not go stale, and the study year can be calculated from it.

## What Changes

- Signup and profile ask for the year the student joined BIT Sindri, not a study year from 1 to 5. The profile can correct that joining year later.
- The study year is calculated from the joining year. The academic session turns on 1 August: on that date the session year becomes the calendar year, and until then it stays the previous calendar year. Study year is `session year - joining year + 1`.
- A study year from 1 to 5 is shown as "Year N". Below 1 is "Incoming". Above 5 is "Finished".
- Project cards in light and dark mode use a background for that standing: year 1 yellow, 2 green, 3 blue, 4 pink, 5 purple. Incoming and Finished keep the plain card surface. The year is also written on the card, next to the lead's name.
- Suggested teammates report that same calculated standing.
- **BREAKING:** Signup no longer accepts a study year from 1 to 5. It accepts the four-digit joining year.
- Existing accounts are converted once. A stored study year is treated as correct for the session in progress on the day of the conversion, and replaced with the joining year `session year - stored year + 1`.

Assumptions:

- "Year you joined" means the calendar year they entered the college, not the passing-out batch.
- A joining year may be from eight sessions ago through next calendar year, judged on the day of the request, so an incoming student can sign up before August.
- The GitHub profile URL stays unsettable. Dark mode, other than these card colors, stays as it is.

## Capabilities

### New Capabilities

- `academic-year`: Joining year, the 1 August session rule, and the Incoming / Year N / Finished standing derived from it.

### Modified Capabilities

- `student-accounts`: Signup and profile collect the joining year instead of a study year from 1 to 5.
- `project-listings`: A project card shows the lead's standing in text and as a background color in both themes.
- `project-matching`: A suggestion's year is the calculated standing, not a stored study year.

## Impact

- Signup, profile, and user payloads replace the stored study year with a joining year and a calculated standing.
- The feed owner object and suggestion rows gain that standing. Card markup and both theme palettes use it.
- The external database replaces `users.year` with the joining year after a one-time conversion. No new runtime dependency.
