export function drawGrid(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	panX: number,
	panY: number,
	zoom: number,
) {
	const gridSize = 50;
	const offsetX = panX % (gridSize * zoom);
	const offsetY = panY % (gridSize * zoom);

	ctx.strokeStyle = '#eee';
	ctx.lineWidth = 1;

	for (let x = offsetX; x < width; x += gridSize * zoom) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height);
		ctx.stroke();
	}

	for (let y = offsetY; y < height; y += gridSize * zoom) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(width, y);
		ctx.stroke();
	}
}