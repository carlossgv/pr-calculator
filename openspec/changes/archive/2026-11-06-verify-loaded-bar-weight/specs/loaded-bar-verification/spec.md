## ADDED Requirements

### Requirement: Open and revisit bar verification
The system SHALL offer a destination in primary navigation and SHALL open a focused, mobile-friendly verification screen. It SHALL retain the selected unit, bar, and per-side count while the user navigates within the current app load, and SHALL start from equipment preferences with no plates selected after a full reload.

#### Scenario: First visit in an app load
- **WHEN** the user opens bar verification for the first time after loading the app
- **THEN** the screen uses preferred equipment and has an empty per-side count

#### Scenario: Open from primary navigation
- **WHEN** the user activates the bar verification destination in primary navigation
- **THEN** the verification screen opens directly

#### Scenario: Return after visiting another screen
- **WHEN** the user leaves the verification screen and later opens it again
- **THEN** the previously selected unit, bar, and per-side count remain and the same total appears

#### Scenario: Reload the app
- **WHEN** the user manually reloads the app and opens bar verification
- **THEN** the per-side count starts empty and equipment is initialized from preferences

### Requirement: Configure the bar and plate choices
The system SHALL initialize the bar and unit from preferences, SHALL show only the two standard bar choices of the active unit context, SHALL allow the user to choose either bar directly, and SHALL present quick-add plate denominations from the active equipment context with each native unit visible.

#### Scenario: Use preferred equipment
- **WHEN** the screen opens with saved equipment preferences
- **THEN** the selected bar and plate choices reflect those preferences

#### Scenario: Change the bar
- **WHEN** the user chooses another bar
- **THEN** the total updates immediately while selected plates remain counted

#### Scenario: Switch unit context
- **WHEN** the user switches between kg and lb contexts
- **THEN** the bar changes to its equivalent type in the new context, the visible bar choices are 20/15 kg or 45/35 lb respectively, and previously selected plates retain their native values and units

#### Scenario: Correct a plate after switching contexts
- **WHEN** a selected plate is absent from the newly active denomination list
- **THEN** its selected card remains visible so the user can remove it directly

### Requirement: Count and correct plates on one side
The system SHALL show minus, quantity, and plus together on each denomination card, SHALL add or remove one plate on the counted side per activation, and SHALL offer an immediate clear action. The system SHALL explicitly state that the counted side is duplicated in the total.

#### Scenario: Add a denomination repeatedly
- **WHEN** the user activates the same plate denomination twice
- **THEN** its selected quantity becomes two and the total includes four physical plates of that denomination

#### Scenario: Correct a count
- **WHEN** the user removes one selected plate
- **THEN** its per-side quantity decreases by one and the total updates immediately

#### Scenario: Empty denomination
- **WHEN** a denomination has zero selected plates
- **THEN** its minus control is disabled and its displayed quantity is zero

#### Scenario: Clear the count
- **WHEN** the user activates clear
- **THEN** all selected plate quantities become zero while the bar and unit selection remain

### Requirement: Display an auditable total immediately
The system SHALL prominently display the total `bar + 2 × sum(selected plates on one side)` after every change, SHALL show a readable breakdown with native plate units, and SHALL calculate mixed-unit contributions before rounding the displayed total.

#### Scenario: Bar only
- **WHEN** no plates are selected
- **THEN** the result identifies a bar-only load and equals the selected bar weight in the displayed unit

#### Scenario: Symmetric plate load
- **WHEN** a 20 kg bar has one 25 kg plate and one 15 kg plate selected per side
- **THEN** the displayed total is 100 kg and the breakdown shows the bar plus twice the per-side plates

#### Scenario: Mixed-unit load
- **WHEN** the selection contains lb and kg plates
- **THEN** the total includes correctly converted contributions and the breakdown retains each plate's native denomination and unit

### Requirement: Make rapid verification accessible
The system SHALL use touch-accessible and keyboard-operable controls, SHALL expose meaningful accessible names for adding and removing denominations, SHALL provide localized user-facing text, and SHALL soften content scrolling behind the sticky result's edges.

#### Scenario: Verify on a phone
- **WHEN** the user operates the screen at phone width
- **THEN** the total, bar selection, and plate controls fit without horizontal scrolling and the total remains easy to identify

#### Scenario: Operate without color cues
- **WHEN** the user reads the interface without relying on plate colors
- **THEN** denomination, unit, quantity, and total remain available as text
