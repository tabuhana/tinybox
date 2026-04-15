"use client";

import { Droppable } from "@hello-pangea/dnd";
import {
  MoreHorizontal,
  PencilLine,
  Plus,
  Rows3,
  Ticket as TicketIcon,
  Trash2,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteLane } from "@/lib/queries";
import type { Lane, LaneWithRelations, Tag, TicketWithRelations, User } from "@/lib/types";

import { LaneForm } from "@/components/forms/lane-form";
import { TicketForm } from "@/components/forms/ticket-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { TicketCard } from "./ticket-card";

type LaneColumnProps = {
  agencyId: string;
  lane: LaneWithRelations;
  lanes: Lane[];
  tags: Tag[];
  teamMembers: User[];
  onLaneSaved: (lane: Lane) => void;
  onLaneDeleted: (laneId: string) => void;
  onTicketSaved: (ticket: TicketWithRelations) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function LaneColumn({
  agencyId,
  lane,
  lanes,
  tags,
  teamMembers,
  onLaneSaved,
  onLaneDeleted,
  onTicketSaved,
}: LaneColumnProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalValue = useMemo(
    () =>
      lane.tickets.reduce((sum, ticket) => {
        const numeric = Number(ticket.value ?? 0);
        return Number.isFinite(numeric) ? sum + numeric : sum;
      }, 0),
    [lane.tickets],
  );

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteLane(lane.id);
        toast.success("Lane deleted", {
          description: `${lane.name} has been removed from the pipeline.`,
        });
        setIsDeleteOpen(false);
        onLaneDeleted(lane.id);
      } catch (error) {
        console.error(error);
        toast.error("Could not delete lane", {
          description: "Please try again in a moment.",
        });
      }
    });
  };

  return (
    <>
      <div className="flex h-full min-h-[32rem] w-[22rem] shrink-0 flex-col rounded-[2rem] border border-border/60 bg-linear-to-b from-card via-card to-muted/10 shadow-lg shadow-primary/5">
        <div className="border-b border-border/60 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <Rows3 className="size-3.5 text-primary" />
                Stage {lane.order + 1}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {lane.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{lane.tickets.length} tickets</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span>{formatCurrency(totalValue)}</span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Open actions for ${lane.name}`}
                    disabled={isPending}
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                  <PencilLine className="size-4" />
                  Edit lane
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setIsDeleteOpen(true)}>
                  <Trash2 className="size-4" />
                  Delete lane
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Droppable droppableId={lane.id} type="ticket">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div
                className={`flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 ${
                  snapshot.isDraggingOver ? "bg-primary/5" : ""
                }`}
              >
                {lane.tickets.length ? (
                  lane.tickets.map((ticket, index) => (
                    <TicketCard
                      key={ticket.id}
                      agencyId={agencyId}
                      ticket={ticket}
                      index={index}
                      lanes={lanes}
                      tags={tags}
                      teamMembers={teamMembers}
                      onSaved={onTicketSaved}
                    />
                  ))
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-[1.6rem] border border-dashed border-border/70 bg-background/60 px-6 py-10 text-center">
                    <div className="space-y-2">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border/60 bg-muted/40">
                        <TicketIcon className="size-5 text-primary" />
                      </div>
                      <p className="font-medium text-foreground">No tickets in this lane yet</p>
                      <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                        Add the first opportunity here, then drag it across the board as it moves.
                      </p>
                    </div>
                  </div>
                )}
                {provided.placeholder}
              </div>

              <div className="border-t border-border/60 px-4 py-4">
                <Button
                  variant="secondary"
                  className="w-full justify-center"
                  onClick={() => setIsCreateTicketOpen(true)}
                >
                  <Plus className="size-4" />
                  Add ticket
                </Button>
              </div>
            </div>
          )}
        </Droppable>
      </div>

      <LaneForm
        pipelineId={lane.pipelineId}
        lane={lane}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        showTrigger={false}
        onSaved={onLaneSaved}
      />

      <TicketForm
        agencyId={agencyId}
        defaultLaneId={lane.id}
        lanes={lanes}
        tags={tags}
        teamMembers={teamMembers}
        open={isCreateTicketOpen}
        onOpenChange={setIsCreateTicketOpen}
        showTrigger={false}
        onSaved={onTicketSaved}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="size-7 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete lane</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-medium text-foreground">{lane.name}</span> and every
              ticket inside it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete lane"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
