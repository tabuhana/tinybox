"use client";

import type { PropsWithChildren } from "react";

import type { EditorElement } from "@/stores/editor-store";

type TwoColumnsComponentProps = PropsWithChildren<{
  element: EditorElement;
}>;

export function TwoColumnsComponent({
  element,
  children,
}: TwoColumnsComponentProps) {
  return (
    <section className="w-full" style={element.styles as React.CSSProperties}>
      {children}
    </section>
  );
}
