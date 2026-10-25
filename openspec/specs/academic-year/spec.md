# academic-year Specification

## Purpose

Derive a student's study standing from the year they joined, using a session that turns on 1 August, so the standing stays current without being stored.

## Requirements

### Requirement: Session turns on 1 August
The academic session year SHALL be the calendar year on and after 1 August, and the previous calendar year on every earlier date.

#### Scenario: October uses this calendar year
- **WHEN** the date is 26 October 2026
- **THEN** the session year is 2026

#### Scenario: July uses the previous calendar year
- **WHEN** the date is 31 July 2027
- **THEN** the session year is 2026

### Requirement: Study standing is derived from the joining year
The study year SHALL equal the session year minus the joining year plus 1. A study year from 1 to 5 SHALL be presented as Year N. A study year below 1 SHALL be presented as Incoming. A study year above 5 SHALL be presented as Finished.

#### Scenario: Third session
- **WHEN** the session year is 2026 and the student joined in 2024
- **THEN** the standing is Year 3

#### Scenario: Day before the new session
- **WHEN** the date is 31 July 2027 and the student joined in 2024
- **THEN** the standing is Year 3

#### Scenario: First day of the new session
- **WHEN** the date is 1 August 2027 and the student joined in 2024
- **THEN** the standing is Year 4

#### Scenario: Not yet started
- **WHEN** the session year is 2026 and the student joined in 2027
- **THEN** the standing is Incoming

#### Scenario: Past the fifth year
- **WHEN** the session year is 2026 and the student joined in 2020
- **THEN** the standing is Finished

### Requirement: Joining year stays inside a recent window
A joining year SHALL be accepted only when it is an integer from the calendar year minus 5 through the calendar year. Any other value SHALL be rejected with a field validation error.

#### Scenario: Oldest accepted year
- **WHEN** the calendar year is 2026 and the joining year is 2021
- **THEN** the joining year is accepted

#### Scenario: Current calendar year
- **WHEN** the calendar year is 2026 and the joining year is 2026
- **THEN** the joining year is accepted

#### Scenario: Too far back
- **WHEN** the calendar year is 2026 and the joining year is 2020
- **THEN** the joining year is rejected with a field validation error

#### Scenario: Next calendar year
- **WHEN** the calendar year is 2026 and the joining year is 2027
- **THEN** the joining year is rejected with a field validation error

### Requirement: Stored study years convert once
An existing account whose stored value is a study year from 1 to 5 SHALL be converted once to the joining year equal to the session year at conversion minus that study year plus 1. After conversion, standing SHALL be derived from the joining year.

#### Scenario: Year 2 during the 2026 session
- **WHEN** conversion runs in the 2026 session for an account whose stored study year is 2
- **THEN** the joining year becomes 2025
