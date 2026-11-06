## Why

During training or judging, users need to verify the weight already loaded on a bar quickly. The app can calculate plates for a target weight, but it does not let users count visible plates and immediately read the total.

## What Changes

- Add a focused bar verification tool reachable from primary navigation.
- Let users select the bar and add or remove plates counted on one side; update the total weight immediately.
- Show the calculation alongside the total and make the one-side, symmetric-loading assumption explicit.
- Keep the current bar selection and count while navigating within the app, and start fresh after a full reload.
- Support the existing kg, lb, and mixed-unit plate contexts.

## Capabilities

### New Capabilities

- `loaded-bar-verification`: Count plates on one side of a loaded bar and display its total weight for quick visual verification.

### Modified Capabilities

None.

## Impact

The web app's primary navigation, routing, i18n strings, equipment preference handling, and a new calculation view are affected. No API, sync schema, or new dependency is expected.
