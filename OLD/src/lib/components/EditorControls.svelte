<script lang="ts">
	import { canvasStore } from '$lib/store';
	import type { CanvasItem } from '$lib/types';

	$: selectedItems = $canvasStore.items.filter(item => 
		$canvasStore.selectedIds.includes(item.id)
	);
	$: selectedItem = selectedItems.length === 1 ? selectedItems[0] : null;

	function updateItem(updates: Partial<CanvasItem>) {
		if (selectedItem) {
			canvasStore.updateItem(selectedItem.id, updates);
		}
	}

	function updateStyle(updates: Partial<CanvasItem['style']>) {
		if (selectedItem) {
			canvasStore.updateItem(selectedItem.id, {
				style: { ...selectedItem.style, ...updates }
			});
		}
	}

	function deleteSelected() {
		canvasStore.deleteItems($canvasStore.selectedIds);
	}

	const fontFamilies = [
		'Arial',
		'Times New Roman',
		'Courier New',
		'Georgia',
		'Verdana'
	];

	const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
	const fontWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
</script>

{#if selectedItem}
	<div class="fixed left-20 top-4 z-10 rounded-lg bg-white p-4 shadow-lg">
		<div class="mb-4 grid grid-cols-2 gap-2">
			<label class="flex flex-col">
				<span class="text-sm">X</span>
				<input
					type="number"
					class="rounded border px-2 py-1"
					value={selectedItem.x}
					on:input={(e) => updateItem({ x: +e.currentTarget.value })}
				/>
			</label>
			<label class="flex flex-col">
				<span class="text-sm">Y</span>
				<input
					type="number"
					class="rounded border px-2 py-1"
					value={selectedItem.y}
					on:input={(e) => updateItem({ y: +e.currentTarget.value })}
				/>
			</label>
			<label class="flex flex-col">
				<span class="text-sm">Width</span>
				<input
					type="number"
					class="rounded border px-2 py-1"
					value={selectedItem.width}
					on:input={(e) => updateItem({ width: +e.currentTarget.value })}
				/>
			</label>
			<label class="flex flex-col">
				<span class="text-sm">Height</span>
				<input
					type="number"
					class="rounded border px-2 py-1"
					value={selectedItem.height}
					on:input={(e) => updateItem({ height: +e.currentTarget.value })}
				/>
			</label>
			<label class="flex flex-col">
				<span class="text-sm">Scale</span>
				<input
					type="number"
					class="rounded border px-2 py-1"
					value={selectedItem.scale}
					step="0.1"
					on:input={(e) => updateItem({ scale: +e.currentTarget.value })}
				/>
			</label>
			<label class="flex flex-col">
				<span class="text-sm">Rotation</span>
				<input
					type="number"
					class="rounded border px-2 py-1"
					value={selectedItem.rotation}
					on:input={(e) => updateItem({ rotation: +e.currentTarget.value })}
				/>
			</label>
		</div>

		<div class="mb-4 grid grid-cols-2 gap-2">
			<label class="flex flex-col">
				<span class="text-sm">Border Radius</span>
				<input
					type="number"
					class="rounded border px-2 py-1"
					value={selectedItem.style?.borderRadius ?? 0}
					on:input={(e) => updateStyle({ borderRadius: +e.currentTarget.value })}
				/>
			</label>
			<label class="flex flex-col">
				<span class="text-sm">Border Width</span>
				<input
					type="number"
					class="rounded border px-2 py-1"
					value={selectedItem.style?.borderWidth ?? 0}
					on:input={(e) => updateStyle({ borderWidth: +e.currentTarget.value })}
				/>
			</label>
			<label class="flex flex-col">
				<span class="text-sm">Border Color</span>
				<input
					type="color"
					class="h-8 w-full rounded border"
					value={selectedItem.style?.borderColor ?? '#000000'}
					on:input={(e) => updateStyle({ borderColor: e.currentTarget.value })}
				/>
			</label>
			<label class="flex flex-col">
				<span class="text-sm">Background</span>
				<input
					type="color"
					class="h-8 w-full rounded border"
					value={selectedItem.style?.backgroundColor ?? '#ffffff'}
					on:input={(e) => updateStyle({ backgroundColor: e.currentTarget.value })}
				/>
			</label>
		</div>

		{#if selectedItem.type === 'text'}
			<div class="mb-4 grid grid-cols-2 gap-2">
				<label class="flex flex-col">
					<span class="text-sm">Font Family</span>
					<select
						class="rounded border px-2 py-1"
						value={selectedItem.style?.fontFamily ?? 'Arial'}
						on:change={(e) => updateStyle({ fontFamily: e.currentTarget.value })}
					>
						{#each fontFamilies as font}
							<option value={font}>{font}</option>
						{/each}
					</select>
				</label>
				<label class="flex flex-col">
					<span class="text-sm">Font Size</span>
					<select
						class="rounded border px-2 py-1"
						value={selectedItem.style?.fontSize ?? 16}
						on:change={(e) => updateStyle({ fontSize: +e.currentTarget.value })}
					>
						{#each fontSizes as size}
							<option value={size}>{size}px</option>
						{/each}
					</select>
				</label>
				<label class="flex flex-col">
					<span class="text-sm">Font Weight</span>
					<select
						class="rounded border px-2 py-1"
						value={selectedItem.style?.fontWeight ?? 400}
						on:change={(e) => updateStyle({ fontWeight: +e.currentTarget.value })}
					>
						{#each fontWeights as weight}
							<option value={weight}>{weight}</option>
						{/each}
					</select>
				</label>
			</div>
		{/if}

		<button
			class="w-full rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
			on:click={deleteSelected}
		>
			Delete
		</button>
	</div>
{/if}