# Workout Loading Planner

## Purpose

Create and review an ordered, mobile-first workout loading plan derived from a 100% weight, selected percentages, and configured equipment.

## Requirements

### Requirement: Open a planner from either calculator
The system SHALL provide a workout loading planner entry point from both the quick calculator and movement calculator, carrying the calculator's current 100% weight and unit into the planner.

#### Scenario: Open from quick calculator
- **WHEN** the user opens the planner from the quick calculator
- **THEN** the planner uses the quick calculator's current weight and unit as its 100% basis

#### Scenario: Open from movement calculator
- **WHEN** the user opens the planner from a movement calculator
- **THEN** the planner uses that calculator's current weight and unit as its 100% basis and retains enough source context to return to the movement

#### Scenario: Reload the planner
- **WHEN** the planner route is reloaded
- **THEN** the 100% weight and unit remain available from the route without relying exclusively on transient navigation state

### Requirement: Build an ordered percentage plan
The system SHALL start a new planner without preselected percentages, SHALL allow the user to add, remove, and reorder valid percentages for the workout, SHALL reject duplicate or out-of-range percentages, and SHALL treat the displayed order as workout order.

#### Scenario: Open a new empty plan
- **WHEN** the user opens the planner
- **THEN** no percentages are preselected and the interface tells the user to add percentages

#### Scenario: Add a valid percentage
- **WHEN** the user adds a valid percentage that is not already selected
- **THEN** the percentage appears in the workout plan

#### Scenario: Reject an invalid or duplicate percentage
- **WHEN** the user attempts to add an invalid, out-of-range, or duplicate percentage
- **THEN** the plan remains unchanged and the interface communicates that the value cannot be added

#### Scenario: Remove a percentage
- **WHEN** the user removes a selected percentage
- **THEN** its load result and any adjacent derived transition guidance are updated

#### Scenario: Reorder percentages
- **WHEN** the user changes the order of selected percentages
- **THEN** the results and transitions follow the new workout order

### Requirement: Show weights as the primary result
For every selected percentage, the system SHALL prominently show the percentage and target weight, and SHALL also show the achievable weight and signed difference whenever configured equipment cannot produce the exact target.

#### Scenario: Exact target is loadable
- **WHEN** the configured equipment can load the exact percentage target
- **THEN** the result prominently shows that weight without presenting a non-zero difference

#### Scenario: Target requires adjustment
- **WHEN** the configured equipment produces a load different from the mathematical target
- **THEN** the result shows both the target and achievable weight with their signed difference

### Requirement: Show each plate configuration inline
The system SHALL show the plate configuration per side directly with each percentage result, using the configured bar, unit context, plate denominations, and existing practical load calculation behavior.

#### Scenario: A result requires plates
- **WHEN** a selected percentage produces a load above the configured bar weight
- **THEN** its result lists the required plates per side in a scannable configuration

#### Scenario: A result requires no plates
- **WHEN** a selected percentage produces a bar-only load
- **THEN** its result clearly identifies the bar-only configuration

#### Scenario: Equipment uses mixed units
- **WHEN** a calculated configuration contains plates whose native units differ from the planner unit
- **THEN** the result preserves the plate's native denomination while making its planner-unit contribution understandable

#### Scenario: Open a plate diagram deliberately
- **WHEN** the user activates the dedicated diagram control at the far right of a percentage result
- **THEN** the system opens a modal containing that result's plate-loading diagram and details

#### Scenario: Avoid accidental diagram activation
- **WHEN** the user presses non-interactive weight or plate text within a result
- **THEN** the system does not open the plate diagram modal

### Requirement: Show configuration transitions as secondary guidance
The system SHALL derive add/remove guidance between each consecutive pair of configurations and SHALL display it with less visual emphasis than weights and configurations.

#### Scenario: Move to the next load
- **WHEN** two consecutive results require different plate multisets
- **THEN** the transition between them lists the plates to add and remove per side

#### Scenario: Consecutive configurations match
- **WHEN** two consecutive percentage results resolve to the same plate configuration
- **THEN** the transition indicates that no plate change is required

#### Scenario: Workout order changes
- **WHEN** the selected percentages are reordered
- **THEN** all transition guidance is recalculated from the new consecutive pairs

### Requirement: Summarize sequential plate inventory
The system SHALL provide a collapsed, secondary summary of the minimum plate inventory required to assemble every planned configuration on one bar sequentially. For each distinct plate denomination, the required quantity SHALL be the highest per-side count in any one configuration multiplied by two.

#### Scenario: Open the inventory summary
- **WHEN** the user expands the required-inventory section
- **THEN** the system lists total two-sided quantities grouped by native plate denomination

#### Scenario: A denomination appears in multiple configurations
- **WHEN** the same denomination is used in several planned configurations
- **THEN** its inventory quantity is based on the maximum count used by a single configuration rather than the sum across all configurations

#### Scenario: Inventory availability is unknown
- **WHEN** the inventory summary is displayed
- **THEN** it is labeled as required inventory and does not claim that the required quantities are physically available

### Requirement: Provide a mobile-first planner experience
The system SHALL prioritize a single-column phone layout with touch-accessible controls and SHALL keep the planner in a constrained tablet-style container on wider viewports instead of expanding into a desktop dashboard.

#### Scenario: Use the planner on a phone
- **WHEN** the viewport is phone-sized
- **THEN** percentage controls, result rows, transitions, and the inventory disclosure fit a single-column flow without horizontal scrolling

#### Scenario: Use the planner on a wide viewport
- **WHEN** the viewport is wider than the app's tablet presentation
- **THEN** the planner remains centered and width-constrained while preserving the same information hierarchy

#### Scenario: Reorder without precise dragging
- **WHEN** a user operates the planner with touch or keyboard controls
- **THEN** the user can reorder percentages without requiring a drag-only interaction
