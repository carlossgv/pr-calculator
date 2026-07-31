## 1. Persistence and shared contracts

- [x] 1.1 Extend the Prisma `Account` model with nullable normalized Recovery ID, scrypt salt, and versioned derived-password fields, and add the unique Recovery ID constraint.
- [x] 1.2 Create the additive Prisma migration and regenerate the API client.
- [x] 1.3 Add shared request and response contracts for recovery credential status, setup, credential changes, and device attachment.

## 2. API credential foundations

- [x] 2.1 Implement shared Recovery ID normalization, format validation, and reserved-name validation with focused unit tests.
- [x] 2.2 Implement asynchronous scrypt password derivation and constant-time verification with unique salts and focused unit tests.
- [x] 2.3 Implement the process-local failed-login limiter keyed by normalized Recovery ID and source IP, including successful-login reset and stale-entry cleanup tests.
- [x] 2.4 Add an authenticated recovery-account service and endpoints for reading recovery status and creating, renaming, or resetting credentials without exposing password material.
- [x] 2.5 Add API tests for optional anonymous accounts, setup on the existing account, uniqueness races/errors, password validation, credential changes, and continued authorization of existing devices.

## 3. Device attachment API

- [x] 3.1 Extract a transactional device-attachment service that verifies source-device ownership, validates target credentials, rejects unsafe source-account shapes, reassigns the device, and deletes the abandoned anonymous account and dependent records.
- [x] 3.2 Add the unauthenticated recovery connection endpoint with generic credential errors and the in-memory attempt limiter.
- [x] 3.3 Add API tests proving failed attachment leaves both accounts unchanged, successful attachment cleans up the abandoned account, populated replacement requires explicit authorization, and existing target devices remain connected.
- [x] 3.4 Add an interactive support script that reuses the attachment service, accepts explicit device and target Recovery IDs, and refuses source accounts containing movements or PR entries.

## 4. Client identity and restore coordination

- [x] 4.1 Extend Dexie identity metadata helpers to persist recovery account status and a non-secret restore-in-progress phase.
- [x] 4.2 Add web API client functions for recovery status, credential setup and changes, and device attachment.
- [x] 4.3 Implement a forced push-before-credential-setup flow that reports completion only after pending synchronized data and credentials are confirmed by the server.
- [x] 4.4 Implement meaningful-local-data detection based on movements and PR entries and connect it to the replacement decision flow.
- [x] 4.5 Implement the durable restore barrier: suppress ordinary pushes, clear synchronized local tables, reset the cursor, pull from epoch zero, atomically apply the full result, and clear the barrier only after success.
- [x] 4.6 Resume interrupted restores during app startup and connectivity/native-resume events while blocking ordinary application use behind the localized `Finishing restore` state.
- [x] 4.7 Add client tests for empty-device connection, preferences-only replacement, populated-data cancellation, successful full replacement, and interrupted restore retry without abandoned-data upload.

## 5. Settings and localized recovery UI

- [x] 5.1 Add localized Recovery ID, password, validation, generic login error, replacement warning, export-first, and finishing-restore strings for every supported locale.
- [x] 5.2 Add the anonymous `Sync & recovery` settings state with distinct `Create Recovery ID` and `Connect existing Recovery ID` actions.
- [x] 5.3 Add credential forms with lowercase Recovery ID handling, submission-time availability feedback, password confirmation for setup/reset, and accessible busy/error states.
- [x] 5.4 Add the connected settings state showing a copyable Recovery ID plus Recovery ID and password change actions, without logout, switching, credential removal, or device management.
- [x] 5.5 Add the export/replace/cancel connection confirmation and ensure export completion does not implicitly authorize replacement.
- [x] 5.6 Include both Recovery ID and device support ID in localized support contact content while keeping JSON backups identity-free.

## 6. Verification

- [x] 6.1 Run the smallest relevant API and web test suites and fix recovery-specific failures.
- [x] 6.2 Run API and web typechecks/builds required by the touched packages.
- [x] 6.3 Manually verify anonymous setup, reinstall-style restore, multi-device last-write-wins sync, credential changes, backup export, replacement cancellation, and interrupted-restore recovery.
- [x] 6.4 Review the final migration and diff for plaintext credential exposure, secret logging, hardcoded user-facing copy, unrelated changes, and missing theme-token usage.
