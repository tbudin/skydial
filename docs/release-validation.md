# Release candidate validation

Validated locally on 2 November 2026 using Node 22.20.0.

- Lint, 94 unit/SSR tests, reference application and library builds passed.
- Strict NodeNext consumer types cover React, Vue, Svelte, vanilla and CSS imports.
- publint and packed ESM type-resolution checks passed.
- Clean archive installs passed, including core without visual peers, form-only React without Three.js, every adapter,
  server rendering and bundled texture assets.
- The package-site documentation build and eleven-page static checks passed.
- Four live documentation browser tests passed, including nested asset paths, all widget sizes, picker windows, the combined celestial/scroller/stepper input flow, complete light/dark appearance, separate orrery playground and mobile layout.
- Full dependency audit reported zero vulnerabilities.
- Browser coverage includes Chromium, Firefox and WebKit, missing WebGL/context loss,
  keyboard, orbit selection, Earth dragging, reactive adapters and touch. Firefox
  mobile emulation is unsupported and explicitly skipped.

The Earth picker includes a slower minute-drag mode, whole-minute snapping,
editable hour/minute values and touch-sized step controls. City view keeps the
chosen longitude centered as time advances, with a separate camera-city choice,
time-zone-based local fallback and device location only after an explicit click.
Unavailable/timed-out coordinates retry with a fresh high-accuracy request; failure
provides a specific message, a clearly marked approximate city and manual
coordinate entry. A real device-location request in the Codex preview timed out
after both attempts. The fallback was verified there; successful precise location
in that host is not claimed.
Numerical camera tests check longitude alignment for Singapore, New York and Sydney
as time advances through hours, days and seasons. Earth's geographic frame now
uses Greenwich apparent sidereal time and the true equator of date.

The complete browser matrix passed 76 cases in Chromium, Firefox and WebKit, with
two unsupported Firefox mobile-touch cases explicitly skipped. Coverage includes
exact edits, midnight rollover, synchronized widgets, no WebGL/context loss,
controlled/read-only settings, location denial, stale location responses and
320-pixel layout. The picker-window coverage includes native mouse/trackpad
scrolling, coupled day/hour/minute selection, leap-year and month-end clamping,
controlled values, camera-city persistence, focus containment/return, read-only
and disabled fields, supported year limits and complete orbital targets on a
720-pixel-high laptop display. The documentation catalogue tests cover visible
Earth, Moon, year and solar-system examples, every size and synchronized preview
settings; the picker page exercises all three field types and its inline option.

Compact form fields now provide 32/40/44px sizes, native anchored popovers,
selectable units (including year-only and seconds), scroll or editable step
controls, per-unit increments, bounds, themes and CSS-variable customization.
The live configurator exercises these settings and actual named form submission.
Its date field opens the planetary calendar by default. The scene inherits the
field clock; orbital edits update the field and submitted value. The date/time
preset adds the rotating Earth control. Desktop and mobile checks keep Done
visible while the scene can scroll inside a constrained popover.
The form-only entry and stylesheet work without loading the 3D renderer.

The final form subset was rerun in all three engines after the reset-cancellation
fix: all nine cases passed, including required validation, clearing, native and
cancelled reset, controlled host updates, read-only/disabled values, precise
scrolling, bounds, outside-click focus and narrow popovers. The package checks
were rerun, and documentation rebuilt after that fix.

Printed orbital labels now select their explicit month/year instead of passing
through to geometry under a moved label. Picker year marks follow midnight on
the selected month/day, while selection preserves local time. This avoids
January-reference mismatch and repeated scale rebuilding during minute edits.
Calendar stepping is tested across month ends, leap years and DST; clock steps
pass through DST gaps. Animation is exercised separately from the exact-target
case with six synchronized scenes to avoid software-GPU timing artifacts.

The npm archive is approximately 1.9 MB compressed, with external image assets.
No physical phone certification, remote CI execution, registry publication or
public documentation deployment is claimed. The npm name and account setup remain
release decisions; see [name check](npm-names.md) and [release steps](releasing.md).

The latest CelestialInput change passed a 24-case subset in Chromium, Firefox and
WebKit (composable orbital interaction, existing form controls and designed inputs).
This subset verifies orbital/scroll/step synchronization, native submission,
clock rollover, system theme changes, read-only fields, year-only precision,
decorative scenes and narrow popovers. The 94 unit/SSR tests, builds, consumer
and site types, package checks, packed type resolution and clean-install checks
also passed. The earlier 76-case matrix is the broader baseline, not a claim that
all those cases were rerun after this design change.

