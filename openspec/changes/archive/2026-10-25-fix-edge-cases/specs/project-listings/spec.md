# Spec Delta

## Purpose

Let students browse and open campus projects, and let a lead keep roles, contact links, and listing state consistent with what seekers see.

## ADDED Requirements

### Requirement: Tech tags include every role skill
The system SHALL show a project's tech tags as the sorted union of skills on all of its roles, including filled roles. A project with no roles SHALL show no tech tags.

#### Scenario: Filled role still appears in the stack
- **WHEN** a project's only react skill is on a filled role and another role is open
- **THEN** the card and the detail stack both include react

### Requirement: Skill filter uses unfilled roles
A skill filter SHALL keep a project only when every requested skill appears on at least one unfilled role. Repeated values for the same skill SHALL count once. More than 10 skill parameters SHALL be rejected with a validation error.

#### Scenario: Skill exists only on a filled role
- **WHEN** the viewer filters by python and python is required only by a filled role
- **THEN** that project is not included

#### Scenario: Skills split across open roles
- **WHEN** the viewer filters by python and react and those skills are on two different unfilled roles of the same project
- **THEN** that project is included

### Requirement: Search text is trimmed and bounded
The system SHALL trim the search string and ignore it when the trimmed value is empty. The system SHALL reject a search string longer than 100 characters with a validation error. Matching SHALL be case-insensitive against title and summary.

#### Scenario: Whitespace-only search
- **WHEN** the viewer searches for spaces only
- **THEN** the feed is not constrained by search text

#### Scenario: Search is too long
- **WHEN** the viewer submits a search string longer than 100 characters
- **THEN** the response is a validation error for the search field

### Requirement: Open listings stay visible without an open role
The system SHALL include status-open projects that have no roles or no unfilled role in the default open feed. Filling the last role SHALL NOT change the project status.

#### Scenario: Last role is marked filled
- **WHEN** the owner marks the project's only open role filled
- **THEN** the project status stays open and the open feed still lists it

### Requirement: Pages past the end are not an empty marketplace
The system SHALL return an empty item list with the real total when the requested page is beyond the last page. The feed SHALL NOT use the "no projects" or "no filter matches" state when the total is greater than zero.

#### Scenario: Page beyond the last page
- **WHEN** two pages of projects exist and the viewer requests page 9
- **THEN** the item list is empty, the total is the full result count, and the feed offers a way back to an in-range page

### Requirement: Single-line listing titles
The system SHALL reject a title, summary, or role title that contains a newline or carriage return with a field validation error.

#### Scenario: Title contains a newline
- **WHEN** a lead submits a project title that contains a line break
- **THEN** the project is not saved and the title field has a validation error

### Requirement: Role replacement preserves an omitted filled flag
When a role list is submitted, the system SHALL treat it as the full set of roles, delete omitted roles, and reject a role id that is not on that project. An existing role that omits `filled` SHALL keep its stored value. A new role that omits `filled` SHALL be unfilled. Omitting the role list SHALL leave roles unchanged.

#### Scenario: Edit omits the filled flag
- **WHEN** the owner updates an existing filled role and does not send `filled`
- **THEN** that role stays filled

#### Scenario: Omitted role is removed
- **WHEN** the owner submits a role list that leaves out an existing role
- **THEN** that role is deleted

#### Scenario: Role from another project
- **WHEN** the owner submits a role id that belongs to a different project
- **THEN** the update is rejected and the project's roles stay as they were

### Requirement: Closed projects do not recruit
The system SHALL return project detail for a closed project to any viewer allowed to see it. Suggested teammates SHALL be returned only while the project is open. A closed project SHALL produce an empty suggestion list.

#### Scenario: Suggestions on a closed project
- **WHEN** the owner requests suggestions for a closed project that still has unfilled roles
- **THEN** the suggestion list is empty

### Requirement: Contact actions stay separate
Logged-out viewers SHALL NOT receive contact email or contact URL. A logged-in viewer SHALL get a mailto action whenever the project has a contact email, and a separate http(s) link action whenever the contact URL is a valid http(s) URL. Repository links SHALL open in a new tab without granting the new page access to this one.

#### Scenario: Both contact fields are set
- **WHEN** a logged-in viewer opens a project that has a contact email and a valid contact URL
- **THEN** both a mailto action and a contact-URL action are available

#### Scenario: Logged-out detail
- **WHEN** a logged-out viewer opens a project
- **THEN** the response has no contact email or contact URL and the popup offers login instead of those actions

### Requirement: Missing project deep link
A deep link to a project that does not exist SHALL show a not-found state with a way back to the feed. That state SHALL be distinct from a failed load that can be retried.

#### Scenario: Unknown project id
- **WHEN** the viewer opens a deep link for a project id that does not exist
- **THEN** the popup shows that the project was not found and does not offer retry as the recovery action

### Requirement: Owner edit route
The edit form SHALL be available at `#/edit/{id}` to the project's owner. Another logged-in user SHALL NOT receive an editable form for that project.

#### Scenario: Owner opens the edit route
- **WHEN** the owner opens `#/edit/{id}` for their project
- **THEN** the form shows that project's current fields and roles

#### Scenario: Other student opens the edit route
- **WHEN** a logged-in student who is not the owner opens `#/edit/{id}`
- **THEN** no editable form is shown

### Requirement: Derived skills ignore the unused stack table
The system SHALL derive listing skills, filters, and matches from role skills. It SHALL NOT read or write a separate project-skill table.

#### Scenario: Stack table disagrees with roles
- **WHEN** a stored project-skill row names a skill that none of the project's roles require
- **THEN** cards, filters, and matches do not include that skill
