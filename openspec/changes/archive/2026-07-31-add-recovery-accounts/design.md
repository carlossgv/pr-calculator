## Context

The app already creates an `Account` and a generated `Device` credential on first bootstrap. `Device.accountId` scopes API sync for preferences, movements, and PR entries, while the web client stores its generated device ID, device token, account ID, and sync cursor in Dexie. Multiple devices are already representable by the schema, but there is no user-recoverable way to find an account or authorize a newly generated device after application storage is lost.

The feature crosses the Prisma schema, NestJS API, shared API contracts, Dexie identity state, synchronization coordinator, Settings UI, i18n, and support tooling. Human passwords introduce security constraints that differ from the existing high-entropy device tokens.

## Goals / Non-Goals

**Goals:**

- Upgrade an existing anonymous account with optional recovery credentials without moving its data.
- Attach fresh devices to a recoverable account and reuse the existing device-token authorization and account-scoped sync.
- Protect the target account from abandoned local data during account replacement and network interruption.
- Keep recovery understandable and operationally manageable for a small user base.
- Preserve anonymous, offline-tolerant use when recovery is not configured.

**Non-Goals:**

- Email recovery, OAuth, MFA, public profiles, or a full session-token system.
- Automatic merging of populated accounts or divergent local datasets.
- Logout, account switching, device listing/revocation, or a device limit.
- User-facing account deletion or archival.
- Synchronizing calculator drafts, onboarding state, route history, or other existing local-only metadata.

## Decisions

### Extend `Account` rather than introduce a second user model

Add nullable recovery credential fields to `Account`: a unique normalized Recovery ID plus the scrypt salt and derived password value. Existing accounts migrate with null credentials and retain their current behavior. The internal UUID remains the relational identity; the Recovery ID is only a lookup credential.

This avoids migrating synchronized rows or adding another ownership layer. A separate credential table was considered, but a single password credential per account does not currently require its extra lifecycle and joins.

### Use lowercase Recovery IDs with server-side canonical validation

The API normalizes submitted identifiers to lowercase before validation and lookup. A database uniqueness constraint is the final concurrency guard. The client mirrors validation for immediate feedback but does not determine validity. Availability is checked during submission rather than through a public lookup endpoint.

The accepted expression is equivalent to `^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$`, with total length 3-30, followed by a reserved-name check. Releasing renamed identifiers immediately keeps the schema simple; temporary aliases and username history are intentionally omitted.

### Derive passwords with built-in `scrypt`

Use asynchronous Node.js `crypto.scrypt` with a cryptographically random per-account salt and constant-time comparison of derived values. Store versioned/parameterized derivation data so cost parameters can change later. Passwords are 8-128 characters and are neither trimmed nor composition-constrained.

Plain SHA-256 was rejected because user-selected passwords have substantially less entropy than device tokens. A native Argon2 dependency was considered but is unnecessary for this small service when scrypt is already available in Node.

### Keep device tokens as the ongoing authorization mechanism

Recovery credentials are submitted only when setting credentials or attaching a new device. After attachment, the existing random device token continues authenticating sync. Password changes therefore do not invalidate connected devices, and a connected device may manage recovery credentials without the old password.

This avoids adding sessions or sending a human password on every request. It also means access to an unlocked connected app is considered sufficient authority to change recovery credentials, consistent with that user's existing ability to read and modify all synchronized data.

### Separate credential setup from device attachment

Credential setup is an authenticated operation on the current account. Before submitting it, the client forces a sync push and only presents success after the server stores the credentials. Device attachment is a credential-authenticated operation that receives the new device's ID and token, verifies current device ownership, verifies target credentials, reassigns the device, and cleans up its abandoned anonymous account.

The API must reject attachment if the source account is already recoverable or contains other devices that would be unintentionally orphaned. Cleanup explicitly deletes dependent preferences, movements, PR entries, and devices before deleting the abandoned account because the current relations use restrictive deletion behavior. Credential verification and database mutations occur inside a transaction, with password derivation performed before opening the transaction where practical.

### Use a persisted restore barrier on the client

Connecting is not an ordinary pull because a failure after server reassignment could let the source dataset upload to the target account. Before attachment, the client records a durable restore intent containing only non-secret phase metadata. After successful attachment it marks the target account ID, clears synchronized Dexie tables, resets the sync cursor, and performs a pull from epoch zero.

While the restore marker exists, application bootstrap enters a dedicated `Finishing restore` surface and disables normal sync pushes and data-editing routes. The client retries the full pull on startup and connectivity/resume events. It clears the marker only after the full response is applied in a Dexie transaction. The existing device ID and token remain untouched.

An alternative two-phase server challenge could avoid reassignment before local preparation, but it would add expiring server state. The durable client barrier plus transactional server attachment is sufficient for the stated threat and scale.

### Treat movements and PR entries as meaningful replacement data

The replacement warning is shown only when local movements or PR entries exist. Preferences alone are replaced silently because a fresh installation creates preferences and would otherwise always appear populated. Users with meaningful data can export the existing data-only JSON backup, confirm replacement, or cancel; no automatic merge path is provided.

### Reuse existing sync conflict behavior

After a device is attached and fully restored, sync needs no account-specific branch: the auth guard resolves its new `accountId`, and existing timestamp comparisons continue to select the most recently updated entity. No new conflict UI or data type enters scope.

### Apply lightweight process-local rate limiting

Track failed attachment attempts by normalized Recovery ID and source IP in API memory. Five failures within 15 minutes produce a 15-minute block; successful authentication clears the entry. Periodic opportunistic cleanup prevents unbounded entries.

This deliberately favors implementation simplicity. It resets on process restart and does not coordinate across replicas. A database- or Redis-backed limiter can replace it if deployment scale changes.

### Keep exceptional support attachment narrow

A CLI script follows the existing API-script pattern and requires an explicit device ID, target Recovery ID, and interactive confirmation. It refuses source accounts containing movements or PR entries and reuses a shared attachment service so support behavior cannot diverge from API cleanup rules. Populated account migration remains a manual, case-specific database operation outside the feature.

## Risks / Trade-offs

- **A connected or unlocked device can change recovery credentials** → Treat existing device possession as trusted access; add device revocation in a future change if the user base requires it.
- **A user who loses every connected device and forgets the password cannot self-recover** → Document this limitation and use manual support intervention for the current small user base.
- **Interrupted restore can leave the app temporarily unusable** → Persist the restore barrier and retry automatically until the full pull is applied.
- **In-memory rate limiting is bypassable across restarts or replicas** → Keep failures generic and upgrade to shared storage if the service deployment expands.
- **Immediate Recovery ID reuse can confuse a user after renaming** → Display and copy the current identifier clearly; accept this trade-off to avoid identifier-history storage.
- **Permanent deletion of abandoned anonymous data is destructive** → Require explicit replacement confirmation for meaningful data, offer export first, and mutate only after successful credential verification.
- **Existing last-write-wins sync can overwrite simultaneous edits** → Preserve current behavior and keep conflict resolution out of this recovery-focused change.

## Migration Plan

1. Add nullable recovery fields and a unique Recovery ID constraint to `Account`; generate and deploy the Prisma migration before the new API is exposed.
2. Deploy API support for credential management and attachment while existing anonymous clients continue using bootstrap and sync unchanged.
3. Deploy the web/native client UI and restore barrier. Older clients remain compatible because new API contracts are additive.
4. Add the guarded support script after the shared attachment service is available.

Rollback the client first, then the API. The nullable database columns can remain safely during rollback; removing them is unnecessary and would discard configured recovery credentials.

## Open Questions

None. Account archival semantics and device management are intentionally deferred to later changes.
