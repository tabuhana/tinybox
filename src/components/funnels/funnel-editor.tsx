"use client";

import { Fragment, useState, useTransition } from "react";
import {
  Eye,
  Layers3,
  Laptop,
  PanelLeftClose,
  PanelLeftOpen,
  Redo2,
  Save,
  Smartphone,
  TabletSmartphone,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { upsertFunnelPage } from "@/lib/queries";
import type { FunnelPage, Media } from "@/lib/types";
import { useEditorStore } from "@/providers/editor-store-provider";
import {
  createEditorElement,
  type EditorBtns,
  type EditorDevice,
  type EditorElement,
} from "@/stores/editor-store";

import {
  ContainerComponent,
  ContactFormComponent,
  ImageComponent,
  LinkComponent,
  PaymentFormComponent,
  TextComponent,
  TwoColumnsComponent,
  VideoComponent,
} from "@/components/funnels/editor-elements";
import { EditorSidebar } from "@/components/funnels/editor-sidebar";
import { FunnelRuntimeProvider } from "@/components/funnels/funnel-runtime-context";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FunnelEditorProps = {
  agencyId: string;
  funnelId: string;
  funnelPage: FunnelPage;
  liveMode?: boolean;
  media?: Media[];
};

type DragPayload =
  | {
      kind: "template";
      type: Exclude<EditorBtns, "__body">;
    }
  | {
      kind: "existing";
      elementId: string;
    };

const DEVICE_WIDTHS: Record<EditorDevice, string> = {
  desktop: "max-w-6xl",
  tablet: "max-w-3xl",
  mobile: "max-w-[430px]",
};

function parsePayload(rawValue: string | undefined): DragPayload | null {
  if (!rawValue) {
    return null;
  }

  try {
    const payload = JSON.parse(rawValue) as DragPayload;

    if (payload.kind === "template" && payload.type) {
      return payload;
    }

    if (payload.kind === "existing" && payload.elementId) {
      return payload;
    }

    return null;
  } catch {
    return null;
  }
}

function renderElementContent(element: EditorElement, children: React.ReactNode) {
  switch (element.type) {
    case "__body":
      return (
        <div
          className="w-full"
          style={element.styles as React.CSSProperties}
        >
          {children}
        </div>
      );
    case "container":
      return <ContainerComponent element={element}>{children}</ContainerComponent>;
    case "2Col":
      return <TwoColumnsComponent element={element}>{children}</TwoColumnsComponent>;
    case "text":
      return <TextComponent element={element} />;
    case "video":
      return <VideoComponent element={element} />;
    case "image":
      return <ImageComponent element={element} />;
    case "link":
      return <LinkComponent element={element} />;
    case "contactForm":
      return <ContactFormComponent element={element} />;
    case "paymentForm":
      return <PaymentFormComponent element={element} />;
  }
}

function EditorDropZone({
  containerId,
  index,
  empty,
}: {
  containerId: string;
  index: number;
  empty?: boolean;
}) {
  const previewMode = useEditorStore((store) => store.previewMode);
  const addElement = useEditorStore((store) => store.addElement);
  const moveElement = useEditorStore((store) => store.moveElement);
  const [isOver, setIsOver] = useState(false);

  if (previewMode) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-dashed px-4 text-center text-xs font-medium uppercase tracking-[0.2em] transition ${
        empty
          ? "min-h-20 py-7"
          : "min-h-9 py-2"
      } ${
        isOver
          ? "border-primary bg-primary/10 text-primary"
          : "border-border/70 bg-background/55 text-muted-foreground"
      }`}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsOver(false);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setIsOver(true);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);

        const payload = parsePayload(event.dataTransfer.getData("application/tinybox-editor"));

        if (!payload) {
          return;
        }

        if (payload.kind === "template") {
          addElement(containerId, createEditorElement(payload.type), index);
          return;
        }

        moveElement(payload.elementId, containerId, index);
      }}
    >
      {empty ? "Drop an element here" : "Drop here"}
    </div>
  );
}

function NestedChildren({ parentElement }: { parentElement: EditorElement }) {
  if (!parentElement.content.length) {
    return <EditorDropZone containerId={parentElement.id} index={0} empty />;
  }

  return (
    <div className="space-y-3">
      {parentElement.content.map((child, index) => (
        <Fragment key={child.id}>
          <EditorDropZone containerId={parentElement.id} index={index} />
          <EditorCanvasNode element={child} />
        </Fragment>
      ))}
      <EditorDropZone containerId={parentElement.id} index={parentElement.content.length} />
    </div>
  );
}

function EditorCanvasNode({ element }: { element: EditorElement }) {
  const selectedId = useEditorStore((store) => store.selectedElement?.id);
  const setSelectedElement = useEditorStore((store) => store.setSelectedElement);
  const previewMode = useEditorStore((store) => store.previewMode);
  const isContainer =
    element.type === "__body" || element.type === "container" || element.type === "2Col";
  const isSelected = selectedId === element.id;

  return (
    <div className="space-y-3">
      <div
        draggable={!previewMode && element.type !== "__body"}
        className={`relative transition ${
          element.type === "__body" ? "min-h-[720px] rounded-[2rem]" : "rounded-[1.75rem]"
        } ${
          previewMode
            ? ""
            : isSelected
              ? "ring-2 ring-primary ring-offset-4 ring-offset-background"
              : "hover:ring-1 hover:ring-primary/35 hover:ring-offset-2 hover:ring-offset-background"
        }`}
        onClick={(event) => {
          if (previewMode) {
            return;
          }

          event.stopPropagation();
          setSelectedElement(element.id);
        }}
        onDragStart={(event) => {
          if (previewMode || element.type === "__body") {
            return;
          }

          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData(
            "application/tinybox-editor",
            JSON.stringify({
              kind: "existing",
              elementId: element.id,
            } satisfies DragPayload),
          );
        }}
      >
        {!previewMode && element.type !== "__body" ? (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="outline">{element.name}</Badge>
          </div>
        ) : null}

        {renderElementContent(
          element,
          isContainer ? <NestedChildren parentElement={element} /> : null,
        )}
      </div>
    </div>
  );
}

export function FunnelEditor({
  agencyId,
  funnelId,
  funnelPage,
  liveMode = false,
  media = [],
}: FunnelEditorProps) {
  const elements = useEditorStore((store) => store.elements);
  const device = useEditorStore((store) => store.device);
  const previewMode = useEditorStore((store) => store.previewMode);
  const history = useEditorStore((store) => store.history);
  const selectedElement = useEditorStore((store) => store.selectedElement);
  const setSelectedElement = useEditorStore((store) => store.setSelectedElement);
  const setDevice = useEditorStore((store) => store.setDevice);
  const togglePreviewMode = useEditorStore((store) => store.togglePreviewMode);
  const undo = useEditorStore((store) => store.undo);
  const redo = useEditorStore((store) => store.redo);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSaving, startSaving] = useTransition();

  const bodyElement = elements[0];
  const topLevelSectionCount = bodyElement?.content.length ?? 0;

  const handleSave = () => {
    startSaving(async () => {
      try {
        const savedPage = await upsertFunnelPage(
          agencyId,
          {
            id: funnelPage.id,
            name: funnelPage.name,
            pathName: funnelPage.pathName,
            order: funnelPage.order,
            content: JSON.stringify(elements),
            previewImage: funnelPage.previewImage ?? undefined,
            visits: funnelPage.visits,
          },
          funnelId,
        );

        if (!savedPage) {
          throw new Error("Funnel page was not returned after saving.");
        }

        toast.success("Page saved", {
          description: `${savedPage.name} content has been persisted.`,
        });
      } catch (error) {
        console.error(error);
        toast.error("Could not save funnel page", {
          description: "Please try again in a moment.",
        });
      }
    });
  };

  const canvas = (
    <main
      className={
        liveMode
          ? "min-h-screen bg-background px-4 py-5 md:px-6"
          : "flex min-h-[calc(100vh-220px)] flex-1 overflow-auto rounded-[2rem] border border-border/60 bg-card/70 px-4 py-5 md:px-6"
      }
    >
      <div
        className="w-full"
        onClick={() => {
          if (!previewMode) {
            setSelectedElement(bodyElement?.id ?? "__body");
          }
        }}
      >
        <div className={`mx-auto w-full ${DEVICE_WIDTHS[device]} transition-[max-width] duration-300`}>
          {bodyElement ? <EditorCanvasNode element={bodyElement} /> : null}
        </div>
      </div>
    </main>
  );

  if (liveMode) {
    return (
      <FunnelRuntimeProvider agencyId={agencyId} funnelId={funnelId} liveMode>
        {canvas}
      </FunnelRuntimeProvider>
    );
  }

  return (
    <FunnelRuntimeProvider agencyId={agencyId} funnelId={funnelId} liveMode={false}>
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.08),transparent_30%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1700px] flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
        <header className="rounded-[2rem] border border-border/60 bg-card/90 p-5 shadow-xl shadow-primary/5 backdrop-blur">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Funnel editor</Badge>
                <Badge variant="outline">{device}</Badge>
                {selectedElement ? <Badge variant="outline">{selectedElement.name}</Badge> : null}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{funnelPage.name}</h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  Arrange sections, refine styling, and save the serialized layout for this funnel page.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/agency/${agencyId}/funnels/${funnelId}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Back to funnel
              </Link>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSidebarOpen((current) => !current)}
              >
                {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
                {sidebarOpen ? "Hide controls" : "Show controls"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={undo}
                disabled={history.currentIndex === 0}
              >
                <Undo2 className="size-4" />
                Undo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={redo}
                disabled={history.currentIndex >= history.snapshots.length - 1}
              >
                <Redo2 className="size-4" />
                Redo
              </Button>
              <Button type="button" variant={previewMode ? "secondary" : "outline"} onClick={togglePreviewMode}>
                <Eye className="size-4" />
                {previewMode ? "Exit preview" : "Preview"}
              </Button>
              <Button type="button" onClick={handleSave} disabled={isSaving}>
                <Save className="size-4" />
                {isSaving ? "Saving..." : "Save page"}
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/60 pt-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 p-1">
              <Button
                type="button"
                size="sm"
                variant={device === "desktop" ? "default" : "ghost"}
                onClick={() => setDevice("desktop")}
              >
                <Laptop className="size-4" />
                Desktop
              </Button>
              <Button
                type="button"
                size="sm"
                variant={device === "tablet" ? "default" : "ghost"}
                onClick={() => setDevice("tablet")}
              >
                <TabletSmartphone className="size-4" />
                Tablet
              </Button>
              <Button
                type="button"
                size="sm"
                variant={device === "mobile" ? "default" : "ghost"}
                onClick={() => setDevice("mobile")}
              >
                <Smartphone className="size-4" />
                Mobile
              </Button>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-sm text-muted-foreground">
              <Layers3 className="size-4 text-primary" />
              {topLevelSectionCount} top-level section{topLevelSectionCount === 1 ? "" : "s"}
            </div>
          </div>
        </header>

        {sidebarOpen && !previewMode ? (
          <div className="grid min-h-[calc(100vh-220px)] gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
            <div className="min-h-0">
              <EditorSidebar media={media} />
            </div>
            <div className="min-h-0">
              <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/60 bg-card/70">
                <div className="border-b border-border/60 px-5 py-4">
                  <p className="text-sm font-medium text-foreground">Canvas</p>
                  <p className="text-sm text-muted-foreground">
                    Drag new blocks into the page and select any element to refine it.
                  </p>
                </div>
                <div
                  className="flex-1 overflow-auto px-4 py-5 md:px-6"
                  onClick={() => setSelectedElement(bodyElement?.id ?? "__body")}
                >
                  <div className={`mx-auto w-full ${DEVICE_WIDTHS[device]} transition-[max-width] duration-300`}>
                    {bodyElement ? <EditorCanvasNode element={bodyElement} /> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          canvas
        )}
      </div>
    </div>
    </FunnelRuntimeProvider>
  );
}
