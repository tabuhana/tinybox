"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ModalData = {
  title: string;
  description?: ReactNode;
};

type ModalContextValue = {
  data: ModalData | null;
  setOpen: (data: ModalData) => void;
  setClose: () => void;
  isOpen: boolean;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return ctx;
}

function ModalProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ModalData | null>(null);

  const setOpen = useCallback((next: ModalData) => {
    setData(next);
  }, []);

  const setClose = useCallback(() => {
    setData(null);
  }, []);

  const isOpen = data !== null;

  const value = useMemo(
    () => ({ data, setOpen, setClose, isOpen }),
    [data, setOpen, setClose, isOpen],
  );

  const showingModal =
    isOpen && data ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          type="button"
          aria-label="Close modal"
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={setClose}
        />
        <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg">
          <h2 id="modal-title" className="text-lg font-semibold">
            {data.title}
          </h2>
          {data.description ? (
            <div className="mt-2 text-sm text-muted-foreground">{data.description}</div>
          ) : null}
          <button
            type="button"
            onClick={setClose}
            className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    ) : null;

  return (
    <ModalContext.Provider value={value}>
      {children}
      {showingModal}
    </ModalContext.Provider>
  );
}

export default ModalProvider;
