# Package status

## 0.1.0 release candidate

- Compact form fields with selectable date/time units, year-only precision,
  scroll or editable step controls, configurable increments, bounds and themes.
- Independent CelestialScrollPicker and CelestialStepper elements; a form-only
  React entry and stylesheet without the Three.js renderer.
- Nullable/controlled values, native named submission, required/range validation,
  clear/reset behavior and a live UI configurator with real form examples.
- Direct month/year label selection and date-calibrated picker year scales.

- Real Sun, Moon and planetary sphere meshes, Saturn rings/shadow, IAU spin,
  computed illumination, lunar orientation and actual ephemerides.
- Direct Earth time/day manipulation, orbital day/year selection, animated and
  reduced-motion transitions, keyboard/exact input and visible year-planet
  selection (Jupiter by default).
- Small, medium and large Earth, Moon, year and orrery website cards.
- Independent and explicitly synchronized clocks; controlled dates and planets.
- React components, Vue components, a Svelte action and a vanilla DOM mount API.
  Visual adapters share the React/Three.js renderer; astronomy and clock remain
  framework-free. The Three.js entry also supports direct non-React rendering.
- Readable fallback for missing/lost WebGL2 and demand/visibility-aware drawing.
- Relative bundled textures, retained attribution and MIT code licensing.
- Package/type validation, clean archive installs and automated browser coverage
  in Chromium, Firefox and WebKit, with touch in the supported emulators.
- Eleven-page package-site documentation with real live playgrounds, code examples,
  framework guides, metadata, markdown twins, search, sitemap and changelog.
- CI, manual npm staging and GitHub Pages deployment workflows.

## Final publication steps

The npm name is `skydial`, and its repository is `tbudin/skydial`. Commit the
reviewed release and publish from an authenticated account. See [releasing](releasing.md). Browser
and CI checks validate the package before publication. The
[live documentation](https://tbudin.github.io/skydial/) is deployed; npm staging
and approval are separate release steps.

## After the first release

- Physical mobile-device verification and GPU measurements.
- Additional visual styles and native renderer adapters where worthwhile.
- The native mobile app, reusing the astronomy and simulation modules.

Display sizes/distances are exaggerated, and the top-down orrery flattens orbital
latitude. Texture licenses remain separate from the code license. Thomas Budin
is the package author and configured local Git author/committer. With explicit
approval, the five published commits were corrected to his personal GitHub email;
GitHub identifies him as both author and committer. No additional contributor
or AI/agent credit appears in the corrected main history. The code licence and website
ownership credit name Plain Matter Pte Ltd. Required third-party notices remain with
the bundled textures and dependency information.
