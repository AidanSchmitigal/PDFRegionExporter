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

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const letterPaperRatio = 8.5 / 11;
    const boxesNeeded = Math.ceil(bounds.height / (bounds.width / letterPaperRatio));

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          outline: "2px solid black",
          position: "relative",
        }}>
        <div
          style={{
            position: "absolute",
            top: "-1.2rem",
            left: "-2px",
            width: "100%",
          }}>
          <div
            style={{
              background: "black",
              color: "white",
              padding: "0.1rem",
              fontSize: "0.5rem",
              borderRadius: "0.5rem 0.5rem 0.5rem 0",
              width: "fit-content",
              whiteSpace: "nowrap",
            }}>
            {shape.id}
          </div>
        </div>
        {Array.from({ length: boxesNeeded }, (_, i) => (
          <div
            key={i}
            style={{
              width: "100%",
              aspectRatio: `${letterPaperRatio}`,
              outline: "2px dashed black",
            }}></div>
        ))}
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
