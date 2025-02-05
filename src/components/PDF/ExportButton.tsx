// ExportButton.tsx
import { PDFDocument, PageSizes } from "pdf-lib";
import { useState } from "react";
import { Box, Editor, exportToBlob, useEditor } from "tldraw";

export function ExportPdfButton() {
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const editor = useEditor();

  return (
    <button
      className="ExportPdfButton"
      onClick={async () => {
        setExportProgress(0);
        try {
          await exportPdfFromRegions(editor, setExportProgress);
        } finally {
          setExportProgress(null);
        }
      }}>
      {exportProgress ? `Exporting... ${Math.round(exportProgress * 100)}%` : "Export PDF"}
    </button>
  );
}

async function exportPdfFromRegions(editor: Editor, onProgress: (progress: number) => void) {
  // Find all PDF region shapes
  const pdfRegions = Array.from(editor.getCurrentPageShapeIds())
    .map((id) => ({
      id,
      shape: editor.getShape(id),
    }))
    .filter(({ shape }) => shape?.type === "card")
    .sort((a, b) => {
      // Sort by vertical position for page order
      const boundsA = editor.getShapePageBounds(a.id);
      const boundsB = editor.getShapePageBounds(b.id);
      return (boundsA?.y ?? 0) - (boundsB?.y ?? 0);
    });

  if (pdfRegions.length === 0) {
    alert("No PDF regions found");
    return;
  }

  let totalSteps = pdfRegions.length * 2 + 2;
  let progress = 0;
  const tickProgress = () => {
    progress++;
    onProgress(progress / totalSteps);
  };

  /**
   * ===============================================
   */

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  tickProgress();

  const allIds = Array.from(editor.getCurrentPageShapeIds()).filter((id) => editor.getShape(id)?.type !== "card");

  const letterPaperRatio = 8.5 / 11;

  // Process each region
  for (const region of pdfRegions) {
    const bounds = editor.getShapePageBounds(region.id);
    if (!bounds) continue;

    console.log("region", region);
    console.log("bounds", bounds);

    const regionWidth = bounds.w;
    const regionHeight = bounds.h;
    const regionPageHeight = regionWidth / letterPaperRatio;
    const pagesNeeded = Math.ceil(regionHeight / regionPageHeight);

    console.log("regionWidth", regionWidth);
    console.log("regionHeight", regionHeight);
    console.log("regionPageHeight", regionPageHeight);
    console.log("pagesNeeded", pagesNeeded);

    totalSteps += pagesNeeded - 1;

    for (let i = 0; i < pagesNeeded; i++) {
      const newBounds = new Box(bounds.x, bounds.y + regionPageHeight * i, regionWidth, Math.min(regionHeight - regionPageHeight * i, regionPageHeight));
      console.log("i", i);
      console.log("regionheight", regionHeight);
      console.log("region h", regionPageHeight * i);
      console.log("region -", regionHeight - regionPageHeight * i);
      console.log("rejjjj", regionPageHeight);
      console.log("rejjjj", (regionHeight - regionPageHeight * i) % regionPageHeight);
      console.log("newBounds", newBounds);

      // Screenshot the region
      const exportedPng = await exportToBlob({
        editor,
        ids: allIds,
        format: "png",
        opts: {
          background: true,
          bounds: newBounds,
          padding: 0,
          scale: 2, // Higher resolution
        },
      });
      tickProgress();

      // Add a new page and embed the screenshot
      const page = pdfDoc.addPage(PageSizes.Letter);
      const pngImage = await pdfDoc.embedPng(await exportedPng.arrayBuffer());

      // Calculate dimensions to fit the page while maintaining aspect ratio
      const { width: imageWidth, height: imageHeight } = pngImage;
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const scale = Math.min(pageWidth / imageWidth, pageHeight / imageHeight);

      page.drawImage(pngImage, {
        x: 0,
        y: pageHeight - imageHeight * scale,
        width: imageWidth * scale,
        height: imageHeight * scale,
      });
      tickProgress();
    }
  }

  // Save and download the PDF
  const pdfBytes = await pdfDoc.save();
  const url = URL.createObjectURL(new Blob([pdfBytes], { type: "application/pdf" }));
  tickProgress();

  const a = document.createElement("a");
  a.href = url;
  a.download = "exported-regions.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
