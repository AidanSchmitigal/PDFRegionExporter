<script lang="ts">
	import { canvasStore } from '$lib/store';
	import type { CanvasItem } from '$lib/types';
	import { exportRegionsToPDF } from '$lib/utils/pdf';

	$: regions = $canvasStore.items
		.filter((item) => item.type === 'region')
		.sort((a, b) => a.y - b.y);

	function selectRegion(id: string) {
		canvasStore.setSelectedIds([id]);
	}

	function deleteRegion(id: string) {
		canvasStore.deleteItems([id]);
	}

	function moveRegion(id: string, direction: 'up' | 'down') {
		const index = regions.findIndex(r => r.id === id);
		if (direction === 'up' && index > 0) {
			const temp = regions[index - 1]!.y;
			canvasStore.updateItem(regions[index - 1]!.id, { y: regions[index]!.y });
			canvasStore.updateItem(id, { y: temp });
		} else if (direction === 'down' && index < regions.length - 1) {
			const temp = regions[index + 1]!.y;
			canvasStore.updateItem(regions[index + 1]!.id, { y: regions[index]!.y });
			canvasStore.updateItem(id, { y: temp });
		}
	}

	async function handleExportPDF() {
		await exportRegionsToPDF(regions, $canvasStore.items);
	}
</script>

<div class="fixed right-4 top-20 z-10 w-64 rounded-lg bg-white p-4 shadow-lg">
	<h2 class="mb-4 text-lg font-semibold">Regions</h2>
	{#if regions.length === 0}
		<p class="text-gray-500">No regions created yet</p>
	{:else}
		<div class="space-y-2">
			{#each regions as region, i}
				<div
					class="flex items-center gap-2 rounded border p-2 {$canvasStore.selectedIds.includes(
						region.id,
					)
						? 'border-blue-500 bg-blue-50'
						: 'border-gray-200'}"
				>
					<button
						class="flex-1 text-left"
						on:click={() => selectRegion(region.id)}
					>
						Region {i + 1}
					</button>
					<div class="flex gap-1">
						<button
							class="rounded p-1 hover:bg-gray-100 {i === 0
								? 'text-gray-300'
								: 'text-gray-600'}"
							disabled={i === 0}
							on:click={() => moveRegion(region.id, 'up')}
							title="Move up"
						>
							↑
						</button>
						<button
							class="rounded p-1 hover:bg-gray-100 {i === regions.length - 1
								? 'text-gray-300'
								: 'text-gray-600'}"
							disabled={i === regions.length - 1}
							on:click={() => moveRegion(region.id, 'down')}
							title="Move down"
						>
							↓
						</button>
						<button
							class="rounded p-1 text-red-600 hover:bg-red-50"
							on:click={() => deleteRegion(region.id)}
							title="Delete region"
						>
							×
						</button>
					</div>
				</div>
			{/each}
		</div>

		<button
			class="mt-4 w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
			on:click={handleExportPDF}
		>
			Export to PDF
		</button>
	{/if}
</div>