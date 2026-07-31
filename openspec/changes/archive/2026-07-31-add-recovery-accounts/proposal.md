## Why

Users currently receive an anonymous account tied to a generated device credential, so deleting the app also removes the only practical way to find and authenticate that account. Optional user-chosen recovery credentials will let users restore their synchronized PR data after reinstalling the app and connect multiple devices to the same existing account.

## What Changes

- Add an optional, unique Recovery ID and password to existing anonymous accounts without moving or recreating their synchronized data.
- Allow a fresh anonymous device to connect to an existing recoverable account and then use the current account-scoped synchronization behavior.
- Add safe replacement handling when the connecting device already contains meaningful local data, including an export-first option and protection against partial restores.
- Allow connected devices to change the Recovery ID or password without disconnecting other devices.
- Add lightweight password protection, generic login failures, and best-effort in-memory rate limiting.
- Add a support script that can attach an empty device to a recoverable account for exceptional manual recovery.
- Keep account creation optional, preserve anonymous use by default, and leave account archival/deletion and device-management UI outside this change.

## Capabilities

### New Capabilities

- `recovery-credentials`: Optional Recovery ID and password setup, validation, authentication, display, and credential changes for an existing account.
- `account-device-connection`: Safe attachment of new devices to existing accounts, local-data replacement, full restoration, multi-device synchronization, and exceptional support attachment.

### Modified Capabilities

None.

## Impact

- Extends the Prisma `Account` model and adds a database migration for recovery credentials.
- Adds API contracts and NestJS endpoints for credential setup, credential changes, and device attachment.
- Adds settings UI and localized copy for recovery setup, connection, restoration, and errors.
- Updates client identity and sync coordination to handle account switching, full restoration, and interrupted-restore recovery.
- Adds password hashing through Node's built-in `scrypt`, plus an in-memory login-attempt limiter.
- Adds focused API, web, and synchronization tests and a guarded API support script.
