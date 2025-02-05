import { Geometry2d, HTMLContainer, RecordProps, Rectangle2d, ShapeUtil, T, TLBaseShape, TLResizeInfo, Tldraw, resizeBox, Box, DefaultToolbar, DefaultToolbarContent, TLComponents, TLUiAssetUrlOverrides, TLUiOverrides, TldrawUiMenuItem, useEditor, useIsToolSelected, useTools, useValue, Editor, TLShapePartial, TLImageShape, sortByIndex, getIndicesBetween } from "tldraw";
import { useCallback, useMemo, useState } from "react";
import { exportRegions } from "../utils/export";
import { Download } from "lucide-react";
import { ScreenshotTool } from "./ScreenshotTool/ScreenshotTool";
import { ScreenshotDragging } from "./ScreenshotTool/Dragging";
import { CardShapeTool } from "./CardShape/CardShapeTool";
import { CardShapeUtil } from "./CardShape/CardShapeUtil";

import { PageOverlayScreen } from "./PDF/PdfEditor";
import { Pdf, PdfPicker } from "./PDF/PdfPicker";
import { ExportPdfButton } from "./PDF/ExportButton";

// Register custom shape
const customShapeUtils = [CardShapeUtil];
const customTools = [ScreenshotTool, CardShapeTool];

const customUiOverrides: TLUiOverrides = {
  tools: (editor, tools) => {
    return {
      ...tools,
      screenshot: {
        id: "screenshot",
        label: "Screenshot",
        icon: "tool-screenshot",
        kbd: "j",
        onSelect() {
          editor.setCurrentTool("screenshot");
        },
      },
      card: {
        id: "card",
        icon: "tool-region",
        label: "Card",
        kbd: "c",
        onSelect: () => {
          editor.setCurrentTool("card");
        },
      },
    };
  },
};

function CustomToolbar() {
  const tools = useTools();
  const isScreenshotSelected = useIsToolSelected(tools["screenshot"]);
  const isCardSelected = useIsToolSelected(tools["card"]);
  return (
    <DefaultToolbar>
      <TldrawUiMenuItem {...tools["screenshot"]} isSelected={isScreenshotSelected} />
      <TldrawUiMenuItem {...tools["card"]} isSelected={isCardSelected} />
      <DefaultToolbarContent />
    </DefaultToolbar>
  );
}

function ScreenshotBox() {
  const editor = useEditor();

  const screenshotBrush = useValue(
    "screenshot brush",
    () => {
      // Check whether the screenshot tool (and its dragging state) is active
      if (editor.getPath() !== "screenshot.dragging") return null;

      // Get screenshot.dragging state node
      const draggingState = editor.getStateDescendant<ScreenshotDragging>("screenshot.dragging")!;

      // Get the box from the screenshot.dragging state node
      const box = draggingState.screenshotBox.get();

      const zoomLevel = editor.getZoomLevel();
      const { x, y } = editor.pageToViewport({ x: box.x, y: box.y });

      return new Box(x, y, box.w * zoomLevel, box.h * zoomLevel);
    },
    [editor]
  );

  if (!screenshotBrush) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        transform: `translate(${screenshotBrush.x}px, ${screenshotBrush.y}px)`,
        width: screenshotBrush.w,
        height: screenshotBrush.h,
        border: "1px solid var(--color-text-0)",
        zIndex: 999,
      }}
    />
  );
}

const customComponents: TLComponents = {
  InFrontOfTheCanvas: ScreenshotBox,
  Toolbar: CustomToolbar,
  // SharePanel: ExportButton,
  // InFrontOfTheCanvas: () => <PageOverlayScreen pdf={pdf} />,
  SharePanel: () => <ExportPdfButton pdf={undefined} />,
};

const customAssetUrls: TLUiAssetUrlOverrides = {
  icons: {
    "tool-region": "/tool-region.svg",
  },
};

