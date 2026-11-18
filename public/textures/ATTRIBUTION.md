# Texture attribution

Except for the NASA and mission products identified below, planetary, solar,
and legacy lunar textures in this folder are derived from the
**Solar System Scope Texture Library** (https://www.solarsystemscope.com/textures),
Copyright (c) 2010-2017 Solar System Scope, licensed under
[Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).

Source copies were taken from the Qt 3D repository
(`tests/manual/planets-qml/images/solarsystemscope`), which redistributes the
same library under CC BY 4.0. See `LICENSE-solarsystemscope.txt`.

The detailed 2048 x 1024 Mercury, Venus atmosphere, Mars, Jupiter, Saturn,
Uranus and Neptune maps were downloaded directly from the
[Solar System Scope Texture Library](https://www.solarsystemscope.com/textures/)
on 4 November 2026, under the same CC BY 4.0 license.

`earth_night_2k.jpg` is NASA's "Earth at night" city-lights composite (NASA Earth
Observatory, public domain), taken from the three.js examples
(`examples/textures/planets/earth_lights_2048.png`) and resized to 1638 x 819.

## Changes made for this project

- `*_1k.jpg`: resized to 1024 x 512 (Lanczos) for the orrery.
- `earth_2k.jpg`, `earth_rough_2k.jpg`: original 1638 x 819 maps, re-encoded.
- The other `*_2k.jpg` maps (except Earth night and Moon): 2048 x 1024 originals,
  JPEG re-encoded at quality 85 for detailed body illustrations.
- `earth_rough_2k.jpg`: the specular map inverted and rescaled into a roughness map (glossy oceans).
- `moon_normal_1k.jpg`: the Moon normal map resized to 1024 x 512.
- `saturn_ring.png`: 512 px radial strip sampled from the Qt ring disc
  (averaged over 360 angles), inner edge to outer edge.

## Shared lunar map family

The Moon overview and native 4K/8K tiers are Lanczos derivatives of the same
NASA CGI Moon Kit 2019 16K LROC color master. `moon_2k.jpg` is 2048 × 1024,
JPEG quality 92 with 4:4:4 sampling, and is byte-identical in the npm package
and native app. The separate companion bundle uses a 512 × 256 derivative.
Credit: NASA’s Scientific Visualization Studio; Ernie Wright (USRA); the
LRO/LROC and LRO/LOLA instrument teams. Source:
https://svs.gsfc.nasa.gov/4720/. Usage guidelines:
https://www.nasa.gov/nasa-brand-center/images-and-media/.
NASA describes the color product as aesthetic: small high-latitude dropouts
were inpainted and polar coverage comes from lower-resolution LOLA albedo.
Legacy `moon_1k.jpg` and `moon_normal_1k.jpg` remain Solar System Scope
assets under CC BY 4.0; other Solar System Scope notices continue to apply.
