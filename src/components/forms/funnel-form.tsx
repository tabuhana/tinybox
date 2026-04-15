"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Globe2, PencilLine, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { upsertFunnel } from "@/lib/queries";
import { CreateFunnelFormSchema, type Funnel } from "@/lib/types";

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
import { Textarea } from "@/components/ui/textarea";

type FunnelFormValues = z.infer<typeof CreateFunnelFormSchema>;

type FunnelFormProps = {
  agencyId: string;
  funnel?: Funnel | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerClassName?: string;
  onSaved?: (funnel: Funnel) => void;
};

function normalizeString(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

export function FunnelForm({
  agencyId,
  funnel,
  open: openProp,
  onOpenChange,
  showTrigger = true,
  triggerLabel,
  triggerVariant = "default",
  triggerClassName,
  onSaved,
}: FunnelFormProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isEditing = Boolean(funnel);

  const defaultValues = useMemo<FunnelFormValues>(
    () => ({
      name: funnel?.name ?? "",
      description: funnel?.description ?? "",
      published: funnel?.published ?? false,
      subDomainName: funnel?.subDomainName ?? "",
      agencyId,
    }),
    [agencyId, funnel],
  );

  const form = useForm<FunnelFormValues>({
    resolver: zodResolver(CreateFunnelFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form, open]);

  const handleSubmit = (values: FunnelFormValues) => {
    startTransition(async () => {
      try {
        const savedFunnel = await upsertFunnel(
          agencyId,
          {
            name: values.name.trim(),
            description: normalizeString(values.description),
            published: values.published ?? false,
            subDomainName: normalizeString(values.subDomainName),
            liveProducts: funnel?.liveProducts ?? "",
          },
          funnel?.id ?? "",
        );

        if (!savedFunnel) {
          throw new Error("Funnel not returned from server action");
        }

        toast.success(isEditing ? "Funnel updated" : "Funnel created", {
          description: isEditing
            ? `${savedFunnel.name} settings were saved.`
            : `${savedFunnel.name} is ready for pages and publishing.`,
        });

        onSaved?.(savedFunnel);
        setOpen(false);
        form.reset({
          name: savedFunnel.name,
          description: savedFunnel.description ?? "",
          published: savedFunnel.published,
          subDomainName: savedFunnel.subDomainName ?? "",
          agencyId,
        });
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error(isEditing ? "Could not update funnel" : "Could not create funnel", {
          description: "Please try again in a moment.",
        });
      }
    });
  };

  const resolvedTriggerLabel =
    triggerLabel ?? (isEditing ? "Edit funnel" : "Create funnel");

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
        <DialogContent className="max-w-2xl border border-border/60 bg-card/95 p-0 backdrop-blur">
          <div className="border-b border-border/60 bg-linear-to-br from-primary/12 via-background to-background px-6 py-6">
            <DialogHeader className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Funnel
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-semibold tracking-tight">
                  {isEditing ? "Refine funnel details" : "Create a new funnel"}
                </DialogTitle>
                <DialogDescription className="max-w-lg text-sm leading-6">
                  {isEditing
                    ? "Update the offer details, subdomain, and messaging for this funnel."
                    : "Set up the high-level funnel details before adding pages and customizing the flow."}
                </DialogDescription>
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="funnel-name">Funnel name</Label>
              <Input
                id="funnel-name"
                placeholder="Spring Launch Funnel"
                disabled={isPending}
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
              {form.formState.errors.name ? (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Use a short internal name that helps your team identify the offer quickly.
                </p>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-2">
                <Label htmlFor="funnel-description">Description</Label>
                <Textarea
                  id="funnel-description"
                  placeholder="A short summary of the audience, offer, or conversion goal."
                  disabled={isPending}
                  aria-invalid={Boolean(form.formState.errors.description)}
                  {...form.register("description")}
                />
                {form.formState.errors.description ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 rounded-[1.5rem] border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Globe2 className="size-4 text-primary" />
                  Subdomain
                </div>
                <Input
                  id="funnel-subdomain"
                  placeholder="spring-launch"
                  disabled={isPending}
                  aria-invalid={Boolean(form.formState.errors.subDomainName)}
                  {...form.register("subDomainName")}
                />
                {form.formState.errors.subDomainName ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.subDomainName.message}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Save a subdomain now or come back later before publishing.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="border-t border-border/60 pt-5" showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                    ? "Save funnel"
                    : "Create funnel"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
