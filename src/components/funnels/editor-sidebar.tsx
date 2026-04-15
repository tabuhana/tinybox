"use client";

import {
  Columns2,
  CreditCard,
  FileText,
  ImageIcon,
  LayoutPanelTop,
  Link2,
  Mail,
  PlaySquare,
  Plus,
  Type,
} from "lucide-react";

import { useEditorStore } from "@/providers/editor-store-provider";
import {
  createEditorElement,
  type EditorBtns,
  type EditorElement,
} from "@/stores/editor-store";

import type { Media } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type TemplateDefinition = {
  type: Exclude<EditorBtns, "__body">;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const templates: TemplateDefinition[] = [
  {
    type: "container",
    title: "Container",
    description: "Flexible grouping block for sections and nested layouts.",
    icon: LayoutPanelTop,
  },
  {
    type: "2Col",
    title: "Two columns",
    description: "Side-by-side layout with two nested drop zones.",
    icon: Columns2,
  },
  {
    type: "text",
    title: "Text",
    description: "Headline or paragraph copy for persuasive messaging.",
    icon: Type,
  },
  {
    type: "image",
    title: "Image",
    description: "Editorial visual block with responsive cropping.",
    icon: ImageIcon,
  },
  {
    type: "video",
    title: "Video",
    description: "Embed a hosted video or hero demo section.",
    icon: PlaySquare,
  },
  {
    type: "link",
    title: "Link",
    description: "Button-style CTA that forwards the visitor.",
    icon: Link2,
  },
  {
    type: "contactForm",
    title: "Contact form",
    description: "Lead capture block for collecting names and emails.",
    icon: Mail,
  },
  {
    type: "paymentForm",
    title: "Payment form",
    description: "Checkout preview section for paid offer steps.",
    icon: CreditCard,
  },
];

function getInsertionTarget(selectedElement: EditorElement | null, rootId: string) {
  if (
    selectedElement &&
    (selectedElement.type === "__body" ||
      selectedElement.type === "container" ||
      selectedElement.type === "2Col")
  ) {
    return selectedElement.id;
  }

  return rootId;
}

function PropertyInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.ComponentProps<typeof Input>["type"];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value ?? ""}
        type={type}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function StyleInput({
  label,
  styleKey,
  placeholder,
}: {
  label: string;
  styleKey: string;
  placeholder?: string;
}) {
  const selectedElement = useEditorStore((store) => store.selectedElement);
  const updateElement = useEditorStore((store) => store.updateElement);

  if (!selectedElement) {
    return null;
  }

  return (
    <PropertyInput
      label={label}
      value={selectedElement.styles[styleKey]}
      placeholder={placeholder}
      onChange={(value) =>
        updateElement(selectedElement.id, {
          styles: {
            [styleKey]: value,
          },
        })
      }
    />
  );
}

function ElementSpecificFields({ selectedElement }: { selectedElement: EditorElement }) {
  const updateElement = useEditorStore((store) => store.updateElement);

  if (selectedElement.type === "text") {
    return (
      <div className="space-y-2">
        <Label>Copy</Label>
        <Textarea
          value={selectedElement.props.text ?? ""}
          rows={5}
          onChange={(event) =>
            updateElement(selectedElement.id, {
              props: {
                text: event.target.value,
              },
            })
          }
        />
      </div>
    );
  }

  if (selectedElement.type === "link") {
    return (
      <div className="grid gap-4">
        <PropertyInput
          label="Label"
          value={selectedElement.props.text}
          onChange={(value) =>
            updateElement(selectedElement.id, {
              props: {
                text: value,
              },
            })
          }
        />
        <PropertyInput
          label="Destination"
          value={selectedElement.props.href}
          placeholder="https://example.com"
          onChange={(value) =>
            updateElement(selectedElement.id, {
              props: {
                href: value,
              },
            })
          }
        />
      </div>
    );
  }

  if (selectedElement.type === "image") {
    return (
      <div className="grid gap-4">
        <PropertyInput
          label="Image URL"
          value={selectedElement.props.src}
          placeholder="https://images.unsplash.com/..."
          onChange={(value) =>
            updateElement(selectedElement.id, {
              props: {
                src: value,
              },
            })
          }
        />
        <PropertyInput
          label="Alt text"
          value={selectedElement.props.alt}
          onChange={(value) =>
            updateElement(selectedElement.id, {
              props: {
                alt: value,
              },
            })
          }
        />
      </div>
    );
  }

  if (selectedElement.type === "video") {
    return (
      <div className="grid gap-4">
        <PropertyInput
          label="Video URL"
          value={selectedElement.props.src}
          placeholder="https://cdn.example.com/hero.mp4"
          onChange={(value) =>
            updateElement(selectedElement.id, {
              props: {
                src: value,
              },
            })
          }
        />
        <PropertyInput
          label="Poster image"
          value={selectedElement.props.poster}
          placeholder="https://images.unsplash.com/..."
          onChange={(value) =>
            updateElement(selectedElement.id, {
              props: {
                poster: value,
              },
            })
          }
        />
      </div>
    );
  }

  if (selectedElement.type === "contactForm" || selectedElement.type === "paymentForm") {
    return (
      <div className="grid gap-4">
        <PropertyInput
          label="Heading"
          value={selectedElement.props.heading}
          onChange={(value) =>
            updateElement(selectedElement.id, {
              props: {
                heading: value,
              },
            })
          }
        />
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            rows={4}
            value={selectedElement.props.description ?? ""}
            onChange={(event) =>
              updateElement(selectedElement.id, {
                props: {
                  description: event.target.value,
                },
              })
            }
          />
        </div>
        <PropertyInput
          label="Button text"
          value={selectedElement.props.buttonText}
          onChange={(value) =>
            updateElement(selectedElement.id, {
              props: {
                buttonText: value,
              },
            })
          }
        />
      </div>
    );
  }

  return null;
}

