# Design and accessibility review

Reviewed on 2 November 2026. Scope: CelestialInput, form-only controls, scrolling
and stepping primitives, compact website widgets, the live builder and standalone
orbital selection. The native mobile application is a separate project.

## Designs

`variant="celestial"` retains textured 3D. `variant="lcd"` adds a Casio-inspired,
two-ink display: vector segmented digits, flat orbital diagrams, a geographic
pixel Earth, schematic planetary bands and the computed Moon phase. Both use the
same clock, astronomical positions, calendar scales and form selection logic.
LCD works with WebGL disabled and fetches no surface textures. The visual package
entry still has its documented renderer peer dependencies.

Both styles offer light, dark and system appearance. LCD inks can be changed with
`--lcd-paper` and `--lcd-ink`; the live builder provides colour controls and exports
all settings. Original 3D remains the default.

## Screens and behaviour

| Check | Coverage |
| --- | --- |
| Input reflow | 320×740, 390×844, 768×1024, 1440×1000, 844×390 |
| Input precision | Date, time, combined and year-only at every size/style/theme; all seven presets in the builder |
| Presentations | Popover and inline; both, wheel-only and editable steppers; a narrow host inside a wide viewport |
| Widgets | Earth, Moon, year and orrery; all three sizes, both designs/themes at widths 320, 768 and 1440 |
| Keyboard | Opening focus, arrow-key selection, orbital and Earth edits, Tab exit, Done/Escape return, actual native submission |
| Preferences | System theme changes, reduced motion and forced-colour emulation |
| Fallback | LCD without WebGL or texture fetches; existing 3D fallback and location suites |

Popovers stay on screen and avoid the input. Short screens scroll the content
while keeping the footer available. Narrow screens show precise controls before
the celestial view, and initial focus scrolls into view. Inline composition also
responds to the host container width. Intentionally cropped widget illustrations
are allowed; text and selectors must fit inside each card.

## Issues corrected

- Orbital month/year labels previously measured about 22–29×10px. Their clickable
  boxes now have minimum dimensions of 24×24px and retain collision avoidance.
- Dark input labels could disappear against a light host. External labels,
  descriptions and validation messages now follow the host's text colour; the
  input and popup retain their own theme.
- Borders and demonstration copy had weak contrast. Default control borders and
  supporting text have been strengthened, and the builder's textareas now follow
  the page theme.
- Hidden accessible copies of LCD digits could extend the parent's scrollable
  area by thousands of pixels. Hidden text now has a fixed origin; tests bound
  the content scroll height as well as checking horizontal overflow.
- Initial focus now prefers exact controls and scrolls them into view. Tab can
  leave the nonmodal popup, closing it without taking focus from the next field.
- Custom wheel and orbital/Earth controls retain visible focus across browser
  keyboard heuristics, including Firefox forced-colour mode.
- Code examples with scrolling can be focused and scrolled from the keyboard.
- Reduced-motion styles remove decorative transitions. Forced-colour styles
  preserve borders, selected rows and focus outlines. Coarse pointers get larger
  step/action targets.

## Contrast and semantics

Default foreground/background ratios, calculated from the CSS palette:

| Palette | Contrast |
| --- | ---: |
| Celestial light text | 13.28:1 |
| Celestial dark text | 16.24:1 |
| LCD light ink/screen | 8.16:1 |
| LCD dark ink/screen | 10.69:1 |
| Celestial light control border/surface | 3.66:1 |
| Celestial dark control border/surface | 4.88:1 |

