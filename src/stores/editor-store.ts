"use client";

import { createStore } from "zustand/vanilla";

import type { FunnelPage } from "@/lib/types";

export type EditorDevice = "desktop" | "tablet" | "mobile";

export type EditorBtns =
  | "__body"
  | "container"
  | "text"
  | "video"
  | "image"
  | "link"
  | "contactForm"
  | "paymentForm";

export type EditorElementStyles = Record<string, string>;

export type EditorElementProps = Record<string, string>;

export type EditorElement = {
  id: string;
  type: EditorBtns;
  name: string;
  styles: EditorElementStyles;
  props: EditorElementProps;
  content: EditorElement[];
};

export type EditorHistory = {
  snapshots: EditorElement[][];
  currentIndex: number;
};

export type EditorState = {
  funnelPageId: FunnelPage["id"];
  elements: EditorElement[];
  selectedElement: EditorElement | null;
  device: EditorDevice;
  previewMode: boolean;
  history: EditorHistory;
};

export type EditorActions = {
  addElement: (containerId: string, element: EditorElement, index?: number) => void;
  updateElement: (
    elementId: string,
    updates: Partial<Pick<EditorElement, "name" | "styles" | "props" | "content">>,
  ) => void;
  deleteElement: (elementId: string) => void;
  moveElement: (elementId: string, containerId: string, index?: number) => void;
  setSelectedElement: (elementId: string | null) => void;
  loadData: (elements: unknown, funnelPageId: FunnelPage["id"]) => void;
  togglePreviewMode: () => void;
  setDevice: (device: EditorDevice) => void;
  undo: () => void;
  redo: () => void;
};

export type EditorStore = EditorState & EditorActions;

export type CreateEditorStoreInput = {
  funnelPage: FunnelPage;
  elements?: unknown;
  initialPreviewMode?: boolean;
};

const MAX_HISTORY_LENGTH = 40;

const containerTypes = new Set<EditorBtns>(["__body", "container"]);

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function createDefaultBodyElement(): EditorElement {
  return {
    id: "__body",
    type: "__body",
    name: "Body",
    styles: {
      minHeight: "720px",
      padding: "32px",
      backgroundColor: "#ffffff",
      color: "#111827",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
    },
    props: {},
    content: [],
  };
}

export function createEditorElement(type: Exclude<EditorBtns, "__body">): EditorElement {
  switch (type) {
    case "container":
      return {
        id: createId("container"),
        type,
        name: "Container",
        styles: {
          padding: "24px",
          minHeight: "120px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "24px",
        },
        props: {},
        content: [],
      };
    case "text":
      return {
        id: createId("text"),
        type,
        name: "Text",
        styles: {
          fontSize: "18px",
          lineHeight: "1.6",
          color: "#111827",
        },
        props: {
          text: "Add compelling copy here.",
        },
        content: [],
      };
    case "video":
      return {
        id: createId("video"),
        type,
        name: "Video",
        styles: {
          borderRadius: "24px",
          overflow: "hidden",
          backgroundColor: "#0f172a",
          minHeight: "220px",
        },
        props: {
          src: "",
          poster:
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
        },
        content: [],
      };
    case "image":
      return {
        id: createId("image"),
        type,
        name: "Image",
        styles: {
          borderRadius: "24px",
          overflow: "hidden",
          minHeight: "240px",
        },
        props: {
          src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
          alt: "Editorial placeholder",
        },
        content: [],
      };
    case "link":
      return {
        id: createId("link"),
        type,
        name: "Link",
        styles: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "14px 20px",
          backgroundColor: "#111827",
          color: "#ffffff",
          borderRadius: "9999px",
          fontWeight: "600",
          width: "fit-content",
        },
        props: {
          text: "Call to action",
          href: "#",
        },
        content: [],
      };
    case "contactForm":
      return {
        id: createId("contact_form"),
        type,
        name: "Contact form",
        styles: {
          padding: "24px",
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        },
        props: {
          heading: "Stay in the loop",
          description: "Collect leads with a quick opt-in form.",
          buttonText: "Join the waitlist",
        },
        content: [],
      };
    case "paymentForm":
      return {
        id: createId("payment_form"),
        type,
        name: "Payment form",
        styles: {
          padding: "24px",
          backgroundColor: "#0f172a",
          color: "#ffffff",
          borderRadius: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        },
        props: {
          heading: "Complete your order",
          description: "Present a secure checkout summary and payment inputs.",
          buttonText: "Pay now",
        },
        content: [],
      };
  }
}

function cloneElements(elements: EditorElement[]) {
  return structuredClone(elements);
}

function normalizeRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entryValue]) => {
      if (entryValue === null || entryValue === undefined || entryValue === "") {
        return [];
      }

      return [[key, String(entryValue)]];
    }),
  );
}

