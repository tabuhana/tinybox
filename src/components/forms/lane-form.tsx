"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GripVertical, PencilLine, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { upsertLane } from "@/lib/queries";
import { LaneFormSchema, type Lane } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type LaneFormValues = z.infer<typeof LaneFormSchema>;

type LaneFormProps = {
  pipelineId: string;
  lane?: Lane | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerClassName?: string;
  onSaved?: (lane: Lane) => void;
};

export function LaneForm({
  pipelineId,
  lane,
  open: openProp,
  onOpenChange,
  showTrigger = true,
  triggerLabel,
  triggerVariant = "outline",
  triggerClassName,
  onSaved,
}: LaneFormProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isEditing = Boolean(lane);

  const defaultValues = useMemo<LaneFormValues>(
    () => ({
      name: lane?.name ?? "",
      order: lane?.order ?? 0,
      pipelineId,
    }),
    [lane?.name, lane?.order, pipelineId],
  );

  const form = useForm<LaneFormValues>({
    resolver: zodResolver(LaneFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form, open]);

  const handleSubmit = (values: LaneFormValues) => {
    startTransition(async () => {
      try {
        const savedLane = await upsertLane({
          id: lane?.id,
          name: values.name.trim(),
          pipelineId,
          order: lane?.order,
        });

        if (!savedLane) {
          throw new Error("Lane not returned from server action");
        }

        toast.success(isEditing ? "Lane updated" : "Lane created", {
          description: isEditing
            ? `${savedLane.name} has been refreshed.`
            : `${savedLane.name} is ready for tickets.`,
        });

        onSaved?.(savedLane);
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error(isEditing ? "Could not update lane" : "Could not create lane", {
          description: "Please try again in a moment.",
        });
      }
    });
  };

  return (
    <>
      {showTrigger ? (
        <Button variant={triggerVariant} className={triggerClassName} onClick={() => setOpen(true)}>
          {isEditing ? <PencilLine className="size-4" /> : <Plus className="size-4" />}
          {triggerLabel ?? (isEditing ? "Edit lane" : "Add lane")}
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl border border-border/60 bg-card/95 p-0 backdrop-blur">
          <div className="border-b border-border/60 bg-linear-to-br from-primary/10 via-background to-background px-6 py-6">
            <DialogHeader className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Lane setup
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-semibold tracking-tight">
                  {isEditing ? "Adjust lane details" : "Add a new lane"}
                </DialogTitle>
                <DialogDescription className="max-w-md text-sm leading-6">
                  {isEditing
                    ? "Keep stage names crisp so the board reads clearly at a glance."
                    : "Create the next checkpoint in your pipeline flow."}
                </DialogDescription>
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="lane-name">Lane name</Label>
              <div className="relative">
                <GripVertical className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="lane-name"
                  placeholder="Qualified"
                  className="pl-9"
                  disabled={isPending}
                  aria-invalid={Boolean(form.formState.errors.name)}
                  {...form.register("name")}
                />
              </div>
              {form.formState.errors.name ? (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Examples: New lead, Proposal sent, Negotiation, Won.
                </p>
              )}
            </div>

            <DialogFooter className="border-t border-border/60 pt-5" showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                    ? "Save lane"
                    : "Create lane"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
