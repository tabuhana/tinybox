"use client";

import type { EditorElement } from "@/stores/editor-store";

type LinkComponentProps = {
  element: EditorElement;
};

export function LinkComponent({ element }: LinkComponentProps) {
  return (
    <a
      href={element.props.href || "#"}
      className="no-underline"
      style={element.styles as React.CSSProperties}
    >
      {element.props.text || "Call to action"}
    </a>
  );
}
