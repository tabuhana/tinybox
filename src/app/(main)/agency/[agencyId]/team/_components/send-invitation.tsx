"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailPlus, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { sendInvitation } from "@/lib/queries";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const invitationRoleOptions = [
  {
    value: "AGENCY_ADMIN",
    label: "Agency Admin",
    description: "Can help manage team members and workspace operations.",
  },
  {
    value: "AGENCY_MEMBER",
    label: "Agency Member",
    description: "Core collaborator with shared workspace access.",
  },
  {
    value: "AGENCY_USER",
    label: "Agency User",
    description: "Basic access for day-to-day tasks and collaboration.",
  },
] as const;

const invitationSchema = z.object({
  email: z.email("Enter a valid email address."),
  role: z.enum(invitationRoleOptions.map((option) => option.value)),
});

type InvitationValues = z.infer<typeof invitationSchema>;

const defaultValues: InvitationValues = {
  email: "",
  role: "AGENCY_USER",
};

export function SendInvitation({ agencyId }: { agencyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<InvitationValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues,
  });

  const onSubmit = (values: InvitationValues) => {
    startTransition(async () => {
      try {
        await sendInvitation(values.role, values.email.trim().toLowerCase(), agencyId);
        toast.success("Invitation queued", {
          description: `An invite is ready for ${values.email.trim().toLowerCase()}.`,
        });
        setOpen(false);
        form.reset(defaultValues);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Could not send invitation", {
          description: "Please try again in a moment.",
        });
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <MailPlus className="size-4" />
        Invite teammate
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl border border-border/60 bg-card/95 p-0 backdrop-blur">
          <div className="border-b border-border/60 bg-linear-to-br from-primary/10 via-background to-background px-6 py-6">
            <DialogHeader className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                Team access
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-semibold tracking-tight">
                  Invite a new teammate
                </DialogTitle>
                <DialogDescription className="max-w-md text-sm leading-6">
                  Send access to a collaborator and assign the right level of agency
                  permissions before they join.
                </DialogDescription>
              </div>
            </DialogHeader>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 px-6 py-6"
          >
            <div className="space-y-2">
              <Label htmlFor="invitation-email">Email address</Label>
              <Input
                id="invitation-email"
                type="email"
                placeholder="teammate@example.com"
                disabled={isPending}
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Invitations are matched automatically when that user signs in.
                </p>
              )}
            </div>

            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="invitation-role">Role</Label>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <SelectTrigger id="invitation-role" className="w-full justify-between">
                      <SelectValue placeholder="Choose a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {invitationRoleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex flex-col items-start">
                            <span>{option.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.role ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.role.message}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Match the role to the level of workspace control they should get on
                      day one.
                    </p>
                  )}
                </div>
              )}
            />

            <DialogFooter className="border-t border-border/60 pt-5" showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Sending..." : "Send invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
