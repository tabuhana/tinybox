"use client";

import type { EditorElement } from "@/stores/editor-store";

type ContactFormComponentProps = {
  element: EditorElement;
};

export function ContactFormComponent({
  element,
}: ContactFormComponentProps) {
  return (
    <div style={element.styles as React.CSSProperties}>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">{element.props.heading || "Stay in the loop"}</h3>
        <p className="text-sm text-muted-foreground">
          {element.props.description || "Collect leads with a quick opt-in form."}
        </p>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
          Name
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
          Email address
        </div>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          {element.props.buttonText || "Join the waitlist"}
        </button>
      </div>
    </div>
  );
}