Light, dark and mobile previews were visually inspected. CelestialInput includes
scrollers and exact steps alongside the celestial view; it is exported through
React, Vue, Svelte and the vanilla mount API. Standalone widgets remain available,
and the documentation now includes an independent Orrery playground page.

The orbital input correction passed 27 composable/form/input browser cases
across Chromium, Firefox and WebKit, plus all five live documentation tests.
Dates show Earth and one configured year planet around the Sun; combined inputs
also show Earth rotation for time. The checks cover synchronized orbital edits,
custom part styles and state callbacks, custom scroll geometry, native form
values and popup placement without covering the input. The 94 unit/SSR checks,
app/library builds, consumer/site types and package import checks also passed.
The documentation build and link checks passed. Desktop light/dark and narrow
previews were inspected; short viewports scroll content inside the anchored popup.


The duotone LCD design and accessibility pass completed with 94 unit/SSR checks,
67 final browser checks across three engines (44 intentional matrix duplicates
skipped) and all eight documentation checks. An earlier broader run exposed focus
issues that were corrected and retested in that final subset. See
[design and accessibility review](design-accessibility.md) for the scope, contrast
measurements, screen matrix and device/assistive-technology limits.

### Colour configuration — 3 November 2026

Inputs, standalone scroll/step controls and compact widgets now share a typed
`colors` option. The input builder and widget gallery expose swatches, CSS colour
codes, four palettes and theme-default reset; their generated snippets include
custom colours. LCD keeps two inks. Celestial colours update DOM controls and the
orbital canvas palette together. System-dark settings labels retain contrast, and
forced-colour mode takes priority over custom LCD colours.

Validation: `npm run check` passed (94 tests, both builds, consumer/site types and
package checks). The site build and its 11-page link check passed. Six design and
colour scenarios passed, plus 15 keyboard, contrast and system-theme checks across
Chromium, Firefox and WebKit. The three colour scenarios were rerun after the
final high-contrast adjustment and passed, including a custom-palette dark-site
audit, form submission, theme restoration and 320px widget layout.

### Detailed LCD bodies — 3 November 2026

Replaced placeholder planet bands and lunar dots with original projected,
body-specific surfaces. Earth now includes finer coastlines, islands, lakes and
regular-grid stippling. The Moon has maria, crater rims and rays clipped to its
computed illuminated hemisphere. Planet drawings include distinct cloud belts,
storm motifs, polar markings and front/back ring layers. Dial-size glyphs are
also distinct. The two configured colours remain the only inks; artwork is SVG
without texture requests. Large LCD widget spacing keeps drawings clear of text.

`npm run check` passed with 106 tests, application/library builds, public consumer
types and package checks. The demo build and 11-page link check passed. All 13
demo scenarios passed, including colour controls, three widget sizes, light/dark
appearances, narrow layouts and lunar illumination area at four dates. Six LCD
keyboard/no-WebGL checks passed across Chromium, Firefox and WebKit. The
nine-body review is saved as `screenshots/lcd-all-bodies-review.png`.

### Shared preview header — 3 November 2026

The input builder and widget gallery now share a sticky header with 3D/LCD,
light/dark/system appearance, palette presets and a custom-colour panel. Each
design remembers its palette across navigation and reloads. Date selection and
configuration survive appearance changes; an open picker is restored after
pointer-driven comparisons and after closing the colour panel. The header stays
visible on phones. A CSS viewport inset lets popup placement leave sticky headers
clear without changing the default package placement.

`npm run check` passed with 106 unit/SSR tests, application/library builds,
consumer/site types and package checks. The demo build and 11-page link check
passed. All 15 demo scenarios passed; the five header/colour scenarios passed
again after the final background-preview fix. Header accessibility and bounds
were checked at 1440, 768 and 320px in light and dark appearances. Six targeted
keyboard scenarios passed across Chromium, Firefox and WebKit. The Codex preview
was also inspected with an open picker, live style switching and colour-panel
return. Review captures are saved as `screenshots/preview-header-desktop.png`,
`screenshots/preview-header-mobile.png` and `screenshots/preview-header-review.png`.

