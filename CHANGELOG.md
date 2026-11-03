# Changelog

## 0.2.0

- Add compact date, time and year displays and standalone planet/Moon components in both 3D and LCD styles, with configurable Intl formats and observer time zones.
- Expose named widget styling hooks, custom classes, CSS variables and part styles. Keep standalone body backgrounds overridable.
- Rework all widget sizes to reserve separate reading and artwork areas. Planet choice now belongs in component settings; cards render no selector. The defaultPlanet alias remains supported; onPlanetChange is deprecated for cards.
- Keep picker windows open during internal precision-tab clicks and transient browser focus changes. Use numeric LCD months consistently.
- Preserve the current month/day when selecting a year, clamp leap days and keep January year ticks stable as bodies move to the selected instant.
- Improve orbital selection with circular focus cues, separate mouse/touch handles, month arcs, keyboard and focused-wheel steps, and a date magnifier during day drags.
- Commit selected values immediately while animating only the visible bodies; interrupt animation on new input and respect reduced motion.
- Share the appearance toolbar across every documentation page and combine palette presets with custom colours. Put component options in separate settings sections.
- Replace the playground's legacy slider and controls with the current inline celestial picker.
- Expand consumer styling, cross-browser interaction, responsive layout and accessibility coverage.

## 0.1.0

- Package name: Skydial (`skydial`), with updated imports, examples, documentation and application branding.
- Thomas Budin as sole author/committer and Plain Matter Pte Ltd as copyright holder, with release-time attribution checks.
- Direct 3D Earth time control and orbital calendar/year picker.
- Earth, Moon, planetary-year and orrery cards in three website widget sizes.
- Jupiter, Saturn, Uranus and Neptune year scales, defaulting to Jupiter.
- Independent or synchronized clocks, controlled dates, native exact inputs,
  keyboard/touch interaction and reduced-motion selection.
- React components, Vue components, a Svelte action and a vanilla mount API.
- Separate framework-free astronomy, simulation and Three.js entries.
- WebGL-unavailable/context-loss fallback and visibility-aware rendering.
- Bundled relative texture assets with third-party attribution retained.
- Improved Earth time selection with minute precision, editable time values and touch-sized hour/minute step controls.
- Earth picker camera can follow the current place, local city, another city or device coordinates while preserving the selected time.
- Click-to-open date/time fields with mouse, trackpad and touch scroll columns, a coupled day/time option, native modal focus handling and synchronized 3D selection.
- Location retry, clearly marked approximate recovery and manual coordinate entry when device coordinates are unavailable.
- Redesigned website cards and a visible four-widget catalogue with inline size controls and examples.
- Compact form picker with selectable units and year-only precision, scroll/step variants, configurable increments, bounds, theme and density.
- Reusable CelestialScrollPicker and CelestialStepper exports; form-only React/CSS entries avoid loading the 3D renderer.
- Native form submission, required/range validation, clearing, controlled values and reset support.
- Live picker configurator whose compact date field opens the planetary picker by default; shared child scenes update native form values, with scroll/step alternatives.
- Printed orbital month/year labels select their own values; picker year scales follow the selected month/day.
- CelestialInput opens celestial visuals, synchronized scrolling columns and −/+ controls together; complete light/dark/system themes include orbital geometry and labels.
- Configurable interactive/decorative scenes and a separate orrery playground; CelestialInput is exposed through React, Vue, Svelte and vanilla integrations.
- Form popovers use Earth for calendar/time selection and one configured year planet; planet choices, repeated date/time headings and instructional copy stay outside the popup.
- Duotone LCD and textured 3D designs share light/dark/system themes, configurable colours, and a persistent preview header.
- Detailed original LCD Earth, Moon and planet drawings, including an inverse night hemisphere and city-centred Earth framing.
- Every enabled date/time unit has a matching control, including seconds tabs, year-only orbits and independently composable scroll/step elements.
- Date/time popups adapt to narrow and short screens without scrolling their default content; wheel selection bands stay fixed during celestial drags.
- Consistent LCD month typography, centred step icons and theme-aware hover, pressed and keyboard-focus states.
- Pending wheel momentum is cancelled when another date/time control changes the selection, preventing stale scroll events from undoing precise edits.
- Hover previews show the day or year before orbital selection, with snapping markers, date bounds, keyboard dismissal and public styling hooks.
