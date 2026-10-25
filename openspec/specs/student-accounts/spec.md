# student-accounts Specification

## Purpose

Keep signup data inside the campus vocabulary and keep a deployed session signed across restarts.

## Requirements

### Requirement: Signup branch is a canonical campus code
The system SHALL accept only these branch codes on signup: CSE, IT, ECE, EE, ME, CE, CHE, MIN, MET, and PIE. Any other branch SHALL be rejected with a field validation error. An account that already has a different branch SHALL still be able to log in.

#### Scenario: Unknown branch on signup
- **WHEN** a student signs up with a branch outside the canonical codes
- **THEN** the account is not created and the branch field has a validation error

#### Scenario: Existing non-canonical branch
- **WHEN** an existing account has a branch outside the canonical codes and the password is correct
- **THEN** login succeeds

### Requirement: Signup password length
The system SHALL reject a signup password shorter than 8 characters or longer than 128 characters with a field validation error. Login SHALL NOT reject a password solely for being longer than 128 characters.

#### Scenario: Password is too long at signup
- **WHEN** a student submits a signup password longer than 128 characters
- **THEN** the account is not created and the password field has a validation error

#### Scenario: Existing long password
- **WHEN** an existing account's password is longer than 128 characters and it matches the stored hash
- **THEN** login succeeds

### Requirement: Session secret outside local development
The system SHALL refuse to start when `APP_ENV` is any value other than `development` and `SECRET_KEY` is missing. When `APP_ENV` is missing, the system SHALL treat the environment as development. In production the session cookie SHALL be HTTP-only, Secure, and SameSite Lax.

#### Scenario: Production without a secret
- **WHEN** the process starts with `APP_ENV=production` and no `SECRET_KEY`
- **THEN** the process exits before serving requests

#### Scenario: Local development without a secret
- **WHEN** the process starts with `APP_ENV` unset and no `SECRET_KEY`
- **THEN** the process starts and can sign a session for that process

#### Scenario: Other deployed environment without a secret
- **WHEN** the process starts with `APP_ENV` set to a value other than `development` and no `SECRET_KEY`
- **THEN** the process exits before serving requests

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
