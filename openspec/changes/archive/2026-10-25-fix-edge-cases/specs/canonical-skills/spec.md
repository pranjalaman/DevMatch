# Spec Delta

## Purpose

Resolve every skill a student or a lead submits to one canonical slug, including short aliases and the `c++` skill.

## ADDED Requirements

### Requirement: Skill writes store the canonical slug
The system SHALL accept a canonical slug, its display label, or a supported alias, in any letter case, and SHALL store only the canonical slug.

#### Scenario: Alias is stored as the canonical slug
- **WHEN** a student saves the skill `cpp`
- **THEN** the stored skill is `c++`

#### Scenario: Display label is accepted
- **WHEN** a student saves the display label `Python`
- **THEN** the stored skill is `python`

### Requirement: Supported skill aliases
The system SHALL map `js` to javascript, `py` to python, `reactjs` and `react.js` to react, `node` and `node.js` to nodejs, `postgres` to postgresql, `ml` to machine-learning, `cpp` to `c++`, and `ts` to typescript.

#### Scenario: JavaScript alias
- **WHEN** a lead submits the role skill `JS`
- **THEN** the stored skill is javascript

### Requirement: Unknown skills are rejected
The system SHALL reject a skill that is not a canonical slug, alias, or display label, and SHALL NOT create a skill row.

#### Scenario: Unknown skill
- **WHEN** a lead adds a role skill that is not a canonical slug, alias, or display label
- **THEN** the write is rejected and no new skill row is created

### Requirement: Skill filters use the decoded slug
The system SHALL compare skill filters to canonical slugs after query decoding. A filter for `c++` SHALL match that skill when the client percent-encodes the plus signs.

#### Scenario: Encoded c++ filter
- **WHEN** the viewer filters with the `c++` slug percent-encoded in the query
- **THEN** projects with an unfilled role requiring `c++` are eligible

### Requirement: Profile and role skill limits
A student SHALL have at most 30 stored skills. A project SHALL have at most 15 distinct required skills across its roles. Each role SHALL have at least one skill and at most 15. Duplicate entries in one write SHALL count once toward those limits.

#### Scenario: Duplicate skills in one save
- **WHEN** a student submits python twice in a 30-skill list
- **THEN** python is stored once and the save succeeds
