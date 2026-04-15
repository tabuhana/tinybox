"use client";

import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import { useStore } from "zustand";

import type { FunnelPage } from "@/lib/types";
import {
  createEditorStore,
  type EditorStore,
  type CreateEditorStoreInput,
} from "@/stores/editor-store";

type EditorStoreApi = ReturnType<typeof createEditorStore>;

const EditorStoreContext = createContext<EditorStoreApi | undefined>(undefined);

type EditorStoreProviderProps = PropsWithChildren<CreateEditorStoreInput>;

export function EditorStoreProvider({
  children,
  funnelPage,
  elements,
  initialPreviewMode,
}: EditorStoreProviderProps) {
  const [store] = useState(() =>
    createEditorStore({
      funnelPage,
      elements,
      initialPreviewMode,
    }),
  );

  return <EditorStoreContext.Provider value={store}>{children}</EditorStoreContext.Provider>;
}

export function useEditorStore<T>(selector: (store: EditorStore) => T): T {
  const store = useContext(EditorStoreContext);

  if (!store) {
    throw new Error("useEditorStore must be used within EditorStoreProvider");
  }

  return useStore(store, selector);
}

export type { FunnelPage };
