# Spec Delta

## MODIFIED Requirements

### Requirement: Suggested teammates stay anonymous to contact
For each unfilled role on an open project, the system SHALL rank other students by overlap with that role, omit the owner and anyone with no overlap, and return at most five. Equal scores SHALL list the earlier case-insensitive name first. Each suggestion SHALL include name, branch, the calculated study standing, matched skills, and score, and SHALL NOT include an email or other contact channel.

#### Scenario: Owner is the only skilled student
- **WHEN** the project owner is the only student who has the role's skills
- **THEN** that role has no suggestions

#### Scenario: Two students overlap equally
- **WHEN** two other students have the same overlap ratio on a role
- **THEN** the student whose name sorts first case-insensitively is listed first

#### Scenario: Suggestion uses the calculated standing
- **WHEN** a suggested student joined in 2024 and the session year is 2026
- **THEN** that suggestion's standing is Year 3 and the suggestion has no email
