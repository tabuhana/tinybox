"use client";

import type { EditorElement } from "@/stores/editor-store";

type ImageComponentProps = {
  element: EditorElement;
};

export function ImageComponent({ element }: ImageComponentProps) {
  const src = element.props.src?.trim();

  return (
    <div className="overflow-hidden" style={element.styles as React.CSSProperties}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={element.props.alt || element.name}
          className="h-full min-h-[220px] w-full object-cover"
        />
      ) : (
        <div className="flex min-h-[220px] items-center justify-center bg-muted text-sm text-muted-foreground">
          Add an image URL in the properties panel.
        </div>
      )}
    </div>
  );
}
