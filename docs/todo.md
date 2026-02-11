# TODO

Date: 2026-02-11

## Completed from recent UX feedback
1. Added visible close controls (`X`) for modal flows while preserving outside-click close.
2. Improved add/create clarity in key flows:
   - Add PR now requires valid fields before enabling submit.
   - Custom % flow moved from always-visible block to compact modal flow.
3. Simplified high-noise header visuals on calculator/movement pages.

## Remaining / next
1. Android bottom gap between button bar and system keyboard/navigation area on some devices.
2. Decide whether to merge/adapt the separate vibrant palette branch (`feature/theme-vibrant-palettes`).
3. Optional UX polish pass for movement detail modal and percent detail wording (copy clarity only).

## Notes
1. Android bottom gap
   - Re-test in native context with `native-safe-area` handling and keyboard open/scroll behavior.
   - Verify behavior with fixed bottom nav in Android emulator and at least one physical device.
2. Vibrant palette branch
   - Branch: `feature/theme-vibrant-palettes`
   - Includes persisted selector (`Electric`, `Sunset`, `Mint`) and high-contrast token overrides.
