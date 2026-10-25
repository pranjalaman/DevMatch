# Spec Delta

## ADDED Requirements

### Requirement: Listing includes the lead's standing
Each project in the list and detail responses SHALL include the lead's calculated study standing.

#### Scenario: Feed item carries the standing
- **WHEN** a project whose lead joined in 2024 is listed during the 2026 session
- **THEN** that item's lead standing is Year 3

### Requirement: Card background follows the lead's standing
In both the light theme and the dark theme, a project card SHALL use yellow for Year 1, green for Year 2, blue for Year 3, pink for Year 4, and purple for Year 5. Incoming and Finished SHALL use the plain card surface. The card SHALL show that same standing in text beside the lead's name.

#### Scenario: Third-year lead
- **WHEN** the lead's standing is Year 3
- **THEN** the card background is blue and the card text includes Year 3

#### Scenario: Finished lead
- **WHEN** the lead's standing is Finished
- **THEN** the card uses the plain surface and the card text says Finished

#### Scenario: Dark theme uses the same years
- **WHEN** the dark theme is active and the lead's standing is Year 1
- **THEN** the card background is the dark yellow and the card text includes Year 1
