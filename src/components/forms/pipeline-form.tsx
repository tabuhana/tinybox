"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Database, PencilLine, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { upsertPipeline } from "@/lib/queries";
import { CreatePipelineFormSchema, type Pipeline } from "@/lib/types";

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

type PipelineFormValues = z.infer<typeof CreatePipelineFormSchema>;

type PipelineFormProps = {
  agencyId: string;
  pipeline?: Pipeline | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerClassName?: string;
  onSaved?: (pipeline: Pipeline) => void;
};

export function PipelineForm({
  agencyId,
  pipeline,
  open: openProp,
  onOpenChange,
  showTrigger = true,
  triggerLabel,
  triggerVariant = "default",
  triggerClassName,
  onSaved,
}: PipelineFormProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isEditing = Boolean(pipeline);

  const defaultValues = useMemo<PipelineFormValues>(
    () => ({
      name: pipeline?.name ?? "",
      agencyId,
    }),
    [agencyId, pipeline?.name],
  );

  const form = useForm<PipelineFormValues>({
    resolver: zodResolver(CreatePipelineFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form, open]);

  const handleSubmit = (values: PipelineFormValues) => {
    startTransition(async () => {
      try {
        const savedPipeline = await upsertPipeline({
          id: pipeline?.id,
          agencyId,
          name: values.name.trim(),
        });

        if (!savedPipeline) {
          throw new Error("Pipeline not returned from server action");
        }

        toast.success(isEditing ? "Pipeline updated" : "Pipeline created", {
          description: isEditing
            ? `${savedPipeline.name} is ready for the next stage changes.`
            : `${savedPipeline.name} is ready for lanes and tickets.`,
        });

        onSaved?.(savedPipeline);
        setOpen(false);
        form.reset({
          name: savedPipeline.name,
          agencyId,
        });
        router.push(`/agency/${agencyId}/pipelines/${savedPipeline.id}`);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error(isEditing ? "Could not update pipeline" : "Could not create pipeline", {
          description: "Please try again in a moment.",
        });
      }
    });
  };

  const resolvedTriggerLabel =
    triggerLabel ?? (isEditing ? "Edit pipeline" : "Create pipeline");

  return (
    <>
      {showTrigger ? (
        <Button
          variant={triggerVariant}
          className={triggerClassName}
          onClick={() => setOpen(true)}
        >
          {isEditing ? <PencilLine className="size-4" /> : <Plus className="size-4" />}
          {resolvedTriggerLabel}
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl border border-border/60 bg-card/95 p-0 backdrop-blur">
          <div className="border-b border-border/60 bg-linear-to-br from-primary/12 via-background to-background px-6 py-6">
            <DialogHeader className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Pipeline
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-semibold tracking-tight">
                  {isEditing ? "Refine pipeline details" : "Create a new pipeline"}
                </DialogTitle>
                <DialogDescription className="max-w-md text-sm leading-6">
                  {isEditing
                    ? "Rename the board so it matches the way your team tracks progress."
                    : "Spin up a fresh flow for a new offer, team, or operating motion."}
                </DialogDescription>
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="pipeline-name">Pipeline name</Label>
              <div className="relative">
                <Database className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="pipeline-name"
                  placeholder="Lead Cycle"
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
                  Keep it short and descriptive so the board is easy to spot in navigation.
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
                    ? "Save pipeline"
                    : "Create pipeline"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
