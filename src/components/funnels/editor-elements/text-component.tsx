"use client";

import type { EditorElement } from "@/stores/editor-store";

type TextComponentProps = {
  element: EditorElement;
};

export function TextComponent({ element }: TextComponentProps) {
  return (
    <p className="min-h-6 whitespace-pre-wrap" style={element.styles as React.CSSProperties}>
      {element.props.text || "Add compelling copy here."}
    </p>
  );
}