function normalizeElement(value: unknown): EditorElement | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const type = candidate.type;

  if (typeof type !== "string") {
    return null;
  }

  const normalizedType = type as EditorBtns;

  if (!["__body", "container", "text", "video", "image", "link", "contactForm", "paymentForm"].includes(normalizedType)) {
    return null;
  }

  const rawChildren = Array.isArray(candidate.content) ? candidate.content : [];

  return {
    id: typeof candidate.id === "string" ? candidate.id : createId(normalizedType),
    type: normalizedType,
    name:
      typeof candidate.name === "string" && candidate.name.trim().length > 0
        ? candidate.name
        : normalizedType === "__body"
          ? "Body"
          : normalizedType,
    styles: normalizeRecord(candidate.styles),
    props: normalizeRecord(candidate.props),
    content: rawChildren.map(normalizeElement).filter((child): child is EditorElement => Boolean(child)),
  };
}

export function normalizeEditorElements(elements: unknown) {
  if (!Array.isArray(elements)) {
    return [createDefaultBodyElement()];
  }

  const normalized = elements
    .map(normalizeElement)
    .filter((element): element is EditorElement => Boolean(element));

  if (!normalized.length) {
    return [createDefaultBodyElement()];
  }

  if (!normalized.some((element) => element.type === "__body")) {
    return [{ ...createDefaultBodyElement(), content: normalized }];
  }

  return normalized;
}

