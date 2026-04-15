import type { ReactNode } from "react";

import { SiteNavigation } from "@/components/site/navigation";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <main className="h-full">
      <SiteNavigation />
      {children}
    </main>
  );
}
