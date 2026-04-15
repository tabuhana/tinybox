"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { DropResult } from "@hello-pangea/dnd";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  ExternalLink,
  FilePlus2,
  GripVertical,
  LayoutTemplate,
  LoaderCircle,
  MousePointerClick,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateFunnelPagesOrder, upsertFunnelPage } from "@/lib/queries";
import type { FunnelPage } from "@/lib/types";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const createPageSchema = z.object({
  name: z.string().min(1, "Page name is required."),
  pathName: z.string().min(1, "Path is required."),
});

type CreatePageValues = z.infer<typeof createPageSchema>;

type FunnelPagesListProps = {
  agencyId: string;
  funnelId: string;
  initialPages: FunnelPage[];
};

function normalizePages(pages: FunnelPage[]) {
  return pages.map((page, index) => ({
    ...page,
    order: index,
  }));
}

function formatPath(pathName?: string | null) {
  const trimmed = pathName?.trim() ?? "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function FunnelPagesList({
  agencyId,
  funnelId,
  initialPages,
}: FunnelPagesListProps) {
  const [pages, setPages] = useState(() => normalizePages(initialPages));
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreatePageValues>({
    resolver: zodResolver(createPageSchema),
    defaultValues: {
      name: "",
      pathName: "home",
    },
  });

  useEffect(() => {
    setPages(normalizePages(initialPages));
  }, [initialPages]);

  useEffect(() => {
    if (!isCreateOpen) {
      form.reset({
        name: "",
        pathName: pages.length === 0 ? "home" : `step-${pages.length + 1}`,
      });
    }
  }, [form, isCreateOpen, pages.length]);

  const syncOrder = async (nextPages: FunnelPage[], previousPages: FunnelPage[]) => {
    setIsSyncing(true);

    try {
      await updateFunnelPagesOrder(nextPages);
    } catch (error) {
      console.error(error);
      setPages(previousPages);
      toast.error("Could not save page order", {
        description: "The previous order has been restored.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    if (!destination) {
      return;
    }

    if (destination.index === source.index) {
      return;
    }

    const previousPages = pages;
    const reordered = [...pages];
    const [movedPage] = reordered.splice(source.index, 1);

    if (!movedPage) {
      return;
    }

    reordered.splice(destination.index, 0, movedPage);
    const normalized = normalizePages(reordered);
    setPages(normalized);
    void syncOrder(normalized, previousPages);
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        const savedPage = await upsertFunnelPage(
          agencyId,
          {
            name: values.name.trim(),
            pathName: values.pathName.trim().replace(/^\/+/, ""),
            order: pages.length,
          },
          funnelId,
        );

        if (!savedPage) {
          throw new Error("Funnel page not returned from server action");
        }

        setPages((currentPages) => normalizePages([...currentPages, savedPage]));
        setIsCreateOpen(false);
        toast.success("Page created", {
          description: `${savedPage.name} is ready for the editor.`,
        });
      } catch (error) {
        console.error(error);
        toast.error("Could not create page", {
          description: "Please try again in a moment.",
        });
      }
    });
  });

  return (
    <>
      <Card className="border border-border/60 bg-card/90 shadow-xl shadow-primary/5 backdrop-blur">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">Funnel pages</CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6">
                Organize the page sequence for this funnel, add new steps, and jump into the
                upcoming editor route for each page.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isSyncing ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <LoaderCircle className="size-3.5 animate-spin" />
                  Syncing order
                </div>
              ) : null}
              <Button variant="secondary" onClick={() => setIsCreateOpen(true)}>
                <Plus className="size-4" />
                Add page
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {pages.length ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId={funnelId} type="page">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-3"
                  >
                    {pages.map((page, index) => (
                      <Draggable key={page.id} draggableId={page.id} index={index}>
                        {(draggableProvided, snapshot) => (
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            className={`rounded-[1.5rem] border border-border/60 bg-background/80 transition-shadow ${
                              snapshot.isDragging ? "shadow-lg shadow-primary/10" : ""
                            }`}
                          >
                            <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  aria-label={`Reorder ${page.name}`}
                                  className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/30 text-muted-foreground"
                                  {...draggableProvided.dragHandleProps}
                                >
                                  <GripVertical className="size-4" />
                                </button>

                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                      Step {index + 1}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {page.visits} visits
                                    </span>
                                  </div>

                                  <div>
                                    <p className="text-lg font-semibold text-foreground">
                                      {page.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatPath(page.pathName)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                                  <MousePointerClick className="size-3.5" />
                                  Click to open editor
                                </div>
                                <Link
                                  href={`/agency/${agencyId}/funnels/${funnelId}/editor/${page.id}`}
                                  className={cn(buttonVariants({ variant: "outline" }))}
                                >
                                  Open editor
                                  <ExternalLink className="size-4" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <Empty className="rounded-[1.75rem] border border-dashed border-border/70 bg-linear-to-br from-muted/30 via-background to-background p-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LayoutTemplate className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No pages yet</EmptyTitle>
                <EmptyDescription>
                  Add the first page in this funnel to start building the path your visitors will
                  follow.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <FilePlus2 className="size-4" />
                  Add first page
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl border border-border/60 bg-card/95 p-0 backdrop-blur">
          <div className="border-b border-border/60 bg-linear-to-br from-primary/12 via-background to-background px-6 py-6">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-semibold tracking-tight">
                Add funnel page
              </DialogTitle>
              <DialogDescription className="max-w-md text-sm leading-6">
                Create a new page entry now. You can open the editor route afterward to customize
                its content in the next phase.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={onSubmit} className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="funnel-page-name">Page name</Label>
              <Input
                id="funnel-page-name"
                placeholder="Landing page"
                disabled={isPending}
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
              {form.formState.errors.name ? (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="funnel-page-path">Path</Label>
              <Input
                id="funnel-page-path"
                placeholder="landing"
                disabled={isPending}
                aria-invalid={Boolean(form.formState.errors.pathName)}
                {...form.register("pathName")}
              />
              {form.formState.errors.pathName ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.pathName.message}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Stored without a leading slash and shown as a clean route segment.
                </p>
              )}
            </div>

            <DialogFooter className="border-t border-border/60 pt-5" showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create page"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
