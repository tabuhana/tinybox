"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { submitFunnelContact } from "@/lib/queries";
import { useFunnelRuntime } from "@/components/funnels/funnel-runtime-context";
import type { EditorElement } from "@/stores/editor-store";

type ContactFormComponentProps = {
  element: EditorElement;
};

export function ContactFormComponent({ element }: ContactFormComponentProps) {
  const runtime = useFunnelRuntime();
  const live = runtime?.liveMode ?? false;
  const agencyId = runtime?.agencyId;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const heading = element.props.heading || "Stay in the loop";
  const description =
    element.props.description || "Collect leads with a quick opt-in form.";
  const buttonText = element.props.buttonText || "Join the waitlist";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!live || !agencyId) {
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    startTransition(async () => {
      try {
        await submitFunnelContact({ agencyId, name, email, phone });
        toast.success("Thanks for reaching out!");
        setName("");
        setEmail("");
        setPhone("");
        setSubmitted(true);
      } catch (error) {
        console.error(error);
        toast.error("Could not submit the form.");
      }
    });
  };

  if (live && submitted) {
    return (
      <div style={element.styles as React.CSSProperties}>
        <div className="space-y-2 text-center">
          <h3 className="text-xl font-semibold">Thank you!</h3>
          <p className="text-sm text-muted-foreground">
            We&apos;ll be in touch shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={element.styles as React.CSSProperties}>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">{heading}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
        <input
          name="name"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={!live || isPending}
          className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <input
          name="email"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={!live || isPending}
          className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <input
          name="phone"
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          disabled={!live || isPending}
          className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!live || isPending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {isPending ? "Submitting..." : buttonText}
        </button>
      </form>
    </div>
  );
}
