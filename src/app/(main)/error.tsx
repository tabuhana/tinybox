"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-border/60 bg-card/90 p-8 text-center shadow-xl shadow-primary/5 backdrop-blur">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred while loading this page."}
          </p>
          {error.digest ? (
            <p className="text-xs text-muted-foreground">Ref: {error.digest}</p>
          ) : null}
        </div>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
