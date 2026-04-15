"use client";

import type { EditorElement } from "@/stores/editor-store";

type VideoComponentProps = {
  element: EditorElement;
};

export function VideoComponent({ element }: VideoComponentProps) {
  const src = element.props.src?.trim();
  const poster = element.props.poster?.trim();

  return (
    <div style={element.styles as React.CSSProperties}>
      {src ? (
        <video className="h-full min-h-[220px] w-full object-cover" controls poster={poster || undefined}>
          <source src={src} />
          Your browser does not support embedded video playback.
        </video>
      ) : (
        <div className="flex min-h-[220px] items-center justify-center bg-slate-950/90 px-6 text-center text-sm text-slate-200">
          Add a hosted MP4 or video URL in the properties panel.
        </div>
      )}
    </div>
  );
}