The normal-text baseline is 4.5:1 in [WCAG 2.2 contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
Targets are checked against the 24px baseline in [WCAG target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
SVG glyphs inherit the tested ink pair and expose a single text alternative.
Wheels have labelled listbox/option semantics and an active descendant; editable
units are labelled spinbuttons. Orbital and Earth sliders expose values and
keyboard edits, with exact controls offering an alternative to dragging. The
trigger's description includes the current value, state and keyboard instructions.
The popup is nonmodal: it deliberately allows focus to leave for the host form.

Automated scans use axe-core's WCAG A/AA rule tags through 2.2. They cover the
picker, builder, widgets and standalone orbital controls. Manual visual review
uses rendered screenshots, including the phone layout; keyboard checks exercise
real changes and submission rather than only checking attributes.

## Verification results

- `npm run check`: 94 unit/SSR checks, lint, app/library builds, consumer/site
  types and package import/asset checks passed.
- The final design/form/input/composable subset passed 67 browser tests. Another
  44 matrix cases are deliberately skipped in Firefox/WebKit because the screen
  matrix runs once in Chromium; interaction, theme, accessibility scans and
  form/keyboard flows run in all three engines.
- All eight live documentation tests passed, including widget size/palette audits,
  builder customization, the seven precision presets and standalone orbital input.
- The broader earlier run passed 124 cases and exposed four focus-check failures.
  The focus fixes and browser-appropriate Tab expectations passed in the final
  subset. The entire broader suite was not repeated after those final fixes.
- The package-site build and link checks passed. Manual phone inspection confirmed
  the LCD content scroll height returned to about 950px instead of about 15,000px.

## Limits

This is a development review, not a WCAG conformance certificate. Automated scans
and browser accessibility semantics do not replace VoiceOver, NVDA or physical
phone testing; those device/assistive-technology combinations were not certified.
Viewport reflow was checked; native browser zoom and text-only zoom were not
certified. Custom inks, fonts and layouts can change contrast, target spacing or
reflow and should be checked in the host application. The original telemetry
reference app is not restyled into the LCD design.

Reproduce with `npm run check`, `npm run check:docs`, `npm run test:browser` and
`npm run test:docs`. Test sources: `tests/browser/design.e2e.ts` and
`tests/docs/design.e2e.ts`, alongside the existing form, location, package,
composable and picker browser suites.

## Local interaction follow-up — 3 November 2026

The orrery review separates committed form values from illustration
motion. Year marks now use fixed local 1 January boundaries; choosing a year
preserves the month/day (with leap-day clamping), and refining the day updates
all visible bodies without rotating the year scale. Circular focus and touch
grips accompany keyboard and focused wheel adjustments. A nearby-date magnifier
appears only during a day drag. Fine pointers retain access to neighbouring ticks.

Internal pointer gestures and transient document focus no longer dismiss the
nonmodal input popover. Intentional outside focus, outside clicks, Done and
Escape retain their dismissal behaviour. LCD month values use `01`–`12` in the
segmented selection, orbital labels, date badge, previews and magnifier.

Validation passed: 109 unit/SSR checks, package/consumer/demo builds, package
exports and the 11-page documentation check. The configuration sweep exercises
all 63 nonempty unit combinations in both designs, varying wheel/stepper/both,
inline/popover, themes, sizes, placement and desktop/phone/landscape viewports.
It verifies precision tabs, exact edits, Clear, Now and Done. Focus transitions,
shared astronomical time, year/day selection, form flows and existing standalone
windows also pass across Chromium, Firefox and WebKit. The documentation suites
cover 40 default no-scroll combinations, both styles' month/button appearance,
unit composition, precision drags, city illumination and hover previews.

This review was validated locally before the 0.2.0 release. The
assistive-technology and physical-device limits above still apply.

### Widget and documentation follow-up — 3 November 2026

- Replaced fixed, overlapping widget artwork with a grid that reserves separate
  reading and scene areas in small, medium and large cards. Verified all four
  widget kinds across both styles, light/dark themes and desktop, tablet and
  320px screens, including actual text overflow and reading/artwork intersections.
- Removed rendered planet selectors. Planet choice is a component prop, exposed
  in the documentation's separate Component settings section. Added named
  `WIDGET_PARTS` styles/classes for cards and compact displays.
- Added `CelestialDisplay`, date/time convenience exports and `CelestialBody`.
  Formats use Intl options, observer time zones and semantic time elements;
  body artwork has readable names. Tested all nine bodies, numeric LCD readings,
  seconds, year-only/date-only/time-only presets, custom formats and narrow layouts.
- Every documentation route, including the generated changelog, now shares the
  appearance toolbar. Palette presets and custom colour fields occupy one Colours
  panel. Checked its keyboard targets and accessibility at 1440px, 768px and 320px;
  the narrow layout hides the redundant palette caption to preserve target width.
- The playground and home preview now use the current CelestialInput component.
  The playground presents its inline picker with settings outside the component,
  without the legacy range slider. Removed a duplicate named region found during
  verification.
- Validation: npm run check passed (114 unit/SSR checks), consumer/site types and
  documentation build checks passed. All 27 documentation browser scenarios are
  covered by the final runs: 23 passed in the full sweep, the four corrected cases
  passed in the follow-up, and the 40-layout popup sweep was repeated successfully.
  Existing physical-device and manual assistive-technology limitations still apply.

The validation above was performed on the local preview before release.
Attribution and collaborator settings were unchanged.

### Release styling checks — 0.2.0

Consumer CSS, variables, custom classes and named part styles pass in both
variants across Chromium, Firefox and WebKit (six browser cases), without
consumer !important declarations. Standalone body backgrounds are overridable;
widget palette defaults use low-specificity variables. Package checks pass with
114 unit/SSR cases, package/type validation and clean archive installation.
Production dependency audit reports no vulnerabilities.
