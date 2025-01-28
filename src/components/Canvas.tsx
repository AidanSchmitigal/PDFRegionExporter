import { Geometry2d, HTMLContainer, RecordProps, Rectangle2d, ShapeUtil, T, TLBaseShape, TLResizeInfo, Tldraw, resizeBox, Box, DefaultToolbar, DefaultToolbarContent, TLComponents, TLUiAssetUrlOverrides, TLUiOverrides, TldrawUiMenuItem, useEditor, useIsToolSelected, useTools, useValue } from "tldraw";
import { useCallback } from "react";
import { exportRegions } from "../utils/export";
import { Download } from "lucide-react";
import { ScreenshotTool } from "./ScreenshotTool/ScreenshotTool";
import { ScreenshotDragging } from "./ScreenshotTool/Dragging";

import { CardShapeTool } from "./CardShape/CardShapeTool";
import { CardShapeUtil } from "./CardShape/CardShapeUtil";

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
};

const customAssetUrls: TLUiAssetUrlOverrides = {
  icons: {
    "tool-region": "/tool-region.svg",
  },
};

export function Canvas() {
  return (
    <div className="h-screen w-screen">
      <Tldraw
        // persistenceKey="tldraw_canvas3"
        tools={customTools}
        overrides={customUiOverrides}
        components={customComponents}
        shapeUtils={customShapeUtils}
        assetUrls={customAssetUrls}
      />
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
