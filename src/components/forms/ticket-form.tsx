"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeDollarSign,
  CircleUserRound,
  FolderKanban,
  Search,
  Sparkles,
  Tag as TagIcon,
  Ticket as TicketIcon,
  UserRoundSearch,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { searchContacts, upsertTicket } from "@/lib/queries";
import {
  TicketFormSchema,
  type Contact,
  type Lane,
  type Tag,
  type TicketWithRelations,
  type User,
} from "@/lib/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const unassignedUserValue = "unassigned";

type TicketFormValues = z.infer<typeof TicketFormSchema>;

type TicketFormProps = {
  agencyId: string;
  lanes: Lane[];
  tags: Tag[];
  teamMembers: User[];
  ticket?: TicketWithRelations | null;
  defaultLaneId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerClassName?: string;
  onSaved?: (ticket: TicketWithRelations) => void;
};

function normalizeNullableString(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

function initials(name?: string | null) {
  const parts = (name ?? "")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "CU";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function tagTone(color?: string | null) {
  if (!color) {
    return undefined;
  }

  return {
    backgroundColor: `${color}18`,
    borderColor: `${color}33`,
    color,
  };
}

export function TicketForm({
  agencyId,
  lanes,
  tags,
  teamMembers,
  ticket,
  defaultLaneId,
  open: openProp,
  onOpenChange,
  showTrigger = true,
  triggerLabel,
  triggerVariant = "outline",
  triggerClassName,
  onSaved,
}: TicketFormProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<Contact[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Contact | null>(ticket?.customer ?? null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(ticket?.tags.map((tag) => tag.id) ?? []);

  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isEditing = Boolean(ticket);

  const defaultValues = useMemo<TicketFormValues>(
    () => ({
      name: ticket?.name ?? "",
      description: ticket?.description ?? "",
      value: ticket?.value ?? "",
      laneId: ticket?.laneId ?? defaultLaneId ?? lanes[0]?.id ?? "",
      customerId: ticket?.customerId ?? undefined,
      assignedUserId: ticket?.assignedUserId ?? undefined,
    }),
    [
      defaultLaneId,
      lanes,
      ticket?.assignedUserId,
      ticket?.customerId,
      ticket?.description,
      ticket?.laneId,
      ticket?.name,
      ticket?.value,
    ],
  );

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(TicketFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
    setSelectedTagIds(ticket?.tags.map((tag) => tag.id) ?? []);
    setSelectedCustomer(ticket?.customer ?? null);
    setCustomerQuery("");
    setCustomerResults([]);
  }, [defaultValues, form, open, ticket]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const trimmed = customerQuery.trim();

    if (!trimmed) {
      setCustomerResults([]);
      setIsSearchingCustomers(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearchingCustomers(true);

      try {
        const results = await searchContacts(trimmed);
        setCustomerResults(results.filter((contact) => contact.agencyId === agencyId));
      } catch (error) {
        console.error(error);
        toast.error("Could not search contacts", {
          description: "Please try again in a moment.",
        });
      } finally {
        setIsSearchingCustomers(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [agencyId, customerQuery, open]);

  const selectedTags = useMemo(
    () => tags.filter((tag) => selectedTagIds.includes(tag.id)),
    [selectedTagIds, tags],
  );

  const handleTagToggle = (tagId: string, checked: boolean) => {
    setSelectedTagIds((current) =>
      checked ? [...current, tagId] : current.filter((existingId) => existingId !== tagId),
    );
  };

  const handleCustomerSelect = (contact: Contact) => {
    setSelectedCustomer(contact);
    setCustomerQuery("");
    setCustomerResults([]);
    form.setValue("customerId", contact.id, { shouldDirty: true, shouldValidate: true });
  };

  const handleCustomerClear = () => {
    setSelectedCustomer(null);
    form.setValue("customerId", undefined, { shouldDirty: true, shouldValidate: true });
  };

  const handleSubmit = (values: TicketFormValues) => {
    startTransition(async () => {
      try {
        const laneChanged = ticket ? values.laneId !== ticket.laneId : false;

        const savedTicket = await upsertTicket(
          {
            id: ticket?.id,
            name: values.name.trim(),
            laneId: values.laneId,
            order: ticket && !laneChanged ? ticket.order : undefined,
            value: normalizeNullableString(values.value ?? undefined) ?? undefined,
            description: normalizeNullableString(values.description ?? undefined) ?? undefined,
            customerId: selectedCustomer?.id ?? undefined,
            assignedUserId:
              values.assignedUserId && values.assignedUserId !== unassignedUserValue
                ? values.assignedUserId
                : undefined,
          },
          selectedTags,
        );

        if (!savedTicket) {
          throw new Error("Ticket not returned from server action");
        }

        toast.success(isEditing ? "Ticket updated" : "Ticket created", {
          description: isEditing
            ? `${savedTicket.name} is back on the board.`
            : `${savedTicket.name} has been added to the pipeline.`,
        });

        onSaved?.(savedTicket as TicketWithRelations);
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error(isEditing ? "Could not update ticket" : "Could not create ticket", {
          description: "Please try again in a moment.",
        });
      }
    });
  };

  return (
    <>
      {showTrigger ? (
        <Button variant={triggerVariant} className={triggerClassName} onClick={() => setOpen(true)}>
          <TicketIcon className="size-4" />
          {triggerLabel ?? (isEditing ? "Edit ticket" : "Add ticket")}
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden border border-border/60 bg-card/95 p-0 backdrop-blur">
          <div className="border-b border-border/60 bg-linear-to-br from-primary/10 via-background to-background px-6 py-6">
            <DialogHeader className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Ticket editor
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-semibold tracking-tight">
                  {isEditing ? "Refine ticket details" : "Create a new ticket"}
                </DialogTitle>
                <DialogDescription className="max-w-2xl text-sm leading-6">
                  Capture the ticket name, value, ownership, and context so every lane tells a
                  clearer story.
                </DialogDescription>
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex max-h-[calc(92vh-132px)] flex-col">
            <div className="space-y-6 overflow-y-auto px-6 py-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="ticket-name">Ticket name</Label>
                  <div className="relative">
                    <TicketIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="ticket-name"
                      placeholder="Website redesign retainer"
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
                      Use a client-facing title the team can recognize instantly.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticket-value">Ticket value</Label>
                  <div className="relative">
                    <BadgeDollarSign className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="ticket-value"
                      inputMode="decimal"
                      placeholder="12000"
                      className="pl-9"
                      disabled={isPending}
                      {...form.register("value")}
                    />
                  </div>
                </div>

                <Controller
                  control={form.control}
                  name="laneId"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="ticket-lane">Lane</Label>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isPending}
                      >
                        <SelectTrigger id="ticket-lane" className="w-full justify-between">
                          <FolderKanban className="size-4 text-muted-foreground" />
                          <SelectValue placeholder="Select a lane" />
                        </SelectTrigger>
                        <SelectContent>
                          {lanes.map((laneOption) => (
                            <SelectItem key={laneOption.id} value={laneOption.id}>
                              {laneOption.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />

                <Controller
                  control={form.control}
                  name="assignedUserId"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="ticket-owner">Assigned user</Label>
                      <Select
                        value={field.value ?? unassignedUserValue}
                        onValueChange={(value) =>
                          field.onChange(value === unassignedUserValue ? undefined : value)
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger id="ticket-owner" className="w-full justify-between">
                          <CircleUserRound className="size-4 text-muted-foreground" />
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={unassignedUserValue}>Unassigned</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              <span className="flex items-center gap-2">
                                <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                                  {initials(member.name)}
                                </span>
                                {member.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket-description">Description</Label>
                <Textarea
                  id="ticket-description"
                  placeholder="Add deal notes, scope context, or handoff details."
                  disabled={isPending}
                  {...form.register("description")}
                />
              </div>

              <Separator />

              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticket-customer-search">Customer</Label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="ticket-customer-search"
                        value={customerQuery}
                        onChange={(event) => setCustomerQuery(event.target.value)}
                        placeholder="Search agency contacts"
                        className="pl-9"
                        disabled={isPending}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Search results come from your agency contact list.
                    </p>
                  </div>

                  {selectedCustomer ? (
                    <div className="rounded-[1.5rem] border border-border/60 bg-muted/25 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {selectedCustomer.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedCustomer.email || "No email on file"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCustomerClear}
                          disabled={isPending}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {customerQuery.trim() ? (
                    <div className="rounded-[1.5rem] border border-border/60 bg-background/80">
                      <ScrollArea className="max-h-56">
                        <div className="space-y-1 p-2">
                          {isSearchingCustomers ? (
                            <p className="px-3 py-3 text-sm text-muted-foreground">
                              Searching contacts...
                            </p>
                          ) : customerResults.length ? (
                            customerResults.map((contact) => (
                              <button
                                key={contact.id}
                                type="button"
                                className="flex w-full items-start justify-between rounded-[1rem] px-3 py-3 text-left transition hover:bg-muted"
                                onClick={() => handleCustomerSelect(contact)}
                              >
                                <span className="space-y-1">
                                  <span className="block text-sm font-medium text-foreground">
                                    {contact.name}
                                  </span>
                                  <span className="block text-xs text-muted-foreground">
                                    {contact.email || contact.phone || "No contact info"}
                                  </span>
                                </span>
                                <UserRoundSearch className="mt-0.5 size-4 text-muted-foreground" />
                              </button>
                            ))
                          ) : (
                            <p className="px-3 py-3 text-sm text-muted-foreground">
                              No contacts match that search.
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="items-center gap-2">
                      <TagIcon className="size-4 text-muted-foreground" />
                      Tags
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add tags to signal offer type, urgency, or internal routing.
                    </p>
                  </div>

                  {selectedTags.length ? (
                    <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-border/60 bg-muted/15 p-3">
                      {selectedTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="border"
                          style={tagTone(tag.color)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  <div className="rounded-[1.5rem] border border-border/60 bg-background/70">
                    <ScrollArea className="max-h-64">
                      <div className="space-y-2 p-3">
                        {tags.length ? (
                          tags.map((tag) => {
                            const checked = selectedTagIds.includes(tag.id);

                            return (
                              <label
                                key={tag.id}
                                className={cn(
                                  "flex cursor-pointer items-center justify-between gap-3 rounded-[1rem] border border-transparent px-3 py-3 transition hover:border-border/60 hover:bg-muted/40",
                                  checked ? "border-border/60 bg-muted/30" : undefined,
                                )}
                              >
                                <span className="flex items-center gap-3">
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(nextChecked) =>
                                      handleTagToggle(tag.id, nextChecked === true)
                                    }
                                  />
                                  <span className="space-y-1">
                                    <span className="block text-sm font-medium text-foreground">
                                      {tag.name}
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                      {tag.color || "No color set"}
                                    </span>
                                  </span>
                                </span>
                                <span
                                  className="size-3 rounded-full border border-border/60"
                                  style={{ backgroundColor: tag.color ?? "transparent" }}
                                />
                              </label>
                            );
                          })
                        ) : (
                          <p className="px-3 py-3 text-sm text-muted-foreground">
                            No tags exist for this agency yet.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border/60 px-6 py-5" showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                    ? "Save ticket"
                    : "Create ticket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
