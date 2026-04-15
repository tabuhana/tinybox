"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Globe2, MapPinned, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useTransition, type ComponentProps } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateAgencyDetails, upsertAgency } from "@/lib/queries";
import type { Agency } from "@/lib/types";

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
import { Switch } from "@/components/ui/switch";

const agencyDetailsSchema = z.object({
  name: z.string().min(2, "Agency name must be at least 2 characters."),
  companyEmail: z.email("Enter a valid company email."),
  companyPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  whiteLabel: z.boolean(),
});

type AgencyDetailsValues = z.infer<typeof agencyDetailsSchema>;

type AgencyDetailsProps = {
  data?: Agency | null;
};

type FieldProps = {
  id: keyof AgencyDetailsValues;
  label: string;
  placeholder: string;
  type?: ComponentProps<typeof Input>["type"];
  register: ReturnType<typeof useForm<AgencyDetailsValues>>["register"];
  error?: string;
  disabled: boolean;
};

function normalizeString(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

function Field({
  id,
  label,
  placeholder,
  type = "text",
  register,
  error,
  disabled,
}: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        {...register(id)}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function AgencyDetails({ data }: AgencyDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaults = useMemo<AgencyDetailsValues>(
    () => ({
      name: data?.name ?? "",
      companyEmail: data?.companyEmail ?? "",
      companyPhone: data?.companyPhone ?? "",
      address: data?.address ?? "",
      city: data?.city ?? "",
      state: data?.state ?? "",
      zipCode: data?.zipCode ?? "",
      country: data?.country ?? "",
      whiteLabel: data?.whiteLabel ?? false,
    }),
    [data],
  );

  const form = useForm<AgencyDetailsValues>({
    resolver: zodResolver(agencyDetailsSchema),
    defaultValues: defaults,
  });

  const title = data ? "Agency settings" : "Create your agency";
  const description = data
    ? "Refine your agency profile, contact details, and white-label preferences."
    : "Set the foundation for your workspace with the details your team and clients will see first.";

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (data) {
          await updateAgencyDetails(data.id, {
            name: values.name,
            companyEmail: values.companyEmail,
            companyPhone: normalizeString(values.companyPhone),
            address: normalizeString(values.address),
            city: normalizeString(values.city),
            state: normalizeString(values.state),
            zipCode: normalizeString(values.zipCode),
            country: normalizeString(values.country),
            whiteLabel: values.whiteLabel,
          });

          toast.success("Agency details updated.");
          router.refresh();
          return;
        }

        const agency = await upsertAgency({
          id: crypto.randomUUID(),
          name: values.name,
          agencyLogo: null,
          companyEmail: values.companyEmail,
          companyPhone: normalizeString(values.companyPhone),
          whiteLabel: values.whiteLabel,
          address: normalizeString(values.address),
          city: normalizeString(values.city),
          zipCode: normalizeString(values.zipCode),
          state: normalizeString(values.state),
          country: normalizeString(values.country),
          goal: null,
          icon: "box",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        toast.success("Agency created.");
        router.push(`/agency/${agency.id}`);
      } catch (error) {
        console.error(error);
        const message =
          error instanceof Error
            ? error.message
            : data
              ? "Failed to update agency."
              : "Failed to create agency.";
        toast.error(message);
      }
    });
  });

  const errors = form.formState.errors;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Card className="border border-border/60 bg-card/90 shadow-xl shadow-primary/5 backdrop-blur">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Agency profile
              </div>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6">
                {description}
              </CardDescription>
            </div>
            <div className="grid gap-2 rounded-3xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                A polished foundation for your agency workspace
              </div>
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4" />
                White-label ready settings
              </div>
              <div className="flex items-center gap-2">
                <MapPinned className="h-4 w-4" />
                Structured contact and location details
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="space-y-8" onSubmit={onSubmit}>
            <section className="grid gap-4 md:grid-cols-2">
              <Field
                id="name"
                label="Agency name"
                placeholder="Tinybox Creative"
                register={form.register}
                error={errors.name?.message}
                disabled={isPending}
              />
              <Field
                id="companyEmail"
                label="Company email"
                placeholder="hello@tinybox.dev"
                type="email"
                register={form.register}
                error={errors.companyEmail?.message}
                disabled={isPending}
              />
              <Field
                id="companyPhone"
                label="Phone"
                placeholder="+1 (555) 010-2026"
                register={form.register}
                error={errors.companyPhone?.message}
                disabled={isPending}
              />
              <div className="grid gap-2 rounded-3xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="whiteLabel">White label</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable client-facing branding options for a more tailored experience.
                    </p>
                  </div>
                  <Controller
                    name="whiteLabel"
                    control={form.control}
                    render={({ field }) => (
                      <Switch
                        id="whiteLabel"
                        checked={field.value}
                        disabled={isPending}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
                {errors.whiteLabel?.message ? (
                  <p className="text-sm text-destructive">{errors.whiteLabel.message}</p>
                ) : null}
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-medium">Location and contact</h3>
                <p className="text-sm text-muted-foreground">
                  This information appears throughout your agency workspace and future client touchpoints.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field
                    id="address"
                    label="Address"
                    placeholder="123 North Avenue"
                    register={form.register}
                    error={errors.address?.message}
                    disabled={isPending}
                  />
                </div>
                <Field
                  id="city"
                  label="City"
                  placeholder="San Francisco"
                  register={form.register}
                  error={errors.city?.message}
                  disabled={isPending}
                />
                <Field
                  id="state"
                  label="State / region"
                  placeholder="California"
                  register={form.register}
                  error={errors.state?.message}
                  disabled={isPending}
                />
                <Field
                  id="zipCode"
                  label="ZIP / postal code"
                  placeholder="94107"
                  register={form.register}
                  error={errors.zipCode?.message}
                  disabled={isPending}
                />
                <Field
                  id="country"
                  label="Country"
                  placeholder="United States"
                  register={form.register}
                  error={errors.country?.message}
                  disabled={isPending}
                />
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Logo upload is not available yet because the current agency schema does not include a logo field.
              </p>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? data
                    ? "Saving changes..."
                    : "Creating agency..."
                  : data
                    ? "Save changes"
                    : "Create agency"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
