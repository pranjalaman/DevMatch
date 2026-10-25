# Spec Delta

## ADDED Requirements

### Requirement: Signup records the joining year
Signup SHALL require the four-digit calendar year the student joined and SHALL store that year. A signup that sends a study year from 1 to 5 and no joining year SHALL be rejected with a field validation error. The joining year SHALL be accepted only inside the academic-year window.

#### Scenario: Joining year is stored
- **WHEN** a student signs up with joining year 2024 during the 2026 session
- **THEN** the account is created and the stored joining year is 2024

#### Scenario: Study year is not accepted
- **WHEN** a student signs up with a study year of 2 and no joining year
- **THEN** the account is not created and the joining-year field has a validation error

### Requirement: Profile can correct the joining year
A signed-in student SHALL be able to replace their joining year. The replacement SHALL use the same window as signup. The profile response SHALL include the stored joining year and the calculated study standing.

#### Scenario: Correction is saved
- **WHEN** a signed-in student changes their joining year from 2024 to 2023
- **THEN** a later profile read includes joining year 2023

#### Scenario: Profile shows the calculated standing
- **WHEN** a student who joined in 2024 reads their profile during the 2026 session
- **THEN** the profile includes joining year 2024 and standing Year 3
