<script lang="ts">
	import { canvasStore } from '$lib/store';
	import type { Tool } from '$lib/types';

	const tools: { id: Tool; icon: string; title: string; shortcut: string }[] = [
		{ id: 'center', icon: '⊙', title: 'Center', shortcut: 'O' },
		{ id: 'cursor', icon: '↖️', title: 'Select Tool', shortcut: 'V' },
		{ id: 'pan', icon: '✋', title: 'Pan Tool', shortcut: 'H' },
		{ id: 'text', icon: 'T', title: 'Text Tool', shortcut: 'T' },
		{ id: 'region', icon: '⬚', title: 'Region Tool', shortcut: 'R' },
	];

	$: activeTool = $canvasStore.activeTool;

	function handleToolClick(tool: Tool) {
		canvasStore.setActiveTool(tool);
	}
</script>

<div class="fixed left-4 top-4 z-10 flex flex-col gap-2 rounded-lg bg-white p-2 shadow-lg">
	{#each tools as tool}
		<button
			class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors {activeTool === tool.id
				? 'bg-blue-500 text-white'
				: 'hover:bg-gray-100'}"
			on:click={() => handleToolClick(tool.id)}
			title="{tool.title} ({tool.shortcut})"
		>
			{tool.icon}
		</button>
	{/each}
</div>