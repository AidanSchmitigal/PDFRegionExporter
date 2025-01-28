import { writable, get } from 'svelte/store';
import type { CanvasState, CanvasItem, Tool } from './types';

const DEFAULT_STATE: CanvasState = {
	items: [],
	zoom: 1,
	panX: 0,
	panY: 0,
	selectedIds: [],
	activeTool: 'cursor',
};

function createCanvasStore() {
	const store = writable<CanvasState>(DEFAULT_STATE);
	const { subscribe, set, update } = store;

	// Load state from localStorage on initialization
	if (typeof window !== 'undefined') {
		const saved = localStorage.getItem('canvas-state');
		if (saved) {
			set(JSON.parse(saved));
		}
	}

	return {
		subscribe,
		addItem: (item: CanvasItem) =>
			update((state) => {
				const newState = {
					...state,
					items: [...state.items, item],
				};
				localStorage.setItem('canvas-state', JSON.stringify(newState));
				return newState;
			}),
		updateItem: (id: string, updates: Partial<CanvasItem>) =>
			update((state) => {
				const newState = {
					...state,
					items: state.items.map((item) =>
						item.id === id ? { ...item, ...updates } : item,
					),
				};
				localStorage.setItem('canvas-state', JSON.stringify(newState));
				return newState;
			}),
		deleteItems: (ids: string[]) =>
			update((state) => {
				const newState = {
					...state,
					items: state.items.filter((item) => !ids.includes(item.id)),
					selectedIds: [],
				};
				localStorage.setItem('canvas-state', JSON.stringify(newState));
				return newState;
			}),
		setPan: (x: number, y: number) =>
			update((state) => {
				const newState = { ...state, panX: x, panY: y };
				localStorage.setItem('canvas-state', JSON.stringify(newState));
				return newState;
			}),
		setZoom: (zoom: number) =>
			update((state) => {
				const newState = { ...state, zoom };
				localStorage.setItem('canvas-state', JSON.stringify(newState));
				return newState;
			}),
		setSelectedIds: (ids: string[]) =>
			update((state) => ({
				...state,
				selectedIds: ids,
			})),
		setActiveTool: (tool: Tool) => {
      if (tool === "center") {
        console.log("center tool!");
        canvasStore.centerView();
        return;
      }
      update((state) => ({
        ...state,
        activeTool: tool,
      }))
    },
    centerView: () => {
      update((state) => {
        console.log("centering!");
        // Get the items to center on (selected items or all items)
        const itemsToCenter = state.selectedIds.length > 0 
          ? state.items.filter(item => state.selectedIds.includes(item.id))
          : state.items;
        console.log(state.selectedIds.length > 0 ? "Selected items" : "All items");
    
        // If no items, return unchanged state
        if (itemsToCenter.length === 0) return state;

        console.log("bounds time");
    
        // Calculate bounding box of items
        const bounds = itemsToCenter.reduce((acc, item) => {
          const left = item.x;
          const right = item.x + item.width;
          const top = item.y;
          const bottom = item.y + item.height;
    
          return {
            left: Math.min(acc.left, left),
            right: Math.max(acc.right, right),
            top: Math.min(acc.top, top),
            bottom: Math.max(acc.bottom, bottom)
          };
        }, {
          left: Infinity,
          right: -Infinity,
          top: Infinity,
          bottom: -Infinity
        });

        console.log(bounds);
    
        // Calculate center point of bounds
        const centerX = (bounds.left + bounds.right) / 2;
        const centerY = (bounds.top + bounds.bottom) / 2;
    
        // Calculate required pan values to center the view
        // Note: We negate the values since panning moves the viewport in the opposite direction
        const newPanX = -centerX;
        const newPanY = -centerY;
    
        const newState = { 
          ...state,
          zoom: 1,
        	panX: newPanX,
        	panY: newPanY,
          activeTool: 'cursor' // Reset tool to cursor after centering
        };
        
        localStorage.setItem('canvas-state', JSON.stringify(newState));
        return newState;
      })
    },
		exportState: () => {
			const state = get(store);
			const blob = new Blob([JSON.stringify(state)], {
				type: 'application/json',
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'canvas-state.json';
			a.click();
			URL.revokeObjectURL(url);
		},
		importState: async (file: File) => {
			const text = await file.text();
			const state = JSON.parse(text);
			set(state);
			localStorage.setItem('canvas-state', JSON.stringify(state));
		},
		reset: () => {
			set(DEFAULT_STATE);
			localStorage.removeItem('canvas-state');
		},
	};
}

export const canvasStore = createCanvasStore();