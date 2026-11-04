# Package status and next work

Skydial 0.3.0 is the current release. The repository is `tbudin/skydial`; the live
[documentation](https://tbudin.github.io/skydial/) describes the published release.
Thomas Budin is the sole author and committer. Plain Matter Pte Ltd holds the
code copyright and owns the website. Required third-party texture notices remain.

The released package provides celestial and LCD date/time inputs, independent
scroll/step controls, inline picker windows, configurable precision and styling,
website widgets, compact displays and standalone bodies. React, Vue, Svelte and
vanilla integrations share a renderer; astronomy and simulation have independent
framework-free entries. See [the API](package-api.md) and [changelog](../CHANGELOG.md).

## Scheduling and production improvements in 0.3.0

This release adds six scheduling and production improvements:

1. One-window date/time ranges with explicit endpoints and orbital highlights.
2. Shared availability rules and whole-range validation.
3. Localized controls, AM/PM and RTL support.
4. A renderer-free LCD React entry, selective textures and rendering budgets.
5. Explicit civil dates, local times, instants and zoned values with DST policies.
6. Expanded accessibility/reflow checks and a user-tested iPhone VoiceOver flow.

It also sharpens 3D illustrations, simplifies picker frames, evens column spacing
and adds discrete wheel/trackpad/touch selection.
[Scheduling guide](scheduling.md) · [Accessibility record](accessibility-testing.md).

## Queued components

- Daylight widget using the existing sunrise, sunset and solar-noon calculations.
- Lunar calendar with selectable phases.
- Synchronized world-clock strip for several cities.
- Celestial countdown toward an event's date and astronomical positions.

The native mobile app remains a separate project reusing `/astro` and `/clock`.
Further work includes physical GPU/battery measurements and additional device and
screen-reader combinations. Viewports and automated accessibility scans do not
constitute certification on those devices.
