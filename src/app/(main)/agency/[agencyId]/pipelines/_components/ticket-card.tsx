"use client";

import { Draggable } from "@hello-pangea/dnd";
import { BriefcaseBusiness, GripVertical, Tag as TagIcon } from "lucide-react";
import { useState } from "react";

import type { Lane, Tag, TicketWithRelations, User } from "@/lib/types";

import { TicketForm } from "@/components/forms/ticket-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TicketCardProps = {
  agencyId: string;
  ticket: TicketWithRelations;
  index: number;
  lanes: Lane[];
  tags: Tag[];
  teamMembers: User[];
  onSaved: (ticket: TicketWithRelations) => void;
};

function initials(name?: string | null) {
  const parts = (name ?? "")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "UN";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function formatCurrency(value?: string | null) {
  const numeric = Number(value ?? 0);

  if (!Number.isFinite(numeric) || !value) {
    return "Value not set";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numeric);
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

export function TicketCard({
  agencyId,
  ticket,
  index,
  lanes,
  tags,
  teamMembers,
  onSaved,
}: TicketCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Draggable draggableId={ticket.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              "rounded-[1.6rem] border border-border/60 bg-card/95 shadow-sm shadow-primary/5 transition-transform",
              snapshot.isDragging ? "rotate-[1.2deg] shadow-xl shadow-primary/10" : undefined,
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex w-full flex-col gap-4 px-4 py-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="line-clamp-2 font-medium text-foreground">{ticket.name}</p>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground">
                    <GripVertical className="size-3.5" />
                    Drag ticket
                  </div>
                </div>
                <div className="rounded-full border border-border/60 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {formatCurrency(ticket.value)}
                </div>
              </div>

              {ticket.description ? (
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {ticket.description}
                </p>
              ) : null}

              {ticket.tags.length ? (
                <div className="flex flex-wrap gap-2">
                  {ticket.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="border"
                      style={tagTone(tag.color)}
                    >
                      <TagIcon className="size-3" />
                      {tag.name}
                    </Badge>
                  ))}
                  {ticket.tags.length > 3 ? (
                    <Badge variant="outline">+{ticket.tags.length - 3} more</Badge>
                  ) : null}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {ticket.customer?.name ?? "No customer linked"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ticket.customer?.email || ticket.customer?.phone || "Open ticket"}
                  </p>
                </div>

                {ticket.assignedUser ? (
                  <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2 py-1">
                    <Avatar size="sm">
                      <AvatarImage
                        src={ticket.assignedUser.avatarUrl ?? undefined}
                        alt={ticket.assignedUser.name}
                      />
                      <AvatarFallback>{initials(ticket.assignedUser.name)}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-24 truncate text-xs font-medium text-foreground">
                      {ticket.assignedUser.name}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border/70 px-2.5 py-1 text-xs text-muted-foreground">
                    <BriefcaseBusiness className="size-3.5" />
                    Unassigned
                  </div>
                )}
              </div>
            </button>
          </div>
        )}
      </Draggable>

      <TicketForm
        agencyId={agencyId}
        ticket={ticket}
        lanes={lanes}
        tags={tags}
        teamMembers={teamMembers}
        open={open}
        onOpenChange={setOpen}
        showTrigger={false}
        onSaved={onSaved}
      />
    </>
  );
}
