"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, PencilLine, Phone, Plus, Sparkles, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { saveActivityLogsNotification, upsertContact } from "@/lib/queries";
import { ContactUserFormSchema, type Contact } from "@/lib/types";

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

type ContactFormValues = z.output<typeof ContactUserFormSchema>;
type ContactFormInput = z.input<typeof ContactUserFormSchema>;

type ContactFormProps = {
  agencyId: string;
  contact?: Contact | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerClassName?: string;
  onSaved?: (contact: Contact) => void;
};

export function ContactForm({
  agencyId,
  contact,
  open: openProp,
  onOpenChange,
  showTrigger = true,
  triggerLabel,
  triggerVariant = "default",
  triggerClassName,
  onSaved,
}: ContactFormProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isEditing = Boolean(contact);

  const defaultValues = useMemo<ContactFormValues>(
    () => ({
      name: contact?.name ?? "",
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      agencyId,
    }),
    [agencyId, contact?.email, contact?.name, contact?.phone],
  );

  const form = useForm<ContactFormInput, unknown, ContactFormValues>({
    resolver: zodResolver(ContactUserFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form, open]);

  const handleSubmit = (values: ContactFormValues) => {
    startTransition(async () => {
      try {
        const savedContact = await upsertContact({
          id: contact?.id,
          name: values.name.trim(),
          email: values.email?.trim() || null,
          phone: values.phone?.trim() || null,
          agencyId,
        });

        if (!savedContact) {
          throw new Error("Contact not returned from server action");
        }

        await saveActivityLogsNotification({
          agencyId,
          description: isEditing
            ? `Updated contact ${savedContact.name}.`
            : `Created contact ${savedContact.name}.`,
        });

        toast.success(isEditing ? "Contact updated" : "Contact created", {
          description: isEditing
            ? `${savedContact.name}'s details are now up to date.`
            : `${savedContact.name} is ready for your outreach flows.`,
        });

        onSaved?.(savedContact);
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error(isEditing ? "Could not update contact" : "Could not create contact", {
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
          {triggerLabel ?? (isEditing ? "Edit contact" : "Create contact")}
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl border border-border/60 bg-card/95 p-0 backdrop-blur">
          <div className="border-b border-border/60 bg-linear-to-br from-primary/10 via-background to-background px-6 py-6">
            <DialogHeader className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Contact profile
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-semibold tracking-tight">
                  {isEditing ? "Update contact details" : "Create a contact"}
                </DialogTitle>
                <DialogDescription className="max-w-md text-sm leading-6">
                  Capture clean details now so tickets, funnels, and automations have reliable
                  customer data.
                </DialogDescription>
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="contact-name"
                  placeholder="Morgan Lee"
                  className="pl-9"
                  disabled={isPending}
                  aria-invalid={Boolean(form.formState.errors.name)}
                  {...form.register("name")}
                />
              </div>
              {form.formState.errors.name ? (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="morgan@example.com"
                  className="pl-9"
                  disabled={isPending}
                  aria-invalid={Boolean(form.formState.errors.email)}
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="contact-phone"
                  placeholder="+1 555 123 4567"
                  className="pl-9"
                  disabled={isPending}
                  {...form.register("phone")}
                />
              </div>
            </div>

            <DialogFooter className="border-t border-border/60 pt-5" showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                    ? "Save contact"
                    : "Create contact"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
