"use client";

import {
  Box,
  Briefcase,
  Code,
  Database,
  File,
  Globe,
  Info,
  LogOut,
  Star,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut, useSession } from "@/lib/auth-client";
import type { Agency, AgencySidebarOption } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, LucideIcon> = {
  box: Box,
  briefcase: Briefcase,
  code: Code,
  database: Database,
  file: File,
  globe: Globe,
  star: Star,
  info: Info,
};

type MenuOptionsProps = {
  details: Agency;
  sidebarOptions: AgencySidebarOption[];
};

export function MenuOptions({ details, sidebarOptions }: MenuOptionsProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const sorted = [...sidebarOptions].sort((a, b) => a.order - b.order);

  return (
    <nav className="flex h-full w-[260px] flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Agency branding */}
      <div className="flex items-center gap-3 border-b px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          {details.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-semibold">{details.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {details.companyEmail}
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-0.5">
          {sorted.map((option) => {
            const Icon = iconMap[option.icon] ?? Info;
            const isActive =
              pathname === option.link ||
              (option.link !== `/agency/${details.id}` &&
                pathname.startsWith(option.link));

            return (
              <li key={option.id}>
                <Link
                  href={option.link}
                  title={option.name}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{option.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User info & sign out */}
      <div className="border-t px-3 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">
              {session?.user?.name ?? "User"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {session?.user?.email}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.assign("/agency/sign-in") } })}
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
