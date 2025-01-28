export type Tool = 'center' | 'cursor' | 'pan' | 'text' | 'region';

export interface CanvasItem {
	id: string;
	type: 'pdf' | 'image' | 'text' | 'region';
	x: number;
	y: number;
	width: number;
	height: number;
	rotation: number;
	content: string; // URL for images/PDFs, text content for text
	scale: number;
	style?: {
		borderRadius?: number;
		borderWidth?: number;
		borderColor?: string;
		backgroundColor?: string;
		fontFamily?: string;
		fontSize?: number;
		fontWeight?: number;
	};
}

export interface CanvasState {
	items: CanvasItem[];
	zoom: number;
	panX: number;
	panY: number;
	selectedIds: string[];
	activeTool: Tool;
}

export interface Point {
	x: number;
	y: number;
}

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

// US Letter size in pixels at 72 DPI
export const LETTER_WIDTH = 612; // 8.5 inches
export const LETTER_HEIGHT = 792; // 11 inches