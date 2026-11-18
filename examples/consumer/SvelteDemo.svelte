<script lang="ts">
  import { celestial, type PickerTheme } from 'skydial/svelte'
  let date = $state(new Date('2026-06-01T12:00:00Z'))
  let theme = $state<PickerTheme>('auto')
  const variant = new URLSearchParams(location.search).has('lcd') ? 'lcd' : 'celestial'
</script>
<div use:celestial={{ component: 'themeToggle', options: { variant, theme, onThemeChange: (value) => theme = value } }}></div>
<button type="button" onclick={() => date = new Date('2027-06-01T12:00:00Z')}>Change Svelte date</button>
<div use:celestial={{ component: 'widget', options: { kind: 'year', date, defaultPlanet: 'saturn', size: 'medium', variant, theme } }}></div>
