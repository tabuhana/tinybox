"use client";

import { createContext, useContext, type PropsWithChildren } from "react";

type FunnelRuntime = {
  agencyId: string;
  funnelId: string;
  liveMode: boolean;
};

const FunnelRuntimeContext = createContext<FunnelRuntime | null>(null);

export function FunnelRuntimeProvider({
  agencyId,
  funnelId,
  liveMode,
  children,
}: PropsWithChildren<FunnelRuntime>) {
  return (
    <FunnelRuntimeContext.Provider value={{ agencyId, funnelId, liveMode }}>
      {children}
    </FunnelRuntimeContext.Provider>
  );
}

export function useFunnelRuntime() {
  return useContext(FunnelRuntimeContext);
}