function findElementById(elements: EditorElement[], elementId: string | null | undefined): EditorElement | null {
  if (!elementId) {
    return null;
  }

  for (const element of elements) {
    if (element.id === elementId) {
      return element;
    }

    const nestedMatch = findElementById(element.content, elementId);

    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return null;
}

function getRootElement(elements: EditorElement[]) {
  return elements[0] ?? createDefaultBodyElement();
}

function upsertHistory(history: EditorHistory, elements: EditorElement[]) {
  const nextSnapshots = history.snapshots.slice(0, history.currentIndex + 1);
  nextSnapshots.push(cloneElements(elements));

  const trimmedSnapshots =
    nextSnapshots.length > MAX_HISTORY_LENGTH
      ? nextSnapshots.slice(nextSnapshots.length - MAX_HISTORY_LENGTH)
      : nextSnapshots;

  return {
    snapshots: trimmedSnapshots,
    currentIndex: trimmedSnapshots.length - 1,
  };
}

function commitElements(
  state: EditorState,
  elements: EditorElement[],
  selectedElementId?: string | null,
): Pick<EditorState, "elements" | "selectedElement" | "history"> {
  const normalizedElements = normalizeEditorElements(elements);
  const nextSelectedElement =
    findElementById(
      normalizedElements,
      selectedElementId ?? state.selectedElement?.id ?? getRootElement(normalizedElements).id,
    ) ?? getRootElement(normalizedElements);

  return {
    elements: normalizedElements,
    selectedElement: nextSelectedElement,
    history: upsertHistory(state.history, normalizedElements),
  };
}

function mapElements(
  elements: EditorElement[],
  elementId: string,
  updater: (element: EditorElement) => EditorElement,
): EditorElement[] {
  return elements.map((element) => {
    if (element.id === elementId) {
      return updater(element);
    }

    if (!element.content.length) {
      return element;
    }

    return {
      ...element,
      content: mapElements(element.content, elementId, updater),
    };
  });
}

type RemovalResult = {
  removedElement: EditorElement | null;
  parentId: string | null;
  index: number;
  elements: EditorElement[];
};

function removeElement(
  elements: EditorElement[],
  elementId: string,
  parentId: string | null = null,
): RemovalResult {
  for (const [index, element] of elements.entries()) {
    if (element.id === elementId) {
      return {
        removedElement: element,
        parentId,
        index,
        elements: [...elements.slice(0, index), ...elements.slice(index + 1)],
      };
    }

    if (!element.content.length) {
      continue;
    }

    const nestedResult = removeElement(element.content, elementId, element.id);

    if (nestedResult.removedElement) {
      return {
        ...nestedResult,
        elements: elements.map((candidate) =>
          candidate.id === element.id ? { ...candidate, content: nestedResult.elements } : candidate,
        ),
      };
    }
  }

  return {
    removedElement: null,
    parentId: null,
    index: -1,
    elements,
  };
}

function withInsertResult(
  elements: EditorElement[],
  containerId: string,
  elementToInsert: EditorElement,
  index?: number,
): { inserted: boolean; elements: EditorElement[] } {
  let inserted = false;

  const nextElements = elements.map((element) => {
    if (element.id === containerId && containerTypes.has(element.type)) {
      inserted = true;
      const nextContent = [...element.content];
      const insertionIndex =
        index === undefined || Number.isNaN(index)
          ? nextContent.length
          : Math.max(0, Math.min(index, nextContent.length));

      nextContent.splice(insertionIndex, 0, elementToInsert);

      return {
        ...element,
        content: nextContent,
      };
    }

    if (!element.content.length) {
      return element;
    }

    const nestedInsert = withInsertResult(element.content, containerId, elementToInsert, index);

    if (!nestedInsert.inserted) {
      return element;
    }

    inserted = true;

    return {
      ...element,
      content: nestedInsert.elements,
    };
  });

  return {
    inserted,
    elements: nextElements,
  };
}

function containsElementId(element: EditorElement, targetId: string): boolean {
  if (element.id === targetId) {
    return true;
  }

  return element.content.some((child) => containsElementId(child, targetId));
}

function getInitialState({
  funnelPage,
  elements,
  initialPreviewMode = false,
}: CreateEditorStoreInput): EditorState {
  const normalizedElements = normalizeEditorElements(elements);
  const selectedElement = getRootElement(normalizedElements);

  return {
    funnelPageId: funnelPage.id,
    elements: normalizedElements,
    selectedElement,
    device: "desktop",
    previewMode: initialPreviewMode,
    history: {
      snapshots: [cloneElements(normalizedElements)],
      currentIndex: 0,
    },
  };
}

export function createEditorStore(input: CreateEditorStoreInput) {
  return createStore<EditorStore>()((set) => ({
    ...getInitialState(input),
    addElement: (containerId, element, index) =>
      set((state) => {
        const inserted = withInsertResult(state.elements, containerId, element, index);

        if (!inserted.inserted) {
          return state;
        }

        return {
          ...commitElements(state, inserted.elements, element.id),
        };
      }),
    updateElement: (elementId, updates) =>
      set((state) => {
        const nextElements = mapElements(state.elements, elementId, (element) => ({
          ...element,
          ...(updates.name ? { name: updates.name } : {}),
          styles: updates.styles ? { ...element.styles, ...updates.styles } : element.styles,
          props: updates.props ? { ...element.props, ...updates.props } : element.props,
          content: updates.content ?? element.content,
        }));

        return {
          ...commitElements(state, nextElements, elementId),
        };
      }),
    deleteElement: (elementId) =>
      set((state) => {
        const elementToDelete = findElementById(state.elements, elementId);

        if (!elementToDelete || elementToDelete.type === "__body") {
          return state;
        }

        const nextElements = removeElement(state.elements, elementId).elements;
        const fallbackSelection = getRootElement(nextElements).id;

        return {
          ...commitElements(state, nextElements, fallbackSelection),
        };
      }),
    moveElement: (elementId, containerId, index) =>
      set((state) => {
        const currentElement = findElementById(state.elements, elementId);

        if (!currentElement || currentElement.type === "__body" || containsElementId(currentElement, containerId)) {
          return state;
        }

        const removal = removeElement(state.elements, elementId);

        if (!removal.removedElement) {
          return state;
        }

        const adjustedIndex =
          removal.parentId === containerId && removal.index >= 0 && index !== undefined && index > removal.index
            ? index - 1
            : index;

        const inserted = withInsertResult(
          removal.elements,
          containerId,
          removal.removedElement,
          adjustedIndex,
        );

        if (!inserted.inserted) {
          return state;
        }

        return {
          ...commitElements(state, inserted.elements, currentElement.id),
        };
      }),
    setSelectedElement: (elementId) =>
      set((state) => ({
        selectedElement:
          findElementById(state.elements, elementId) ?? getRootElement(state.elements),
      })),
    loadData: (elements, funnelPageId) =>
      set((state) => {
        const normalizedElements = normalizeEditorElements(elements);

        return {
          funnelPageId,
          elements: normalizedElements,
          selectedElement: getRootElement(normalizedElements),
          device: state.device,
          previewMode: false,
          history: {
            snapshots: [cloneElements(normalizedElements)],
            currentIndex: 0,
          },
        };
      }),
    togglePreviewMode: () =>
      set((state) => ({
        previewMode: !state.previewMode,
      })),
    setDevice: (device) =>
      set(() => ({
        device,
      })),
    undo: () =>
      set((state) => {
        if (state.history.currentIndex === 0) {
          return state;
        }

        const nextIndex = state.history.currentIndex - 1;
        const nextElements = cloneElements(state.history.snapshots[nextIndex] ?? state.elements);

        return {
          elements: nextElements,
          selectedElement:
            findElementById(nextElements, state.selectedElement?.id) ?? getRootElement(nextElements),
          history: {
            ...state.history,
            currentIndex: nextIndex,
          },
        };
      }),
    redo: () =>
      set((state) => {
        if (state.history.currentIndex >= state.history.snapshots.length - 1) {
          return state;
        }

        const nextIndex = state.history.currentIndex + 1;
        const nextElements = cloneElements(state.history.snapshots[nextIndex] ?? state.elements);

        return {
          elements: nextElements,
          selectedElement:
            findElementById(nextElements, state.selectedElement?.id) ?? getRootElement(nextElements),
          history: {
            ...state.history,
            currentIndex: nextIndex,
          },
        };
      }),
  }));
}