### Popup fitting and city-facing time — 3 November 2026

Combined inputs place the orrery and Earth beside each other with all selected
units below, using a wider arrangement in short landscape viewports. Popups use
the full available viewport when neither side of the field can fit the content.
Scenes adapt to that space; oversized consumer styles retain a scroll fallback.
Removed SVG baseline overflow and reserved room for the orbital range controls.
Keyboard focus marks the selected wheel row instead of outlining the entire
column. Time-control Earth is larger within its viewport. LCD night is a computed
inverse-colour hemisphere with geographic detail, using only the two configured
colours. City-following camera mode is now the default, with rotation still an
explicit option.

Package checks passed with 106 unit/SSR cases. The library, app, consumer and demo
builds and the 11-page link check passed. The browser design/input suites passed
52 cases across Chromium, Firefox and WebKit (44 duplicate viewport cases skipped).
A broader demo run passed 16 scenarios before the remaining landscape spacing
was corrected. The four final fit, city/illumination, header and accessibility
scenarios then passed, including 40 no-scroll combinations: date, time, combined
and seconds, both styles, at 1280×720, 1440×1000, 390×844, 320×740 and 844×390.
Codex preview captures include `screenshots/picker-fit-combined.png`,
`screenshots/picker-fit-mobile.png`, `screenshots/picker-earth-3d-review.png` and
`screenshots/picker-lcd-night-review.png`.

### Unit composition and stationary selection — 3 November 2026

LCD scroll wheels now paint their inverse reading in a fixed centre band.
External celestial edits synchronise the underlying list before paint; a visibility
observer also aligns the initial list when its native popup opens. Precision tabs
follow the enabled time units, including seconds, and both explicit `units` and
the `precision` shorthand use the same rules. Seconds drags span one minute per
globe width and respect configured steps. Composed inputs preserve hidden seconds.

Orbital pickers omit disabled calendar/year scales and their bodies, hands,
badges, labels and navigation. Year-only shows the Sun and chosen year planet at
a closer framing. Month-only omits daily ticks; day-only uses the current month's
day ticks. Combined calendar/time inputs add only the enabled Earth precision tabs.
The independent Orrery playground retains its full set of controls.

`npm run check` passed with 107 unit/SSR checks, builds, public types and package
validation. Demo and consumer builds and the 11-page link check passed. Nine final
demo scenarios passed, including live frame sampling of drags in both styles,
initial wheel alignment, ten unit combinations per style and the 40 no-scroll
screen/style/preset combinations. Twenty-one final browser scenarios passed across
Chromium, Firefox and WebKit, covering seconds drags, year-only selection, keyboard
access, system themes, forced colours and contrast. Earlier standalone and form
compatibility scenarios also passed. The Codex year-only view is saved as
`screenshots/year-only-review.png`.

### Orbit hover previews — 3 November 2026

Selectable calendar and year-planet rings now preview their exact selection tick
without changing the field. The marker and label follow enabled calendar units,
civil time and date bounds in both designs. The label stays visible when hovered;
Escape dismisses it before closing the picker. Read-only and decorative scenes
omit previews. `orbitPreview` and `orbitPreviewMarker` are public styling parts,
including the relevant unit in their style callbacks. Hover highlights use the
configured day/year colours and LCD inks.

`npm run check` passed with 107 unit/SSR tests, builds, public types and package
validation. The demo build and 11-page link check passed. Eighteen interaction
checks passed across Chromium, Firefox and WebKit, covering preview/selection
agreement, unchanged values on hover, hoverable labels, Escape, range bounds,
read-only fields, narrow year-only inputs, contrast and existing orbital edits.
Two live configurator checks passed with year-only, month-only and day-only
previews, light/dark themes and custom label styling in both designs. The final
configured year previews are saved as `screenshots/orbit-hover-lcd.png` and
`screenshots/orbit-hover-celestial.png`.

### Release-readiness audit — 3 November 2026

The current candidate passes strict package lint, packed ESM type resolution and
clean archive installs (astronomy without framework peers, form controls without
Three.js, all visual integrations, SSR and bundled textures). The archive is
approximately 1.97 MB compressed. The production dependency audit reports zero
known vulnerabilities. The latest implementation passed `npm run check` with
107 unit/SSR tests, builds, public types and package validation, plus the scoped
browser/demo checks above. The complete 192-browser-case and 24-demo-case release
suite has not been rerun together on a final committed candidate. GitHub reports
no Actions runs yet.

