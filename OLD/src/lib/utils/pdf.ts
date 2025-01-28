import type { CanvasItem } from '../types';
import { LETTER_WIDTH, LETTER_HEIGHT } from '../types';
import { PDFDocument } from 'pdf-lib';
import { renderItems } from './render';

export async function exportRegionsToPDF(regions: CanvasItem[], allItems: CanvasItem[]) {
	const pdfDoc = await PDFDocument.create();

	for (const region of regions) {
		// Calculate dimensions to fit region in letter size while maintaining aspect ratio
		const regionAspectRatio = region.width / region.height;
		const letterAspectRatio = LETTER_WIDTH / LETTER_HEIGHT;

    const regionPageHeight = region.width / letterAspectRatio;
    let pagesNeededForRegion = region.height / regionPageHeight;

    if (pagesNeededForRegion - Math.floor(pagesNeededForRegion) < 0.1) {
      pagesNeededForRegion = Math.floor(pagesNeededForRegion);
    } else {
      pagesNeededForRegion = Math.floor(pagesNeededForRegion) + 1;
    }

    if (pagesNeededForRegion == 0) pagesNeededForRegion = 1;

    for (let regionPage = 0; regionPage < pagesNeededForRegion; regionPage++) {
  		const page = pdfDoc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);

      const subRegionWidth = region.width;
      const subRegionHeight = Math.min(region.height - (regionPageHeight * regionPage), regionPageHeight);
  
  		// Create a canvas with the region's dimensions
  		const canvas = document.createElement('canvas');
  		const ctx = canvas.getContext('2d')!;
  		canvas.width = subRegionWidth;
  		canvas.height = subRegionHeight;
  
  		// Find all items that intersect with this region
  		const itemsInRegion = allItems.filter(item => {
  			if (item.type == 'region') return false;
  			
  			const itemRight = item.x + item.width;
  			const itemBottom = item.y + item.height;
  			const regionRight = region.x + region.width;
  			const regionBottom = region.y + region.height;
  
  			return !(itemRight < region.x ||
  				item.x > regionRight ||
  				itemBottom < region.y ||
  				item.y > regionBottom);
  		});
  
  		// Translate context to render items relative to region's position
  		ctx.translate(-region.x, -region.y - regionPageHeight * regionPage);
  
  		// Draw all intersecting items
  		renderItems(ctx, itemsInRegion, []);
  
  		// Convert canvas to image data
  		const imageData = canvas.toDataURL('image/png');
  		const image = await pdfDoc.embedPng(imageData);

      const imageDims = image.scale(LETTER_WIDTH / subRegionWidth);

  		// Add image to page
  		page.drawImage(image, {
  			x: 0,
  			y: LETTER_HEIGHT - imageDims.height,
        width: imageDims.width,
        height: imageDims.height,
  		});
    }
	}

	// Save the PDF
	const pdfBytes = await pdfDoc.save();
	const blob = new Blob([pdfBytes], { type: 'application/pdf' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'regions.pdf';
	a.click();
	URL.revokeObjectURL(url);
}