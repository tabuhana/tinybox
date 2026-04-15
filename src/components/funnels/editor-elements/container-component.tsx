"use client";

import type { PropsWithChildren } from "react";

import type { EditorElement } from "@/stores/editor-store";

type ContainerComponentProps = PropsWithChildren<{
  element: EditorElement;
}>;

export function ContainerComponent({
  element,
  children,
}: ContainerComponentProps) {
  return (
    <section
      className="w-full"
      style={element.styles as React.CSSProperties}
    >
      {children}
    </section>
  );
}
