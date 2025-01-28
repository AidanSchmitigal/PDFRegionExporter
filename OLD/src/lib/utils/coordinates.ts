import type { Point } from '../types';
import type { InfiniteCanvas as InfiniteCanvasType } from 'ef-infinite-canvas';

export function screenToCanvas(
	screenX: number,
	screenY: number,
	canvas: InfiniteCanvasType,
): Point {
	// canvas.inverseTransformation = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
	// canvas.transformation = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

	const { a, b, c, d, e, f } = canvas.transformation;
	const x = (screenX * a + screenY * c + e) / d;
	const y = (screenX * b + screenY * d + f) / d;

	return {
		x,
		y,
	};
}

export function canvasToScreen(
	canvasX: number,
	canvasY: number,
	panX: number,
	panY: number,
	zoom: number,
): Point {
	return {
		x: canvasX * zoom + panX,
		y: canvasY * zoom + panY,
	};
}
