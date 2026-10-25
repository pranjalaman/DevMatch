# Spec Delta

## Purpose

Show GitHub repository facts on a project without letting a failed or slow GitHub call block the listing or erase a still-valid snapshot.

## ADDED Requirements

### Requirement: Listing save does not wait on GitHub success
Creating or updating a project with a repository URL SHALL succeed even when repository metadata cannot be fetched. The fetch SHALL time out within 3 seconds.

#### Scenario: GitHub is unavailable during create
- **WHEN** a lead creates a project with a valid repository URL and the metadata fetch fails
- **THEN** the project is saved and the response still returns the project

### Requirement: Failed refresh keeps the snapshot for the same URL
When a fetch fails and the repository URL is unchanged, the system SHALL keep the previously stored snapshot, including a forced refresh. When the URL is removed, the system SHALL clear the snapshot. When the URL changes, the system SHALL NOT keep the previous repository's snapshot; a failed fetch for the new URL SHALL leave the snapshot empty.

#### Scenario: Title edit during a GitHub outage
- **WHEN** the owner updates a field other than the repository URL, a snapshot exists, and the refetch fails
- **THEN** the stored snapshot is unchanged

#### Scenario: Repository URL is cleared
- **WHEN** the owner removes the repository URL
- **THEN** the stored snapshot is cleared

#### Scenario: Repository URL is replaced and the fetch fails
- **WHEN** the owner changes the repository URL and the fetch for the new URL fails
- **THEN** the stored snapshot is empty

### Requirement: Fresh snapshot is reused
The system SHALL NOT call GitHub again when the stored snapshot for the current URL was fetched less than 6 hours ago, unless the owner forces a refresh.

#### Scenario: Repeated save inside the cache window
- **WHEN** the owner updates the project within 6 hours of a successful fetch and does not force a refresh
- **THEN** GitHub is not called and the existing snapshot remains

### Requirement: Missing snapshot is visible to the owner
When a project has a repository URL and no snapshot, the project view SHALL say that repository stats are unavailable. A present snapshot SHALL show its stars, language when one was returned, and last push when one was returned.

#### Scenario: No snapshot yet
- **WHEN** the owner opens a project whose repository URL is set and whose snapshot is empty
- **THEN** the repository section says stats are unavailable

#### Scenario: Language is absent
- **WHEN** a snapshot is present and its language is empty
- **THEN** stars are shown and no language value is invented
