import type { Agency, AgencySidebarOption } from "@/lib/types";

import { MenuOptions } from "./menu-options";

type SidebarProps = {
  details: Agency;
  sidebarOptions: AgencySidebarOption[];
};

export function Sidebar({ details, sidebarOptions }: SidebarProps) {
  return (
    <aside className="hidden h-screen shrink-0 md:block">
      <MenuOptions details={details} sidebarOptions={sidebarOptions} />
    </aside>
  );
}
