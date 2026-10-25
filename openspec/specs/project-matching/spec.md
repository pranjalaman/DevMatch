# project-matching Specification

## Purpose

Rank campus projects for a student using only roles they can still join, and show a reason that cites those roles.

## Requirements

### Requirement: Open roles define the match inputs
The system SHALL compute stack coverage, role fit, score, matched skills, and best role from unfilled roles only. Skills that appear only on filled roles SHALL NOT affect the match.

#### Scenario: Filled-role skill does not match
- **WHEN** a project has a filled role requiring python and an open role requiring figma, and the viewer knows only python
- **THEN** the score is 0, python is not a matched skill, and no best role is returned

#### Scenario: Empty required set contributes nothing
- **WHEN** an unfilled role has no required skills
- **THEN** that role adds nothing to the stack and its role fit is 0

### Requirement: Match object is omitted when joining is impossible
The system SHALL omit the match object when the viewer is logged out, has no skills, is the project owner, or the project has no unfilled role. A viewer with skills SHALL still receive a match object for someone else's project that has an unfilled role, including when the score is 0.

#### Scenario: Owner views their own project
- **WHEN** the logged-in owner has skills and the project has an open role matching those skills
- **THEN** the list item and the detail response omit the match object

#### Scenario: Every role is filled
- **WHEN** a logged-in non-owner has skills and every role on the project is filled
- **THEN** the project can still appear in the open feed and its match object is omitted

#### Scenario: No skill overlap
- **WHEN** a logged-in non-owner has skills, the project has an unfilled role, and none of those skills overlap
- **THEN** the match object is present with score 0, an empty matched-skill list, and no best role

### Requirement: Weighted score uses half-up rounding
The system SHALL set role fit to the maximum, over unfilled roles with at least one skill, of shared skills divided by that role's skills. It SHALL set stack coverage to the viewer's overlap with the union of those skills divided by the size of that union, or 0 when the union is empty. The score SHALL be 100 times (0.6 times role fit plus 0.4 times stack coverage), rounded half-up to an integer.

#### Scenario: Complete overlap
- **WHEN** the viewer knows python and the only unfilled role requires python
- **THEN** the score is 100

#### Scenario: One shared skill out of eight
- **WHEN** the viewer knows 1 skill on the only unfilled role and that role requires 8 skills
- **THEN** the score is 13

### Requirement: Best role tie-break
The system SHALL select the unfilled role with the greatest role fit. Equal fit SHALL prefer the larger skill overlap, then the lower role id. The best role SHALL be omitted when that fit is 0.

#### Scenario: Larger overlap wins an equal fit
- **WHEN** one open role shares both of its skills with the viewer and another open role shares its only skill
- **THEN** the best role is the role with two shared skills

#### Scenario: Lower role id breaks a remaining tie
- **WHEN** two open roles have equal fit and equal overlap count
- **THEN** the best role is the one with the lower role id

### Requirement: Reason chips prefer the best role
The system SHALL return at most three matched skills, chosen from the viewer's overlap with the best role in alphabetical order, then from the remaining open-role overlap in alphabetical order.

#### Scenario: Best-role skill sorts after other stack skills
- **WHEN** the best-role overlap is react and the other open-role overlap includes arduino, css, and docker
- **THEN** the matched skills are react, arduino, and css, in that order

### Requirement: Feed order
For match sort, the system SHALL order projects by score descending, then role fit descending, then newer creation time, then higher project id. Viewers with no match inputs SHALL be ordered newest first. Requesting match sort without skills SHALL use newest-first order.

#### Scenario: Equal scores
- **WHEN** two projects have the same score and the same role fit
- **THEN** the newer project is listed first

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
