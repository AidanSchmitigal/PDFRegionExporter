<script lang="ts">
	import { onMount } from 'svelte';
	import { canvasStore } from '$lib/store';
	import type { CanvasItem, Point, Rect } from '$lib/types';
	import { drawGrid } from '$lib/utils/grid';
	import { renderItems } from '$lib/utils/render';
	import { screenToCanvas, canvasToScreen } from '$lib/utils/coordinates';
	import InfiniteCanvas, {
		type InfiniteCanvas as InfiniteCanvasType,
	} from 'ef-infinite-canvas';

	let htmlcanvas: HTMLCanvasElement;
	let canvas: InfiniteCanvasType;
	let ctx: CanvasRenderingContext2D;
	let isDragging = false;
	let dragStartX = 0;
	let dragStartY = 0;
	let selectionStart: Point | null = null;
	let selectionRect: Rect | null = null;
	let isPanning = false;
	let isResizing = false;
	let resizeHandle: number | null = null;
	let isRotating = false;
	let textEditingId: string | null = null;
	let textInput: HTMLTextAreaElement;
	let initialAspectRatio = 1;

	$: items = $canvasStore.items;
	$: zoom = $canvasStore.zoom;
	$: panX = $canvasStore.panX;
	$: panY = $canvasStore.panY;
	$: selectedIds = $canvasStore.selectedIds;
	$: activeTool = $canvasStore.activeTool;

	// Cursor styles for resize handles
	const handleCursors = [
		'nw-resize', // Top-left
		'n-resize', // Top-middle
		'ne-resize', // Top-right
		'e-resize', // Middle-right
		'se-resize', // Bottom-right
		's-resize', // Bottom-middle
		'sw-resize', // Bottom-left
		'w-resize', // Middle-left
	];

	onMount(() => {
		canvas = new InfiniteCanvas(htmlcanvas);
		ctx = canvas.getContext('2d')!;
		setupEventListeners();
		render();

		// Handle keyboard shortcuts
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	});

	function setupEventListeners() {
		// canvas.addEventListener('wheel', handleWheel);
		canvas.addEventListener('mousedown', handleMouseDown);
		canvas.addEventListener('mousemove', handleMouseMove);
		canvas.addEventListener('mouseup', handleMouseUp);
		canvas.addEventListener('dblclick', handleDoubleClick);
		canvas.addEventListener('dragover', handleDragOver);
		canvas.addEventListener('drop', handleDrop);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.code === 'Space') {
			isPanning = true;
		} else if (e.code === 'KeyV') {
			canvasStore.setActiveTool('cursor');
		} else if (e.code === 'KeyH') {
			canvasStore.setActiveTool('pan');
		} else if (e.code === 'KeyT') {
			canvasStore.setActiveTool('text');
		} else if (e.code === 'KeyR') {
			canvasStore.setActiveTool('region');
		} else if (e.code === 'Delete' || e.code === 'Backspace') {
			if (selectedIds.length > 0 && !textEditingId) {
				canvasStore.deleteItems(selectedIds);
			}
		} else if (e.code === 'Escape') {
			if (textEditingId) {
				textEditingId = null;
			}
		}
	}

	function handleKeyUp(e: KeyboardEvent) {
		if (e.code === 'Space') {
			isPanning = false;
		}
	}

	// function handleWheel(e: WheelEvent) {
	// 	e.preventDefault();
	// 	if (e.ctrlKey) {
	// 		const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
	// 		canvasStore.setZoom(zoom * zoomDelta);
	// 	} else {
	// 		canvasStore.setPan(panX - e.deltaX, panY - e.deltaY);
	// 	}
	// 	render();
	// }

	function isPointInItem(x: number, y: number, item: CanvasItem) {
		return (
			x >= item.x &&
			x <= item.x + item.width &&
			y >= item.y &&
			y <= item.y + item.height
		);
	}

	function isItemInRect(item: CanvasItem, rect: Rect) {
		return (
			item.x + item.width >= rect.x &&
			item.x <= rect.x + rect.width &&
			item.y + item.height >= rect.y &&
			item.y <= rect.y + rect.height
		);
	}

	function getResizeHandle(
		x: number,
		y: number,
		item: CanvasItem,
	): number | null {
		const handleSize = 32;
		const handles = [
			{ x: item.x, y: item.y }, // 0: Top-left
			{ x: item.x + item.width / 2, y: item.y }, // 1: Top-middle
			{ x: item.x + item.width, y: item.y }, // 2: Top-right
			{ x: item.x + item.width, y: item.y + item.height / 2 }, // 3: Middle-right
			{ x: item.x + item.width, y: item.y + item.height }, // 4: Bottom-right
			{ x: item.x + item.width / 2, y: item.y + item.height }, // 5: Bottom-middle
			{ x: item.x, y: item.y + item.height }, // 6: Bottom-left
			{ x: item.x, y: item.y + item.height / 2 }, // 7: Middle-left
		];

		for (let i = 0; i < handles.length; i++) {
			const handle = handles[i]!;
			if (
				Math.abs(x - handle.x) <= handleSize / 2 &&
				Math.abs(y - handle.y) <= handleSize / 2
			) {
				return i;
			}
		}

		return null;
	}

	function updateCursor(e: MouseEvent) {
		if (isPanning || activeTool === 'pan') {
			htmlcanvas.style.cursor = 'grab';
			return;
		}

		if (activeTool === 'cursor') {
			const pos = screenToCanvas(e.clientX, e.clientY, canvas);
			const selectedItem = items.find((item) => selectedIds.includes(item.id));

			if (selectedItem) {
				const handleIndex = getResizeHandle(pos.x, pos.y, selectedItem);
				if (handleIndex !== null && handleCursors[handleIndex]) {
					htmlcanvas.style.cursor = handleCursors[handleIndex];
					return;
				}
			}

			const hoveredItem = items.find((item) =>
				isPointInItem(pos.x, pos.y, item),
			);
			htmlcanvas.style.cursor = hoveredItem ? 'move' : 'default';
		} else if (activeTool === 'text') {
			htmlcanvas.style.cursor = 'text';
		} else if (activeTool === 'region') {
			htmlcanvas.style.cursor = 'crosshair';
		} else {
			htmlcanvas.style.cursor = 'default';
		}
	}

	function handleMouseDown(e: MouseEvent) {
		console.log('handleMouseDown');
		if (textEditingId) {
			textEditingId = null;
			return;
		}

		isDragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;

		console.log(canvas.transformation);
		const pos = screenToCanvas(e.clientX, e.clientY, canvas);
		console.log(pos);

		if (activeTool === 'cursor' || isPanning) {
			// Check if clicking on a resize handle of selected item first
			if (selectedIds.length === 1) {
				const selectedItem = items.find((item) => item.id === selectedIds[0]);
				if (selectedItem) {
					const handleIndex = getResizeHandle(pos.x, pos.y, selectedItem);
					if (handleIndex !== null) {
						isResizing = true;
						resizeHandle = handleIndex;
						initialAspectRatio = selectedItem.width / selectedItem.height;
						return; // Prevent further processing
					}
				}
			}

			const clickedItem = items.find((item) =>
				isPointInItem(pos.x, pos.y, item),
			);

			if (clickedItem) {
				if (!selectedIds.includes(clickedItem.id)) {
					canvasStore.setSelectedIds([clickedItem.id]);
				}
			} else if (!isPanning) {
				selectionStart = pos;
				canvasStore.setSelectedIds([]);
			}
		} else if (activeTool === 'text') {
			const newText: CanvasItem = {
				id: crypto.randomUUID(),
				type: 'text',
				x: pos.x,
				y: pos.y,
				width: 200,
				height: 100,
				rotation: 0,
				content: 'Double click to edit',
				scale: 1,
				style: {
					fontSize: 16,
					fontFamily: 'Arial',
					fontWeight: 400,
				},
			};
			canvasStore.addItem(newText);
			canvasStore.setSelectedIds([newText.id]);
			textEditingId = newText.id;
		} else if (activeTool === 'region') {
			selectionStart = pos;
			const newRegion: CanvasItem = {
				id: crypto.randomUUID(),
				type: 'region',
				x: pos.x,
				y: pos.y,
				width: 0,
				height: 0,
				rotation: 0,
				content: '',
				scale: 1,
			};
			canvasStore.addItem(newRegion);
			canvasStore.setSelectedIds([newRegion.id]);
		}

		render();
	}

	function handleMouseMove(e: MouseEvent) {
		console.log('handleMouseMove');
		updateCursor(e);

		if (!isDragging) return;

		const currentX = e.clientX;
		const currentY = e.clientY;
		const dx = (currentX - dragStartX) / zoom;
		const dy = (currentY - dragStartY) / zoom;

		let cancelEvent = true;

		if (activeTool === 'pan' || isPanning) {
			cancelEvent = false;
		} else if (activeTool === 'cursor') {
			if (isResizing && selectedIds.length === 1) {
				const item = items.find((i) => i.id === selectedIds[0])!;
				let newX = item.x;
				let newY = item.y;
				let newWidth = item.width;
				let newHeight = item.height;

				// Update dimensions based on resize handle
				switch (resizeHandle) {
					case 0: // Top-left
						newX += dx;
						newY += dy;
						newWidth -= dx;
						newHeight -= dy;
						break;
					case 1: // Top-middle
						newY += dy;
						newHeight -= dy;
						break;
					case 2: // Top-right
						newY += dy;
						newWidth += dx;
						newHeight -= dy;
						break;
					case 3: // Middle-right
						newWidth += dx;
						break;
					case 4: // Bottom-right
						newWidth += dx;
						newHeight += dy;
						break;
					case 5: // Bottom-middle
						newHeight += dy;
						break;
					case 6: // Bottom-left
						newX += dx;
						newWidth -= dx;
						newHeight += dy;
						break;
					case 7: // Middle-left
						newX += dx;
						newWidth -= dx;
						break;
				}

				// Preserve aspect ratio if shift is held
				if (e.shiftKey) {
					if ([0, 2, 4, 6].includes(resizeHandle!)) {
						// Corner handles
						const currentAspectRatio = newWidth / newHeight;
						if (currentAspectRatio > initialAspectRatio) {
							newWidth = newHeight * initialAspectRatio;
						} else {
							newHeight = newWidth / initialAspectRatio;
						}
					} else if ([1, 5].includes(resizeHandle!)) {
						// Top/bottom middle
						newWidth = newHeight * initialAspectRatio;
					} else {
						// Left/right middle
						newHeight = newWidth / initialAspectRatio;
					}
				}

				if (newWidth > 10 && newHeight > 10) {
					canvasStore.updateItem(item.id, {
						x: newX,
						y: newY,
						width: newWidth,
						height: newHeight,
					});
				}
			} else if (selectionStart) {
				console.log(canvas.transformation);
				const currentPos = screenToCanvas(currentX, currentY, canvas);
				selectionRect = {
					x: Math.min(selectionStart.x, currentPos.x),
					y: Math.min(selectionStart.y, currentPos.y),
					width: Math.abs(currentPos.x - selectionStart.x),
					height: Math.abs(currentPos.y - selectionStart.y),
				};

				// Select items within the selection rectangle
				const selectedItems = items.filter((item) =>
					isItemInRect(item, selectionRect!),
				);
				canvasStore.setSelectedIds(selectedItems.map((item) => item.id));
			} else if (selectedIds.length > 0 && !isResizing) {
				// Move selected items
				for (const id of selectedIds) {
					const item = items.find((i) => i.id === id);
					if (item) {
						canvasStore.updateItem(id, {
							x: item.x + dx,
							y: item.y + dy,
						});
					}
				}
			}
		} else if (activeTool === 'region' && selectionStart) {
			const currentPos = screenToCanvas(currentX, currentY, canvas);
			const selectedRegion = items.find((i) => i.id === selectedIds[0]);
			if (selectedRegion) {
				canvasStore.updateItem(selectedRegion.id, {
					width: Math.abs(currentPos.x - selectionStart.x),
					height: Math.abs(currentPos.y - selectionStart.y),
					x: Math.min(selectionStart.x, currentPos.x),
					y: Math.min(selectionStart.y, currentPos.y),
				});
			}
		} else {
			cancelEvent = false;
		}

		if (cancelEvent) {
			e.preventDefault();
		}

		dragStartX = currentX;
		dragStartY = currentY;
		render();
	}

	function handleMouseUp() {
		isDragging = false;
		isResizing = false;
		resizeHandle = null;
		selectionStart = null;
		selectionRect = null;
		render(); // Ensure final state is rendered
		updateCursor({ clientX: dragStartX, clientY: dragStartY } as MouseEvent);
	}

	function handleDoubleClick(e: MouseEvent) {
		const pos = screenToCanvas(e.clientX, e.clientY, canvas);
		const clickedItem = items.find(
			(item) => item.type === 'text' && isPointInItem(pos.x, pos.y, item),
		);

		if (clickedItem) {
			textEditingId = clickedItem.id;
			render();
		}
	}

	function handleTextInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		if (textEditingId) {
			canvasStore.updateItem(textEditingId, {
				content: target.value,
			});
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'copy';
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		const files = Array.from(e.dataTransfer!.files);
		const pos = screenToCanvas(e.clientX, e.clientY, canvas);

		for (const file of files) {
			if (file.type.startsWith('image/')) {
				await handleImageDrop(file, pos.x, pos.y);
			} else if (file.type === 'application/pdf') {
				await handlePDFDrop(file, pos.x, pos.y);
			}
		}
	}

	async function handleImageDrop(file: File, x: number, y: number) {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.src = url;
		await new Promise((resolve) => (img.onload = resolve));

		canvasStore.addItem({
			id: crypto.randomUUID(),
			type: 'image',
			x,
			y,
			width: img.width,
			height: img.height,
			rotation: 0,
			content: url,
			scale: 1,
		});

		render();
	}

	async function handlePDFDrop(file: File, x: number, y: number) {
		const url = URL.createObjectURL(file);
		canvasStore.addItem({
			id: crypto.randomUUID(),
			type: 'pdf',
			x,
			y,
			width: 595,
			height: 842,
			rotation: 0,
			content: url,
			scale: 1,
		});

		render();
	}

	function render() {
		const width = (htmlcanvas.width = window.innerWidth);
		const height = (htmlcanvas.height = window.innerHeight);

		ctx.clearRect(0, 0, width, height);
		ctx.save();

		// Apply pan and zoom transformations
		// ctx.translate(panX, panY);
		// ctx.scale(zoom, zoom);

		// Draw grid
		drawGrid(ctx, width, height, panX, panY, zoom);

		// Draw items and selection
		renderItems(ctx, items, selectedIds);

		// Draw selection rectangle
		if (selectionRect) {
			ctx.strokeStyle = '#2196f3';
			ctx.lineWidth = 1;
			ctx.strokeRect(
				selectionRect.x,
				selectionRect.y,
				selectionRect.width,
				selectionRect.height,
			);
		}

		ctx.restore();
	}
</script>

<canvas bind:this={htmlcanvas} class="touch-none"></canvas>

{#if textEditingId}
	{@const item = items.find((i) => i.id === textEditingId)}
	{#if item}
		<textarea
			bind:this={textInput}
			class="fixed resize-none rounded border p-2 shadow-lg"
			style="
				left: {item.x * zoom + panX}px;
				top: {item.y * zoom + panY}px;
				width: {item.width * zoom}px;
				height: {item.height * zoom}px;
				font-family: {item.style?.fontFamily ?? 'Arial'};
				font-size: {(item.style?.fontSize ?? 16) * zoom}px;
				font-weight: {item.style?.fontWeight ?? 400};
				transform: rotate({item.rotation}rad);
				transform-origin: top left;
			"
			value={item.content}
			on:input={handleTextInput}
			on:blur={() => (textEditingId = null)}
		></textarea>
	{/if}
{/if}

<style>
	canvas {
		width: 100vw;
		height: 100vh;
	}
</style>
