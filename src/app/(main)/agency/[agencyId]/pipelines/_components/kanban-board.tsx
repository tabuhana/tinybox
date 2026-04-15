"use client";

import type { DropResult } from "@hello-pangea/dnd";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { GripVertical, LoaderCircle, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { updateLanesOrder, updateTicketsOrder } from "@/lib/queries";
import type { Lane, LaneWithRelations, Tag, Ticket, TicketWithRelations, User } from "@/lib/types";

import { LaneForm } from "@/components/forms/lane-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { LaneColumn } from "./lane-column";

type KanbanBoardProps = {
  agencyId: string;
  pipelineId: string;
  initialLanes: LaneWithRelations[];
  tags: Tag[];
  teamMembers: User[];
};

function normalizeLaneOrders(lanes: LaneWithRelations[]) {
  return lanes.map((lane, index) => ({
    ...lane,
    order: index,
  }));
}

function normalizeTicketOrders(tickets: TicketWithRelations[], laneId: string) {
  return tickets.map((ticket, index) => ({
    ...ticket,
    laneId,
    order: index,
  }));
}

function sortTickets(tickets: TicketWithRelations[]) {
  return [...tickets].sort((left, right) => left.order - right.order);
}

function toLaneRecord(lane: LaneWithRelations): Lane {
  const { tickets, ...laneRecord } = lane;
  return laneRecord;
}

function toTicketRecord(ticket: TicketWithRelations): Ticket {
  const { assignedUser, customer, tags, ...ticketRecord } = ticket;
  return ticketRecord;
}

export function KanbanBoard({
  agencyId,
  pipelineId,
  initialLanes,
  tags,
  teamMembers,
}: KanbanBoardProps) {
  const [lanes, setLanes] = useState(() => normalizeLaneOrders(initialLanes));
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreateLaneOpen, setIsCreateLaneOpen] = useState(false);

  const laneOptions = useMemo(() => lanes.map(toLaneRecord), [lanes]);
  const ticketCount = useMemo(
    () => lanes.reduce((sum, lane) => sum + lane.tickets.length, 0),
    [lanes],
  );
  const totalValue = useMemo(
    () =>
      lanes.reduce(
        (sum, lane) =>
          sum +
          lane.tickets.reduce((laneSum, ticket) => {
            const numeric = Number(ticket.value ?? 0);
            return Number.isFinite(numeric) ? laneSum + numeric : laneSum;
          }, 0),
        0,
      ),
    [lanes],
  );

  const syncLaneOrder = async (
    nextLanes: LaneWithRelations[],
    previousLanes: LaneWithRelations[],
  ) => {
    setIsSyncing(true);

    try {
      await updateLanesOrder(nextLanes.map(toLaneRecord));
    } catch (error) {
      console.error(error);
      setLanes(previousLanes);
      toast.error("Could not save lane order", {
        description: "The board order has been restored.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const syncTicketOrder = async (
    nextLanes: LaneWithRelations[],
    previousLanes: LaneWithRelations[],
    changedTickets: TicketWithRelations[],
  ) => {
    setIsSyncing(true);

    try {
      await updateTicketsOrder(changedTickets.map(toTicketRecord));
    } catch (error) {
      console.error(error);
      setLanes(previousLanes);
      toast.error("Could not save ticket movement", {
        description: "The board has been restored to its previous order.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) {
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    if (type === "lane") {
      const previousLanes = lanes;
      const reordered = [...lanes];
      const [movedLane] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, movedLane);

      const normalized = normalizeLaneOrders(reordered);
      setLanes(normalized);
      void syncLaneOrder(normalized, previousLanes);
      return;
    }

    const sourceLaneIndex = lanes.findIndex((lane) => lane.id === source.droppableId);
    const destinationLaneIndex = lanes.findIndex((lane) => lane.id === destination.droppableId);

    if (sourceLaneIndex === -1 || destinationLaneIndex === -1) {
      return;
    }

    const previousLanes = lanes;
    const nextLanes = [...lanes];
    const sourceLane = nextLanes[sourceLaneIndex];
    const destinationLane = nextLanes[destinationLaneIndex];
    const sourceTickets = [...sourceLane.tickets];
    const [movedTicket] = sourceTickets.splice(source.index, 1);

    if (!movedTicket) {
      return;
    }

    if (sourceLane.id === destinationLane.id) {
      sourceTickets.splice(destination.index, 0, movedTicket);

      const normalizedTickets = normalizeTicketOrders(sourceTickets, sourceLane.id);
      nextLanes[sourceLaneIndex] = {
        ...sourceLane,
        tickets: normalizedTickets,
      };

      setLanes(nextLanes);
      void syncTicketOrder(nextLanes, previousLanes, normalizedTickets);
      return;
    }

    const destinationTickets = [...destinationLane.tickets];
    destinationTickets.splice(destination.index, 0, {
      ...movedTicket,
      laneId: destinationLane.id,
    });

    const normalizedSourceTickets = normalizeTicketOrders(sourceTickets, sourceLane.id);
    const normalizedDestinationTickets = normalizeTicketOrders(
      destinationTickets,
      destinationLane.id,
    );

    nextLanes[sourceLaneIndex] = {
      ...sourceLane,
      tickets: normalizedSourceTickets,
    };
    nextLanes[destinationLaneIndex] = {
      ...destinationLane,
      tickets: normalizedDestinationTickets,
    };

    setLanes(nextLanes);
    void syncTicketOrder(nextLanes, previousLanes, [
      ...normalizedSourceTickets,
      ...normalizedDestinationTickets,
    ]);
  };

  const handleLaneSaved = (savedLane: Lane) => {
    setLanes((currentLanes) => {
      const existingLane = currentLanes.find((lane) => lane.id === savedLane.id);

      if (existingLane) {
        return normalizeLaneOrders(
          currentLanes.map((lane) =>
            lane.id === savedLane.id
              ? { ...lane, ...savedLane, tickets: sortTickets(lane.tickets) }
              : lane,
          ),
        );
      }

      return normalizeLaneOrders([...currentLanes, { ...savedLane, tickets: [] }]);
    });
  };

  const handleLaneDeleted = (laneId: string) => {
    setLanes((currentLanes) =>
      normalizeLaneOrders(currentLanes.filter((lane) => lane.id !== laneId)),
    );
  };

  const handleTicketSaved = (savedTicket: TicketWithRelations) => {
    setLanes((currentLanes) =>
      currentLanes.map((lane) => {
        const remainingTickets = lane.tickets.filter((ticket) => ticket.id !== savedTicket.id);

        if (lane.id !== savedTicket.laneId) {
          return {
            ...lane,
            tickets: normalizeTicketOrders(remainingTickets, lane.id),
          };
        }

        return {
          ...lane,
          tickets: normalizeTicketOrders(sortTickets([...remainingTickets, savedTicket]), lane.id),
        };
      }),
    );
  };

  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 shadow-lg shadow-primary/5">
        <div className="flex flex-col gap-4 border-b border-border/60 bg-linear-to-r from-primary/8 via-background to-background px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="rounded-full border-border/60 px-3 py-1">
              {lanes.length} lanes
            </Badge>
            <Badge variant="outline" className="rounded-full border-border/60 px-3 py-1">
              {ticketCount} tickets
            </Badge>
            <Badge variant="outline" className="rounded-full border-border/60 px-3 py-1">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(totalValue)}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isSyncing ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <LoaderCircle className="size-3.5 animate-spin" />
                Syncing board
              </div>
            ) : null}
            <Button variant="secondary" onClick={() => setIsCreateLaneOpen(true)}>
              <Plus className="size-4" />
              Add lane
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto px-5 py-5">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={`${pipelineId}-lanes`} direction="horizontal" type="lane">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex min-h-[34rem] gap-4"
                >
                  {lanes.map((lane, index) => (
                    <Draggable key={lane.id} draggableId={lane.id} index={index}>
                      {(laneProvided, snapshot) => (
                        <div
                          ref={laneProvided.innerRef}
                          {...laneProvided.draggableProps}
                          className={`flex shrink-0 flex-col gap-2 ${
                            snapshot.isDragging ? "z-10" : ""
                          }`}
                        >
                          <div
                            {...laneProvided.dragHandleProps}
                            className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
                          >
                            <GripVertical className="size-3.5" />
                            Drag lane
                          </div>

                          <LaneColumn
                            agencyId={agencyId}
                            lane={lane}
                            lanes={laneOptions}
                            tags={tags}
                            teamMembers={teamMembers}
                            onLaneSaved={handleLaneSaved}
                            onLaneDeleted={handleLaneDeleted}
                            onTicketSaved={handleTicketSaved}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </section>

      <LaneForm
        pipelineId={pipelineId}
        open={isCreateLaneOpen}
        onOpenChange={setIsCreateLaneOpen}
        showTrigger={false}
        onSaved={handleLaneSaved}
      />
    </>
  );
}
