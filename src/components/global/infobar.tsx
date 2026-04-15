"use client";

import { Bell } from "lucide-react";

import type { NotificationWithUser } from "@/lib/types";

import { Button } from "@/components/ui/button";

type InfobarProps = {
  notifications: NotificationWithUser[];
};

export function Infobar({ notifications }: InfobarProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex h-14 items-center justify-end border-b bg-background px-4">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <span className="sr-only">Notifications</span>
      </Button>
    </header>
  );
}