The package remains private at 0.1.0 and the release work is uncommitted. The
provisional `celestial-clock` npm lookup returns 404; this does not reserve or
guarantee acceptance of the name. Local npm authentication returns 401. Trusted
publishing configuration is not verified. GitHub Pages configuration returns
404, so the local demo is not a public package-site deployment.

GitHub reports `tbudin` as the only repository collaborator and no pending
invitations. The sole listed contributor is `plm-infra`, linked to all five
published commits through `infra@plainmatter.com`; the current history contains
no AI co-author or generated/session trailers. Effective local author and
committer identities both use Thomas Budin's personal GitHub noreply address.
The package author is Thomas Budin. Historical attribution remains unresolved;
rewriting published commits requires explicit confirmation. The MIT licence
still names Plain Matter Pte Ltd as copyright holder, pending the owner's choice
for this personal release. No commit, history rewrite, remote mutation, registry
publication or documentation deployment was performed during this audit.

### Skydial naming and approved personal attribution — 3 November 2026

The maintainer selected `skydial` after a direct public-registry check. The
unscoped name and `@tbudin/skydial` returned 404; searches for `skydial` and
`@skydial/` returned zero public results. This does not inspect private packages
or reserve a registry name. Metadata, package self-imports, examples, public type
consumers, styles, snippets, application branding and package-site npm links now
use Skydial. The repository and documentation base path remain celestial-clock.

After explicit approval to rewrite and force-push the five published commits,
the corrected main head is `c5af8985194d1fa147df484ae219e7a42dbcde03`. GitHub's
commit API verifies `tbudin` as both author and committer on all five commits,
using Thomas Budin's personal GitHub noreply address. Every original source tree,
author date and committer date was preserved. An exact expected-head lease
protected the push; local main and its attribution-cleanup alias were aligned
without altering the existing index or development changes. The contributor list
still returned cached infrastructure-account data after the rewrite; GitHub
documents approximately 24 hours for contributor-display refreshes.

The package author, code copyright and website ownership/creator credit now name
Thomas Budin. Required third-party texture and dependency licence notices remain
separate. The publishing guard checks full Git history, author/committer identity,
prohibited attribution/session trailers, package contributor metadata, code
copyright and website ownership. The release workflow fetches full history, and
direct npm publishing invokes the guard too. The guard now passes attribution
checks and stops at the private-package restriction.

Validation after renaming: `npm run check` passed with 107 unit/SSR tests, both
builds, consumer/site types and package exports. Strict package lint, packed ESM
type resolution, consumer/demo builds and all 11 generated-page link checks pass.
Clean Skydial archive installs pass for the framework-free core, form-only entry,
all visual integrations, SSR and texture assets. The production audit reports
zero known vulnerabilities. Thirty-three scoped browser checks passed across
Chromium, Firefox and WebKit, including React inputs, Vue/Svelte/vanilla mounts,
orbital previews and missing/lost WebGL. Four live-site header/hover scenarios
passed. The complete release matrix was not rerun as a single suite. The branded
preview and personal credit were visually verified in
`screenshots/skydial-personal-credit-review.png`.

Skydial remains private at 0.1.0 and the development changes are uncommitted.
No npm staging/publication or public website deployment was performed.

### Plain Matter copyright and Skydial repository — 3 November 2026

The maintainer confirmed Plain Matter Pte Ltd as the code copyright holder and
website owner. The MIT licence, website footer and release guard now distinguish
that ownership from Thomas Budin's sole author/committer identity. Third-party
texture notices remain unchanged.

The public repository is https://github.com/tbudin/skydial. Package repository,
issue, documentation and local documentation-preview paths now use skydial. The
original celestial-clock repository is retained as a separate Git remote. Version
0.1.0 is configured for public npm publication. Publication requires authenticated
maintainer access and is not implied by this source-preparation record.

Remote checks found Plain Matter Pte Ltd in package-trends' repository and
published 0.2.1 MIT licence. Papertooth's repository and published 0.5.2 MIT licence
still name Thomas Budin, while its website configuration names Plain Matter Pte Ltd.
No changes to those two repositories were made as part of this check.
