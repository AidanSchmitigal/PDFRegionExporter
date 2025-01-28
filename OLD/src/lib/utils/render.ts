import type { CanvasItem } from '../types';
import { LETTER_WIDTH, LETTER_HEIGHT } from '../types';

export function renderItems(
	ctx: CanvasRenderingContext2D,
	items: CanvasItem[],
	selectedIds: string[],
) {
	// Sort items so regions are always on top
	const sortedItems = [...items].sort((a, b) => {
		if (a.type === 'region' && b.type !== 'region') return 1;
		if (a.type !== 'region' && b.type === 'region') return -1;
		return 0;
	});

	// Draw items
	for (const item of sortedItems) {
		ctx.save();
		ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
		ctx.rotate(item.rotation);
		ctx.translate(-item.width / 2, -item.height / 2);

		// Apply styles
		if (item.style?.backgroundColor) {
			ctx.fillStyle = item.style.backgroundColor;
			ctx.fillRect(0, 0, item.width * item.scale, item.height * item.scale);
		}

		if (item.type === 'image') {
			const img = new Image();
			img.src = item.content;
			ctx.drawImage(img, 0, 0, item.width * item.scale, item.height * item.scale);
		} else if (item.type === 'pdf') {
			ctx.fillStyle = '#f0f0f0';
			ctx.fillRect(0, 0, item.width * item.scale, item.height * item.scale);
			ctx.strokeRect(0, 0, item.width * item.scale, item.height * item.scale);
		} else if (item.type === 'text') {
			ctx.fillStyle = '#000';
			ctx.font = `${item.style?.fontWeight ?? 400} ${item.style?.fontSize ?? 16}px "${item.style?.fontFamily ?? 'Arial'}"`;
			ctx.fillText(item.content, 0, (item.style?.fontSize ?? 16));
		} else if (item.type === 'region') {
			// Draw the region with more transparent background
			ctx.fillStyle = 'rgba(33, 150, 243, 0.1)';
			ctx.fillRect(0, 0, item.width * item.scale, item.height * item.scale);
			ctx.strokeStyle = 'rgba(33, 150, 243, 0.6)';
			ctx.lineWidth = 2;
			ctx.strokeRect(0, 0, item.width * item.scale, item.height * item.scale);

			// Draw letter-size aspect ratio guide
			ctx.setLineDash([5, 5]);
			ctx.strokeStyle = 'rgba(102, 102, 102, 0.4)';
			ctx.lineWidth = 1;

			const letterAspectRatio = LETTER_WIDTH / LETTER_HEIGHT;
      const regionPageSize = item.width / letterAspectRatio;

      let pagesInRegion = Math.floor(item.height / regionPageSize);
      if (pagesInRegion == 0) pagesInRegion = 1;

      for (let regionPage = 1; regionPage <= pagesInRegion; regionPage++) {
			  ctx.strokeRect(0, 0, item.width, regionPageSize * regionPage);
      }
			ctx.setLineDash([]);
		}

		// Draw border if specified
		if (item.style?.borderWidth && item.style?.borderColor) {
			ctx.strokeStyle = item.style.borderColor;
			ctx.lineWidth = item.style.borderWidth;
			if (item.style?.borderRadius) {
				const radius = item.style.borderRadius;
				ctx.beginPath();
				ctx.moveTo(radius, 0);
				ctx.lineTo(item.width - radius, 0);
				ctx.quadraticCurveTo(item.width, 0, item.width, radius);
				ctx.lineTo(item.width, item.height - radius);
				ctx.quadraticCurveTo(item.width, item.height, item.width - radius, item.height);
				ctx.lineTo(radius, item.height);
				ctx.quadraticCurveTo(0, item.height, 0, item.height - radius);
				ctx.lineTo(0, radius);
				ctx.quadraticCurveTo(0, 0, radius, 0);
				ctx.stroke();
			} else {
				ctx.strokeRect(0, 0, item.width * item.scale, item.height * item.scale);
			}
		}

		ctx.restore();

		// Draw selection
		if (selectedIds.includes(item.id)) {
			ctx.save();
			ctx.strokeStyle = '#2196f3';
			ctx.lineWidth = 2;
			ctx.strokeRect(item.x, item.y, item.width, item.height);

			// Draw transform handles with larger size
			const handleSize = 12;
			const handles = [
				{ x: item.x, y: item.y }, // Top-left
				{ x: item.x + item.width / 2, y: item.y }, // Top-middle
				{ x: item.x + item.width, y: item.y }, // Top-right
				{ x: item.x + item.width, y: item.y + item.height / 2 }, // Middle-right
				{ x: item.x + item.width, y: item.y + item.height }, // Bottom-right
				{ x: item.x + item.width / 2, y: item.y + item.height }, // Bottom-middle
				{ x: item.x, y: item.y + item.height }, // Bottom-left
				{ x: item.x, y: item.y + item.height / 2 }, // Middle-left
			];

			for (const handle of handles) {
				ctx.fillStyle = '#fff';
				ctx.fillRect(
					handle.x - handleSize / 2,
					handle.y - handleSize / 2,
					handleSize,
					handleSize,
				);
				ctx.strokeRect(
					handle.x - handleSize / 2,
					handle.y - handleSize / 2,
					handleSize,
					handleSize,
				);
			}

			ctx.restore();
		}
	}
}