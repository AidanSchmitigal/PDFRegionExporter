import { useMemo, useState } from "react";
import { Box, Editor, SVGContainer, TLComponents, TLImageShape, TLShapePartial, Tldraw, getIndicesBetween, react, sortByIndex, track, useEditor, useSelectionEvents } from "tldraw";
// import { ExportPdfButton } from "./ExportPdfButton";
import { Pdf, PdfPicker } from "./PdfPicker";

export const PageOverlayScreen = track(function PageOverlayScreen({ pdfs }: { pdfs: Pdf[] }) {
  const editor = useEditor();

  const viewportPageBounds = editor.getViewportPageBounds();
  const viewportScreenBounds = editor.getViewportScreenBounds();

  const relevantPageBounds = pdfs.flatMap((pdf) =>
    pdf.pages
      .map((page) => {
        if (!viewportPageBounds.collides(page.bounds)) return null;
        const topLeft = editor.pageToViewport(page.bounds);
        const bottomRight = editor.pageToViewport({ x: page.bounds.maxX, y: page.bounds.maxY });
        return new Box(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
      })
      .filter((bounds): bounds is Box => bounds !== null)
  );

  function pathForPageBounds(bounds: Box) {
    return `M ${bounds.x} ${bounds.y} L ${bounds.maxX} ${bounds.y} L ${bounds.maxX} ${bounds.maxY} L ${bounds.x} ${bounds.maxY} Z`;
  }

  const viewportPath = `M 0 0 L ${viewportScreenBounds.w} 0 L ${viewportScreenBounds.w} ${viewportScreenBounds.h} L 0 ${viewportScreenBounds.h} Z`;

  return (
    <>
      <SVGContainer className="PageOverlayScreen-screen">
        <path d={`${viewportPath} ${relevantPageBounds.map(pathForPageBounds).join(" ")}`} fillRule="evenodd" />
      </SVGContainer>
      {relevantPageBounds.map((bounds, i) => (
        <div
          key={i}
          className="PageOverlayScreen-outline"
          style={{
            width: bounds.w,
            height: bounds.h,
            transform: `translate(${bounds.x}px, ${bounds.y}px)`,
          }}
        />
      ))}
    </>
  );
});
