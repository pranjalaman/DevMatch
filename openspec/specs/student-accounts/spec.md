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
