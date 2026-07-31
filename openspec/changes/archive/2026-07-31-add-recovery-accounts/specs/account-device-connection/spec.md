## ADDED Requirements

### Requirement: Device can connect to an existing account
A device with valid generated device credentials SHALL be able to authenticate with an existing Recovery ID and password and become associated with that account. The account SHALL support any number of connected devices without an explicit product limit, logout, account switching, or device-management UI.

#### Scenario: Fresh device connects
- **WHEN** an anonymous device submits valid credentials for a recoverable account
- **THEN** the device is attached to that account and its existing device token remains the credential used for subsequent sync requests

#### Scenario: Other devices remain connected
- **WHEN** another device is attached or the account credentials change
- **THEN** all previously connected devices remain associated and authorized

### Requirement: Meaningful local data requires replacement confirmation
For connection safety, meaningful local data SHALL mean at least one local movement or PR entry; preferences alone SHALL NOT count as meaningful. A device with meaningful local data SHALL require an explicit choice to export a backup, replace the local data, or cancel before attaching to another account. The first version SHALL NOT merge accounts or local datasets.

#### Scenario: Device contains movements or PR entries
- **WHEN** the user attempts to connect a device that contains at least one movement or PR entry
- **THEN** the app offers `Export local backup`, `Replace local data`, and `Cancel` before continuing

#### Scenario: Device contains only preferences
- **WHEN** the user connects a device whose only local synchronized information is preferences
- **THEN** the app may replace those preferences without showing the meaningful-data warning

#### Scenario: User cancels replacement
- **WHEN** the user selects `Cancel`
- **THEN** the device, local data, and current anonymous account remain unchanged

### Requirement: Connection replaces rather than merges data
After the user authorizes replacement, the system SHALL prevent the abandoned local dataset from being uploaded to the target account, reset the local synchronization cursor, clear the locally synchronized preferences, movements, and PR entries, and perform a full pull from the target account.

#### Scenario: Replacement completes
- **WHEN** credential verification and device attachment succeed after replacement is authorized
- **THEN** the app contains the target account's full synchronized preferences, movements, and PR entries and no abandoned local records are merged into it

### Requirement: Interrupted restore is recoverable
The client SHALL persist an account-restore-in-progress state before allowing ordinary synchronization against the target account. Until a full pull and local application succeed, the app SHALL block ordinary use and sync pushes, display a localized `Finishing restore` state, and retry restoration when connectivity returns.

#### Scenario: Network fails after attachment
- **WHEN** the device is attached but the full target-account pull fails or is interrupted
- **THEN** the app retains the restore-in-progress state, does not push local records, and retries the full restore rather than exposing partial data

#### Scenario: Interrupted restore completes later
- **WHEN** the app subsequently completes and applies the full pull
- **THEN** it clears the restore-in-progress state and resumes ordinary use and synchronization

### Requirement: Abandoned anonymous account is removed safely
After successful device attachment, the server SHALL permanently delete the device's abandoned anonymous account and its server-side synchronized data. Credential verification, device reassignment, and abandoned-account cleanup SHALL be coordinated so a failed connection neither deletes the source account nor modifies the target account.

#### Scenario: Connection transaction fails
- **WHEN** attaching the device or validating the target account fails
- **THEN** the source anonymous account and its synchronized data remain intact and the device remains associated with it

#### Scenario: Attachment succeeds
- **WHEN** the device is successfully reassigned to the target account
- **THEN** the server deletes the abandoned account's preferences, movements, PR entries, remaining devices, and account record

### Requirement: Existing synchronization semantics continue
Once connected, every device SHALL use the existing account-scoped synchronization model and existing most-recent-update-wins behavior. Only preferences, movements, and PR entries SHALL synchronize; calculator drafts, onboarding state, navigation state, and device metadata SHALL remain local.

#### Scenario: Connected devices edit the same entity
- **WHEN** two connected devices upload different versions of the same synchronized entity
- **THEN** the existing updated-at comparison determines the accepted version

#### Scenario: Device-local state changes
- **WHEN** a connected device changes a local-only draft, onboarding flag, navigation value, or device metadata
- **THEN** that state is not copied to other connected devices

### Requirement: Connected device remains attached
The first version SHALL NOT expose sign-out, account switching, credential removal, or device revocation. A connected device SHALL remain attached unless the app is reinstalled or an administrator changes the association.

#### Scenario: Connected user views recovery settings
- **WHEN** a connected user opens the recovery settings
- **THEN** the app provides credential-management actions but no sign-out, switch-account, remove-credentials, or device-revocation action

### Requirement: Support can attach an empty device
The API package SHALL provide a guarded command-line support script that accepts an explicit source device ID and target Recovery ID, requests confirmation, and attaches the device only if its current anonymous account contains no synchronized movements or PR entries.

#### Scenario: Support attaches an empty device
- **WHEN** an operator supplies an existing empty anonymous device, an existing target Recovery ID, and confirms the operation
- **THEN** the script attaches the device and removes the abandoned empty account using the same safety rules as the API flow

#### Scenario: Support attempts to attach a populated device
- **WHEN** the source anonymous account contains a movement or PR entry
- **THEN** the script refuses the operation without moving or merging any data

### Requirement: Archival and user deletion remain out of scope
The first version SHALL NOT add user-facing account deletion, account archival, or restoration of archived accounts. Future recoverable-account removal is intended to archive data while keeping the Recovery ID reserved, whereas abandoned anonymous accounts are deleted as part of successful replacement.

#### Scenario: User looks for account deletion
- **WHEN** a recoverable user opens Settings in the first version
- **THEN** no archive or delete-account action is presented
