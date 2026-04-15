"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Globe2, ImageIcon, Settings2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { upsertFunnel } from "@/lib/queries";
import type { Funnel } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const funnelSettingsSchema = z.object({
  name: z.string().min(1, "Funnel name is required."),
  description: z.string().optional(),
  subDomainName: z.string().optional(),
  favicon: z.string().optional(),
});

type FunnelSettingsValues = z.infer<typeof funnelSettingsSchema>;

type FunnelSettingsProps = {
  agencyId: string;
  funnel: Funnel;
};

function normalizeString(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

export function FunnelSettings({ agencyId, funnel }: FunnelSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo<FunnelSettingsValues>(
    () => ({
      name: funnel.name,
      description: funnel.description ?? "",
      subDomainName: funnel.subDomainName ?? "",
      favicon: "",
    }),
    [funnel],
  );

  const form = useForm<FunnelSettingsValues>({
    resolver: zodResolver(funnelSettingsSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        const updatedFunnel = await upsertFunnel(
          agencyId,
          {
            name: values.name.trim(),
            description: normalizeString(values.description),
            published: funnel.published,
            subDomainName: normalizeString(values.subDomainName),
            liveProducts: funnel.liveProducts ?? "",
          },
          funnel.id,
        );

        if (!updatedFunnel) {
          throw new Error("Funnel not returned from server action");
        }

        toast.success("Funnel settings updated.");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Could not update funnel settings.", {
          description: "Please try again in a moment.",
        });
      }
    });
  });

  const errors = form.formState.errors;

  return (
    <Card className="border border-border/60 bg-card/90 shadow-xl shadow-primary/5 backdrop-blur">
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Funnel settings
            </div>
            <CardTitle className="text-2xl">Refine funnel details</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6">
              Update the core metadata that defines how this funnel is organized before you
              customize the actual page content in the editor flow.
            </CardDescription>
          </div>

          <div className="grid gap-2 rounded-3xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Settings2 className="h-4 w-4 text-primary" />
              Settings, pages, and publishing in one place
            </div>
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4" />
              Subdomain ready
            </div>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Favicon placeholder for a later schema update
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <form className="space-y-8" onSubmit={onSubmit}>
          <section className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="funnel-settings-name">Name</Label>
              <Input
                id="funnel-settings-name"
                placeholder="Spring Launch Funnel"
                aria-invalid={Boolean(errors.name)}
                disabled={isPending}
                {...form.register("name")}
              />
              {errors.name ? (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="funnel-settings-subdomain">Subdomain</Label>
              <Input
                id="funnel-settings-subdomain"
                placeholder="spring-launch"
                aria-invalid={Boolean(errors.subDomainName)}
                disabled={isPending}
                {...form.register("subDomainName")}
              />
              {errors.subDomainName ? (
                <p className="text-sm text-destructive">{errors.subDomainName.message}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This matches the public subdomain lookup used by published funnels.
                </p>
              )}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-2">
              <Label htmlFor="funnel-settings-description">Description</Label>
              <Textarea
                id="funnel-settings-description"
                placeholder="Describe the offer, audience, or conversion goal."
                aria-invalid={Boolean(errors.description)}
                disabled={isPending}
                {...form.register("description")}
              />
              {errors.description ? (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Helpful for internal team context while the funnel library grows.
                </p>
              )}
            </div>

            <div className="grid gap-2 rounded-[1.75rem] border border-border/60 bg-muted/20 p-4">
              <Label htmlFor="funnel-settings-favicon">Favicon</Label>
              <Input
                id="funnel-settings-favicon"
                placeholder="https://example.com/favicon.ico"
                disabled
                {...form.register("favicon")}
              />
              <p className="text-sm text-muted-foreground">
                Favicon upload is not wired yet because the current funnel schema does not include
                a favicon field.
              </p>
            </div>
          </section>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Published status is preserved automatically while you edit the funnel details here.
            </p>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving changes..." : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