type EditorSidebarProps = {
  media?: Media[];
};

export function EditorSidebar({ media = [] }: EditorSidebarProps) {
  const elements = useEditorStore((store) => store.elements);
  const selectedElement = useEditorStore((store) => store.selectedElement);
  const addElement = useEditorStore((store) => store.addElement);
  const updateElement = useEditorStore((store) => store.updateElement);
  const deleteElement = useEditorStore((store) => store.deleteElement);

  const rootId = elements[0]?.id ?? "__body";
  const insertionTarget = getInsertionTarget(selectedElement, rootId);

  const canReceiveMediaSrc =
    selectedElement?.type === "image" || selectedElement?.type === "video";

  const applyMediaToSelection = (item: Media) => {
    if (!canReceiveMediaSrc || !selectedElement) {
      return;
    }

    updateElement(selectedElement.id, {
      props: {
        src: item.link,
      },
    });
  };

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 shadow-2xl shadow-primary/5">
      <div className="border-b border-border/60 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">Editor controls</p>
            <p className="text-sm text-muted-foreground">
              Drag blocks into the canvas or fine-tune the selected element.
            </p>
          </div>
          <Badge variant="outline">{selectedElement?.name ?? "No selection"}</Badge>
        </div>
      </div>

      <Tabs defaultValue="elements" className="flex-1 overflow-hidden">
        <div className="border-b border-border/60 px-4 py-3">
          <TabsList className="w-full">
            <TabsTrigger value="elements">Components</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="properties">Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="elements" className="h-full overflow-y-auto px-4 py-4">
          <div className="grid gap-3">
            {templates.map((template) => {
              const Icon = template.icon;

              return (
                <button
                  key={template.type}
                  type="button"
                  draggable
                  className="group rounded-[1.5rem] border border-border/60 bg-background/80 p-4 text-left transition hover:border-primary/30 hover:bg-primary/5"
                  onClick={() => addElement(insertionTarget, createEditorElement(template.type))}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "copy";
                    event.dataTransfer.setData(
                      "application/tinybox-editor",
                      JSON.stringify({
                        kind: "template",
                        type: template.type,
                      }),
                    );
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="inline-flex size-11 items-center justify-center rounded-2xl border border-border/60 bg-muted/40">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{template.title}</span>
                        <Plus className="size-3.5 text-muted-foreground transition group-hover:text-primary" />
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="media" className="h-full overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Media library</p>
              <p className="text-sm text-muted-foreground">
                {canReceiveMediaSrc
                  ? "Click a file to apply it to the selected element."
                  : "Select an image or video element to apply media from here."}
              </p>
            </div>
            {media.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center rounded-[1.25rem] border border-dashed border-border/60 bg-muted/10 px-4 text-center text-sm text-muted-foreground">
                Add media in the library to see it here.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {media.map((item) => {
                  const isImage = item.type === "image";
                  const isVideo = item.type === "video";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!canReceiveMediaSrc}
                      onClick={() => applyMediaToSelection(item)}
                      className="group flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/30 transition hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                      title={item.name}
                    >
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.link}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : isVideo ? (
                        <video
                          src={item.link}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="properties" className="h-full overflow-y-auto px-4 py-4">
          {selectedElement ? (
            <div className="space-y-6">
              <div className="grid gap-4">
                <PropertyInput
                  label="Label"
                  value={selectedElement.name}
                  onChange={(value) =>
                    updateElement(selectedElement.id, {
                      name: value,
                    })
                  }
                />

                <div className="flex items-center gap-3 rounded-[1.25rem] border border-border/60 bg-muted/20 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Selected type</p>
                    <p className="text-sm text-muted-foreground">{selectedElement.type}</p>
                  </div>
                  {selectedElement.type !== "__body" ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => deleteElement(selectedElement.id)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Content
                  </p>
                </div>
                <ElementSpecificFields selectedElement={selectedElement} />
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Layout
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <StyleInput label="Width" styleKey="width" placeholder="100%" />
                  <StyleInput label="Max width" styleKey="maxWidth" placeholder="960px" />
                  <StyleInput label="Padding" styleKey="padding" placeholder="24px" />
                  <StyleInput label="Gap" styleKey="gap" placeholder="16px" />
                  <StyleInput label="Margin top" styleKey="marginTop" placeholder="0px" />
                  <StyleInput label="Radius" styleKey="borderRadius" placeholder="24px" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Appearance
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <StyleInput label="Background" styleKey="backgroundColor" placeholder="#ffffff" />
                  <StyleInput label="Text color" styleKey="color" placeholder="#111827" />
                  <StyleInput label="Border" styleKey="border" placeholder="1px solid #e2e8f0" />
                  <StyleInput label="Shadow" styleKey="boxShadow" placeholder="0 18px 50px rgba(...)" />
                  <StyleInput label="Font size" styleKey="fontSize" placeholder="18px" />
                  <StyleInput label="Font weight" styleKey="fontWeight" placeholder="600" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-60 items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-muted/10 px-6 text-center text-sm text-muted-foreground">
              Select an element on the canvas to edit its content and styles.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </aside>
  );
}
