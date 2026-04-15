"use client";

import { Layers2, PencilLine, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { deletePipeline } from "@/lib/queries";
import type { Lane, Pipeline, Ticket } from "@/lib/types";

import { PipelineForm } from "@/components/forms/pipeline-form";
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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PipelineSummary = Pipeline & {
  lanes: Array<Lane & { tickets: Ticket[] }>;
};

type PipelineNavProps = {
  agencyId: string;
  currentPipelineId: string;
  pipelines: PipelineSummary[];
};

export function PipelineNav({
  agencyId,
  currentPipelineId,
  pipelines,
}: PipelineNavProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentPipeline = useMemo(
    () => pipelines.find((pipeline) => pipeline.id === currentPipelineId) ?? null,
    [currentPipelineId, pipelines],
  );

  const currentPipelineTicketCount = useMemo(
    () =>
      currentPipeline?.lanes.reduce((sum, lane) => sum + lane.tickets.length, 0) ?? 0,
    [currentPipeline],
  );

  const handleDelete = () => {
    if (!currentPipeline) {
      return;
    }

    startTransition(async () => {
      try {
        await deletePipeline(currentPipeline.id);

        const remainingPipelines = pipelines.filter(
          (pipeline) => pipeline.id !== currentPipeline.id,
        );

        toast.success("Pipeline deleted", {
          description: `${currentPipeline.name} has been removed.`,
        });

        setIsDeleteOpen(false);

        if (remainingPipelines.length) {
          router.push(`/agency/${agencyId}/pipelines/${remainingPipelines[0].id}`);
        } else {
          router.push(`/agency/${agencyId}/pipelines`);
        }

        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Could not delete pipeline", {
          description: "Please try again in a moment.",
        });
      }
    });
  };

  if (!currentPipeline) {
    return null;
  }

  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-linear-to-br from-primary/10 via-background to-background shadow-lg shadow-primary/5">
        <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              <Layers2 className="size-3.5 text-primary" />
              Pipelines
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {currentPipeline.name}
                </h1>
                <Badge variant="outline" className="rounded-full border-border/60 px-3 py-1">
                  {currentPipeline.lanes.length} lanes
                </Badge>
                <Badge variant="outline" className="rounded-full border-border/60 px-3 py-1">
                  {currentPipelineTicketCount} tickets
                </Badge>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Switch boards, refine the current pipeline, or create the next motion your team
                needs to track.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PipelineForm
              agencyId={agencyId}
              triggerLabel="New pipeline"
              triggerVariant="default"
              triggerClassName="shrink-0"
            />
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
              <PencilLine className="size-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="border-t border-border/60 px-6 py-4">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {pipelines.map((pipeline) => {
              const isActive = pipeline.id === currentPipelineId;
              const ticketCount = pipeline.lanes.reduce(
                (sum, lane) => sum + lane.tickets.length,
                0,
              );

              return (
                <Link
                  key={pipeline.id}
                  href={`/agency/${agencyId}/pipelines/${pipeline.id}`}
                  className={cn(
                    buttonVariants({ variant: isActive ? "default" : "outline", size: "sm" }),
                    "h-auto min-w-fit rounded-[1.2rem] px-4 py-3",
                  )}
                >
                  <span className="flex flex-col items-start text-left">
                    <span className="font-medium">{pipeline.name}</span>
                    <span
                      className={cn(
                        "text-xs",
                        isActive ? "text-primary-foreground/80" : "text-muted-foreground",
                      )}
                    >
                      {pipeline.lanes.length} lanes · {ticketCount} tickets
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <PipelineForm
        agencyId={agencyId}
        pipeline={currentPipeline}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        showTrigger={false}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="size-7 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete pipeline</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-medium text-foreground">{currentPipeline.name}</span>{" "}
              and every lane and ticket inside it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete pipeline"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
