# Validation record

## Skydial 0.3.0 — 4 November 2026

Release candidate based on the published 0.2.0 package, validated locally with
Node 23.2.0. This release includes scheduling and explicit date values, the
renderer-free LCD entry, sharper 3D body illustrations, simpler picker frames,
even column spacing and discrete scrolling.

### Package checks

- Lint, 128 unit/SSR tests, reference application and library builds pass.
- Consumer/site types, package exports and bundled texture checks pass.
- Strict package lint, packed ESM type resolution and clean archive installs pass.
  Installs cover the framework-free core, form-only controls, LCD without
  Three.js/Fiber/Drei, all framework adapters and server rendering.
- The LCD build contains no renderer imports or bitmap assets and stays below
  its 65 kB gzip JavaScript budget (excluding React and Astronomy Engine).
- The twelve-page documentation build and local link checks pass.
- The production dependency audit reports no known vulnerabilities.

### Interaction and design

Focused checks confirm equal gaps and column widths at desktop and 320px widths
for dates, times, seconds, combined values, year-only, year/month, month/day and
coupled day/time. Wheel-only, stepper, inline and popover forms are covered.
Mouse wheels, small trackpad deltas, pointer drags and native touch swipes select
complete rows, with no fractional movement behind the fixed selection band.
External changes reset partial gestures; form-only and standalone wheels share
this behavior. A native Chromium touch sequence covers both visual styles.

The broad library browser run executed 714 scenarios: 408 passed and 304 were
intentionally skipped for browser-specific coverage. Two Chromium aggregate
layout tests exhausted their shared time limits. Splitting those into 36
independent cases retained all assertions; all 36 passed. All Firefox and WebKit
cases in the broad run passed.

After the final scrolling changes, 19 focused interaction tests passed across
Chromium, Firefox and WebKit; the two non-Chromium native-touch cases were
intentionally skipped. This includes same-task event bursts, direction reversals,
external edits, selection after clearing, native scrolling, focus restoration,
form-only controls and standalone controls. Eighteen additional seven-control
phone cases (both styles, wheel/stepper/combined controls and all three engines)
passed, checking aligned bands, readable year digits and no internal scrolling.

The initial documentation run passed 27 of 29 tests. The large widget aggregate
exceeded its 180-second budget; a cross-style row-alignment poll also failed.
Against the rebuilt final bundle, all six independent widget groups passed:
36 style/theme/size/viewport configurations, 144 card checks and 36 accessibility
audits, including 320px. Both style-specific precision tests passed their ten
configurations each. The original twenty-configuration cross-style sequence also
passed when repeated with a 240-second overall budget (2.5 minutes of test time).
No assertion was removed. These checks also cover the live builder, shared
appearance controls, synchronized orbital values, Earth dragging, custom colours
and form submission. The complete release command was not rerun as one job after
splitting the aggregate tests; affected groups and final source changes were
checked separately.

### Manual checks and limits

Both designs were inspected in light and dark mode. The updated LCD date field
has three equal-width columns with equal 8px gaps. The 3D widget bodies use
consistent illustrative framing, with extra space for Saturn's complete rings.
Detailed planet maps load per body and share cached requests; low-quality mode
retains smaller maps. Interactive orreries retain their existing scales/maps.

Thomas reported successful iPhone VoiceOver checks for opening Booking,
switching Start/End, changing a date, activating Done and returning focus to
Booking in both styles. Device/iOS/Safari versions were not recorded; this is a
user report, not independent certification. See the
[accessibility record](accessibility-testing.md). The new swipe behavior still
benefits from the maintainer's post-release physical-device testing.

No NVDA, TalkBack, physical GPU/battery measurement or certification is claimed.
A precise device-location request previously timed out inside the embedded desktop preview;
the recovery UI was verified there, but successful location acquisition in that
host is not claimed.

### Ownership and release

Thomas Budin <31727129+tbudin@users.noreply.github.com> is the only repository
author and committer. GitHub lists only `tbudin` as collaborator and contributor,
with no pending invitations. Plain Matter Pte Ltd is the code copyright holder
and website owner. Required third-party texture and dependency notices remain.
The release guard checks all published history, commit trailers, package author
metadata, the licence and website ownership, and requires a clean checkout.

Publication is followed by verification of the exact registry version, latest
tag and archive metadata, then the matching GitHub release and documentation
deployment. These external receipts belong to the release record on GitHub.
