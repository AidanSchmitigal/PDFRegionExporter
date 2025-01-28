<script lang="ts">
	import Canvas from '$lib/components/Canvas.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import EditorControls from '$lib/components/EditorControls.svelte';
	import RegionList from '$lib/components/RegionList.svelte';
	import { canvasStore } from '$lib/store';

	function handleExport() {
		canvasStore.exportState();
	}

	async function handleImport(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.length) {
			await canvasStore.importState(input.files[0]);
		}
	}
</script>

<div class="fixed top-4 right-4 z-10 flex gap-2">
	<button
		class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
		on:click={handleExport}
	>
		Export
	</button>
	<label class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 cursor-pointer">
		Import
		<input
			type="file"
			accept=".json"
			class="hidden"
			on:change={handleImport}
		/>
	</label>
</div>

<Toolbar />
<EditorControls />
<RegionList />
<Canvas />