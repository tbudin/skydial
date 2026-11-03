<script lang="ts">
  import { celestial } from 'skydial/svelte'
  let date = $state(new Date('2026-06-01T12:00:00Z'))
</script>
<button type="button" onclick={() => date = new Date('2027-06-01T12:00:00Z')}>Change Svelte date</button>
<div use:celestial={{ component: 'widget', options: { kind: 'year', date, defaultPlanet: 'saturn', size: 'medium' } }}></div>