export function Canvas() {
  const [pdfs, setPdfs] = useState<Pdf[]>([]);

  // const overlay = useMemo(() => <PageOverlayScreen pdfs={pdfs} />, [pdfs]);

  const [editor, setEditor] = useState<Editor | null>(null);

  if (editor != null) {
    console.log("re running editor fucntions");
    // Calculate horizontal offset for each PDF
    const pdfOffsets = pdfs.reduce((acc, _pdf, index) => {
      const previousWidth = index > 0 ? pdfs[index - 1].pages[0].bounds.w + 100 : 0; // 100px gap between PDFs
      acc[index] = {
        x: index === 0 ? 0 : acc[index - 1].x + previousWidth,
        y: 0,
      };
      return acc;
    }, {} as Record<number, { x: number; y: number }>);

    // Create assets and shapes for all PDFs
    pdfs.forEach((pdf, pdfIndex) => {
      editor.createAssets(
        pdf.pages.map((page) => ({
          id: page.assetId,
          typeName: "asset",
          type: "image",
          meta: {},
          props: {
            w: page.bounds.w,
            h: page.bounds.h,
            mimeType: "image/png",
            src: page.src,
            name: `pdf-${pdfIndex}-page`,
            isAnimated: false,
          },
        }))
      );

      editor.createShapes(
        pdf.pages.map(
          (page): TLShapePartial<TLImageShape> => ({
            id: page.shapeId,
            type: "image",
            x: page.bounds.x + pdfOffsets[pdfIndex].x,
            y: page.bounds.y + pdfOffsets[pdfIndex].y,
            isLocked: true,
            props: {
              assetId: page.assetId,
              w: page.bounds.w,
              h: page.bounds.h,
            },
          })
        )
      );
    });

    // Create set of all shape IDs across all PDFs
    const allShapeIds = pdfs.flatMap((pdf) => pdf.pages.map((page) => page.shapeId));
    const shapeIdSet = new Set(allShapeIds);

    // Make sure the shapes are below any of the other shapes
    const makeSureShapesAreAtBottom = () => {
      const shapes = allShapeIds.map((id) => editor.getShape(id)!).sort(sortByIndex);
      const pageId = editor.getCurrentPageId();

      const siblings = editor.getSortedChildIdsForParent(pageId);
      const currentBottomShapes = siblings.slice(0, shapes.length).map((id) => editor.getShape(id)!);

      if (currentBottomShapes.every((shape, i) => shape.id === shapes[i].id)) return;

      const otherSiblings = siblings.filter((id) => !shapeIdSet.has(id));
      const bottomSibling = otherSiblings[0];
      const lowestIndex = editor.getShape(bottomSibling)!.index;

      const indexes = getIndicesBetween(undefined, lowestIndex, shapes.length);
      editor.updateShapes(
        shapes.map((shape, i) => ({
          id: shape.id,
          type: shape.type,
          isLocked: shape.isLocked,
          index: indexes[i],
        }))
      );
    };

    // makeSureShapesAreAtBottom();
    editor.sideEffects.registerAfterCreateHandler("shape", makeSureShapesAreAtBottom);
    editor.sideEffects.registerAfterChangeHandler("shape", makeSureShapesAreAtBottom);

    // Don't let the user unlock the pages
    editor.sideEffects.registerBeforeChangeHandler("shape", (prev, next) => {
      if (!shapeIdSet.has(next.id)) return next;
      if (next.isLocked) return next;
      return { ...prev, isLocked: true };
    });

    // Calculate combined bounds for all PDFs
    const targetBounds = pdfs.reduce((acc, pdf) => {
      const pdfBounds = pdf.pages.reduce((pdfAcc, page) => pdfAcc.union(page.bounds), pdf.pages[0].bounds.clone());
      return acc ? acc.union(pdfBounds) : pdfBounds;
    }, null as Box | null)!;

    const isMobile = editor.getViewportScreenBounds().width < 840;
    editor.setCameraOptions({
      constraints: {
        bounds: targetBounds,
        padding: { x: isMobile ? 16 : 164, y: 64 },
        origin: { x: 0.5, y: 0 },
        initialZoom: "fit-x-100",
        baseZoom: "default",
        behavior: "free",
      },
    });
    editor.setCamera(editor.getCamera(), { reset: true });
  }

  return (
    <div>
      <PdfPicker onOpenPdf={(pdf) => setPdfs([...pdfs, pdf])} />
      <div>{pdfs.map((pdf) => pdf.name)}</div>
      {pdfs.length && (
        <div className="PdfEditor">
          {/* <PdfEditor pdfs={state} moreprops={{
            tools: customTools,
            overrides: customUiOverrides,
            components: customComponents,
            shapeUtils: customShapeUtils,
            assetUrls: customAssetUrls
          }} /> */}
          <Tldraw
            tools={customTools}
            overrides={customUiOverrides}
            components={customComponents}
            shapeUtils={customShapeUtils}
            assetUrls={customAssetUrls}
            onMount={(editor) => {
              setEditor(editor);
            }}>
            <PdfPicker onOpenPdf={(pdf) => console.log(pdf)} />
          </Tldraw>
        </div>
      )}
      {/* <div className="h-[75vh] w-screen">
        <Tldraw
          // persistenceKey="tldraw_canvas3"
          tools={customTools}
          overrides={customUiOverrides}
          components={customComponents}
          shapeUtils={customShapeUtils}
          assetUrls={customAssetUrls}
        />
      </div> */}
    </div>
  );
}

// function ExportButton() {
//   const editor = useEditor();

//   const handleExport = useCallback(async () => {
//     const shapes = editor.getCurrentPage().shapes;
//     await exportRegions(shapes);
//   }, [editor]);

//   return (
//     <button className="bg-white px-3 py-1 m-2 rounded shadow hover:bg-gray-50 flex items-center gap-2" onClick={handleExport}>
//       <Download size={16} />
//       Export
//     </button>
//   );
// }
