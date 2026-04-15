"use client";

import type { EditorElement } from "@/stores/editor-store";

type PaymentFormComponentProps = {
  element: EditorElement;
};

export function PaymentFormComponent({
  element,
}: PaymentFormComponentProps) {
  return (
    <div style={element.styles as React.CSSProperties}>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-inherit">
          {element.props.heading || "Complete your order"}
        </h3>
        <p className="text-sm text-white/70">
          {element.props.description ||
            "Present a secure checkout summary and payment inputs."}
        </p>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/70">
          Card number
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/70">
            Expiry
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/70">
            CVC
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-medium text-slate-950"
        >
          {element.props.buttonText || "Pay now"}
        </button>
      </div>
    </div>
  );
}
