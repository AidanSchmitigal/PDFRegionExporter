import { useState } from "react";
import { HTMLContainer, Rectangle2d, ShapeUtil, TLResizeInfo, getDefaultColorTheme, resizeBox, DefaultColorStyle, RecordProps, T, TLBaseShape, TLDefaultColorStyle } from "tldraw";

export const cardShapeProps: RecordProps<ICardShape> = {
  w: T.number,
  h: T.number,
  color: DefaultColorStyle,
};

export type ICardShape = TLBaseShape<
  "card",
  {
    w: number;
    h: number;
    color: TLDefaultColorStyle;
  }
>;

export class CardShapeUtil extends ShapeUtil<ICardShape> {
  static override type = "card" as const;
  static override props = cardShapeProps;

  override isAspectRatioLocked(_shape: ICardShape) {
    return false;
  }
  override canResize(_shape: ICardShape) {
    return true;
  }

  getDefaultProps(): ICardShape["props"] {
    return {
      w: 300,
      h: 300,
      color: "blue",
    };
  }

  getGeometry(shape: ICardShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  component(shape: ICardShape) {
    const bounds = this.editor.getShapeGeometry(shape).bounds;
    const theme = getDefaultColorTheme({ isDarkMode: this.editor.user.getIsDarkMode() });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [count, setCount] = useState(0);

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          border: "1px solid black",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "all",
          backgroundColor: theme[shape.props.color].semi,
          color: theme[shape.props.color].solid,
        }}>
        <h2>Clicks: {count}</h2>
        <button onClick={() => setCount((count) => count + 1)} onPointerDown={(e) => e.stopPropagation()}>
          {bounds.w.toFixed()}x{bounds.h.toFixed()}
        </button>
      </HTMLContainer>
    );
  }

  indicator(shape: ICardShape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }

  override onResize(shape: ICardShape, info: TLResizeInfo<ICardShape>) {
    return resizeBox(shape, info);
  }
}
