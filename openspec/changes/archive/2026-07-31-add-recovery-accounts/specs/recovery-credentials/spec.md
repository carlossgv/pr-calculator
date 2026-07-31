## ADDED Requirements

### Requirement: Anonymous use remains the default
The system SHALL allow an account to operate without a Recovery ID or password, and creating recovery credentials SHALL remain optional.

#### Scenario: New installation stays anonymous
- **WHEN** a new installation bootstraps without recovery credentials
- **THEN** the system creates and synchronizes its anonymous account using the existing device credentials

### Requirement: Existing account can enable recovery
An authenticated device SHALL be able to add a unique Recovery ID and password to its current anonymous account without creating a different account or moving its synchronized records. Setup SHALL require network access and SHALL report success only after pending local synchronized data and the recovery credentials are stored by the server.

#### Scenario: Recovery setup succeeds
- **WHEN** an authenticated anonymous device has synchronized its pending preferences, movements, and PR entries and submits an available Recovery ID with matching valid password entries
- **THEN** the system adds the credentials to the device's existing account and presents that account as recoverable

#### Scenario: Setup cannot complete offline
- **WHEN** a user attempts recovery setup while the server cannot confirm both data synchronization and credential storage
- **THEN** the app does not report that recovery setup is complete

### Requirement: Recovery ID format and uniqueness
The system SHALL normalize Recovery IDs to lowercase and SHALL accept only 3 to 30 characters consisting of ASCII letters, digits, hyphens, and underscores, with an ASCII letter or digit at both ends. Recovery IDs SHALL be unique across recoverable accounts, and the system SHALL reject a fixed list of reserved identifiers including `admin`, `support`, `system`, and `root`.

#### Scenario: Mixed-case identifier is normalized
- **WHEN** a user submits `Carlos-7` as a Recovery ID
- **THEN** the system validates, stores, compares, and displays it as `carlos-7`

#### Scenario: Invalid identifier is rejected
- **WHEN** a user submits a Recovery ID containing spaces, accents, unsupported punctuation, an invalid endpoint character, or a length outside the allowed range
- **THEN** the system rejects the Recovery ID with a validation error

#### Scenario: Identifier is unavailable
- **WHEN** a user submits a normalized Recovery ID that is already assigned or reserved
- **THEN** the system does not change the account credentials and reports that the Recovery ID is unavailable

### Requirement: Password handling
The system SHALL accept passwords from 8 through 128 characters without composition rules or trimming, SHALL require matching password and confirmation fields during setup and password changes, and SHALL store only a password derivation produced with Node.js `scrypt` using a unique random salt.

#### Scenario: Valid password is stored securely
- **WHEN** a user submits matching password entries whose length is within the allowed range
- **THEN** the server stores a unique salt and scrypt-derived value and does not store or log the plaintext password

#### Scenario: Password confirmation differs
- **WHEN** the password and confirmation fields do not match
- **THEN** the app rejects the submission without sending a credential change

### Requirement: Connected device can manage credentials
Any authenticated device connected to a recoverable account SHALL be able to change the Recovery ID or reset the password without supplying the old password. A Recovery ID change SHALL release the old identifier immediately, and credential changes SHALL NOT revoke existing device credentials.

#### Scenario: Recovery ID changes
- **WHEN** a connected device submits a different valid and available Recovery ID
- **THEN** the account uses the new normalized Recovery ID and the old Recovery ID becomes available immediately

#### Scenario: Password is reset from a connected device
- **WHEN** a connected device submits and confirms a valid new password
- **THEN** future device connections require the new password and previously connected devices remain authorized

### Requirement: Login responses limit account discovery
The unauthenticated device-connection endpoint SHALL return the same user-facing failure for an unknown Recovery ID and an incorrect password. Recovery ID availability SHALL be checked only when a setup or change form is submitted.

#### Scenario: Unknown identifier and bad password fail generically
- **WHEN** a connection attempt uses either an unknown Recovery ID or an incorrect password
- **THEN** the app displays `Invalid Recovery ID or password` without identifying which value failed

### Requirement: Repeated login attempts are limited
The API SHALL apply a best-effort in-memory limit of five failed connection attempts for the same normalized Recovery ID and source IP within a rolling 15-minute window, block additional attempts for 15 minutes, and clear the tracked failures after a successful connection.

#### Scenario: Attempt limit is reached
- **WHEN** a source submits five failed connection attempts for the same normalized Recovery ID within 15 minutes
- **THEN** the API temporarily rejects further attempts from that Recovery ID and source IP

#### Scenario: API process restarts
- **WHEN** the API process restarts
- **THEN** the in-memory attempt history may be cleared without affecting account credentials

### Requirement: Recovery settings communicate account state
Settings SHALL contain a localized `Sync & recovery` section. Anonymous devices SHALL receive separate `Create Recovery ID` and `Connect existing Recovery ID` actions; connected devices SHALL see the Recovery ID with a copy action plus controls to change the Recovery ID and password. The password SHALL never be displayed.

#### Scenario: Recoverable account appears in Settings
- **WHEN** a connected user opens Settings
- **THEN** the app displays the lowercase Recovery ID and credential-management actions without displaying password material

### Requirement: Backups do not contain authentication identity
JSON data backups SHALL remain limited to preferences, movements, and PR entries and SHALL NOT include Recovery IDs, password derivations, device tokens, account IDs, or other authentication identity.

#### Scenario: Recoverable account exports data
- **WHEN** a user with recovery credentials exports a JSON backup
- **THEN** the exported authentication and identity fields are identical in scope to an anonymous account export and contain no recovery credentials

### Requirement: Support context includes account and device identifiers
The support contact content SHALL include the current Recovery ID when configured and the generated device support ID.

#### Scenario: Recoverable user contacts support
- **WHEN** a connected user opens the support contact action
- **THEN** the prepared support message identifies both the Recovery ID and the device support ID
