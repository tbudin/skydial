# Validation record

## Skydial 0.3.2 — 4 November 2026

The maintainer preferred a single-line range after reviewing 0.3.1's wrapping
layout. Complete LCD field artwork now scales to the available width and stays
on one line. The preferred font size remains 16px, with direct part styles and
CSS variables retained; the full screen-reader value is unchanged. Wider fields
restore the preferred size. Wheels and widget clocks keep their existing sizes.

Focused checks cover full date and seconds/AM-PM ranges, RTL, narrow embedded
forms, field/value/CSS font overrides and viewport changes in all three browser
engines. Thirty-nine focused browser cases passed; 24 geometry cases were
intentionally skipped in Firefox/WebKit because that matrix runs in Chromium.
Both website scheduling flows, all 128 package unit/SSR tests, types, exports,
builds and the twelve-page documentation/link checks passed. Manual inspection
of the actual 320px scheduling page showed both full dates on one line at about
15.16px visual height, with no clipping. No astronomy calculation changes were
needed.

## Skydial 0.3.1 — 4 November 2026

The original LCD date range clipped its last endpoint at 320px (18px digits,
14px overflow in the isolated consumer). Form readings now default to 16px,
inherit `field`/`value` font overrides and wrap at spaces. Date and time tokens
stay together when they fit; wheels and widget typography retain their defaults.
The complete original reading remains available to assistive technology.

The package check passes all 128 unit/SSR tests, builds, consumer types, exports,
texture checks and the renderer-free LCD budget. Twenty-four focused browser
tests pass across Chromium, Firefox and WebKit: date/seconds/RTL range readings
at 320, 390 and 768px, direct part styles and CSS variable overrides, endpoint
switching and returned focus, plus year-only edits retaining month/day and a
fixed dial centre in both designs.

The astronomical calculation has not changed. At 09:00 Europe/London on
9 November, Earth's J2000 longitude changes by about -0.257° from 2026 to 2027
and +0.747° from 2027 to leap year 2028. These are calculated orbital positions,
not layout movement. Year selection still clamps a leap day when necessary.

Thirteen LCD popup-layout cases pass, including phone, landscape and doubled
text. Both documentation scheduling flows pass, and the twelve-page build and
link checks pass. Manual inspection of the actual scheduling page at 320px
confirms both full dates are visible, with a 16px reading and no horizontal
overflow. A year edit and form reset also work in that narrow preview.
See the prior release's accessibility record for physical-device scope and limits.

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

GitHub's initial package, Chromium (including documentation) and Firefox jobs
passed. Linux WebKit passed 93 cases and skipped 183, with one test failing only
because its Intl date label omits the comma after the weekday. The assertion now
accepts either punctuation while still requiring the exact date and ordinal day.
The follow-up CI run verifies this platform-specific test correction.

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
