# TODO

Date: 2026-02-05

## UX fixes from user feedback
1. Add a visible close button ("X") on all modals.
2. Fix Android bottom gap between the button bar and system keyboard/navigation area on some devices.
3. Improve clarity of "create" vs "add" flows for PRs and movements.

## Notes / Ideas
1. Modal close button
   - Add a top-right icon button in `apps/web/src/ui/Modal.tsx`.
   - Ensure `aria-label="Close"` and keyboard focusable.
2. Android bottom gap
   - Investigate safe area / insets in `apps/web/src/utils/native-safe-area.ts` and layout containers.
   - Verify handling of `visualViewport` resize and `env(safe-area-inset-bottom)`.
   - Test on at least one physical Android device and Chrome DevTools device emulation.
3. Create vs add flows
   - Movements: clarify "New movement" vs "Add PR" CTA placement and labeling.
   - PRs: provide a single primary flow (e.g., "Add PR") with optional advanced entry.
   - Consider a short inline helper text or first-run tooltip.
