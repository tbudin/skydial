import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'))
const work = mkdtempSync(join(tmpdir(), 'celestial-clean-install-'))
const npm = (args, cwd = work) => execFileSync('npm', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
try {
  const result = JSON.parse(npm(['pack', '--json', '--ignore-scripts', '--pack-destination', work], root))[0]
  const archive = join(work, result.filename)
  writeFileSync(join(work, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
  npm(['install', '--ignore-scripts', '--omit=optional', '--no-audit', '--no-fund', archive])
  for (const peer of Object.keys(manifest.peerDependencies)) assert(!existsSync(join(work, 'node_modules', peer)), `Unexpected peer: ${peer}`)
  execFileSync(process.execPath, ['--input-type=module', '-e', `
    import { SimClock } from '${manifest.name}/clock';
    import { civilDateValue } from '${manifest.name}/astro';
    if (new SimClock(0).now() !== 0 || civilDateValue(0, 'UTC') !== '1970-01-01') throw Error('Core install failed');
  `], { cwd: work, stdio: 'pipe' })
  const peers = Object.keys(manifest.peerDependencies).map((name) => `${name}@${lock.packages[`node_modules/${name}`].version}`)
  npm(['install', '--ignore-scripts', '--omit=optional', '--no-audit', '--no-fund', `react@${lock.packages['node_modules/react'].version}`, `react-dom@${lock.packages['node_modules/react-dom'].version}`])
  execFileSync(process.execPath, ['--input-type=module', '-e', `
    import { createElement } from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import { CelestialPicker } from '${manifest.name}/pickers';
    const html = renderToStaticMarkup(createElement(CelestialPicker, { precision: 'year', defaultValue: Date.UTC(2026, 0, 1), name: 'year' }));
    if (!html.includes('2026') || !html.includes('name="year"')) throw Error('Form-only install failed');
  `], { cwd: work, stdio: 'pipe' })
  assert(!existsSync(join(work, 'node_modules', 'three')), 'Form-only entry unexpectedly installed Three.js')
  npm(['install', '--ignore-scripts', '--omit=optional', '--no-audit', '--no-fund', ...peers])
  execFileSync(process.execPath, ['--input-type=module', '-e', `
    import { createElement } from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import { CelestialInput, CelestialDateTimePicker } from '${manifest.name}/react';
    import { CelestialInput as VueInput, CelestialWidget as VueWidget } from '${manifest.name}/vue';
    import { celestial } from '${manifest.name}/svelte';
    import { mountCelestial } from '${manifest.name}/dom';
    import { createSunObject, CELESTIAL_TEXTURE_URLS } from '${manifest.name}/three';
    import { existsSync } from 'node:fs';
    const html = renderToStaticMarkup(createElement(CelestialDateTimePicker, { date: 0, preview: false }));
    if (!html.includes('1970-01-01') || !VueWidget || typeof celestial !== 'function' || typeof mountCelestial !== 'function') throw Error('Visual install failed');
    const input = renderToStaticMarkup(createElement(CelestialInput, { defaultValue: 0, name: 'appointment', theme: 'auto' }));
    if (!input.includes('name="appointment"') || !input.includes('1970-01-01') || !VueInput) throw Error('Celestial input install failed');
    for (const url of Object.values(CELESTIAL_TEXTURE_URLS)) if (!existsSync(new URL(url))) throw Error('Missing packaged map');
    createSunObject().dispose();
  `], { cwd: work, stdio: 'pipe' })
  console.info(`Clean archive installs verified: core without peers, form pickers without Three.js, all visual adapters, SSR and texture assets (${result.size} bytes).`)
} catch (error) {
  if (error.stderr) process.stderr.write(error.stderr)
  throw error
} finally { rmSync(work, { recursive: true, force: true }) }
