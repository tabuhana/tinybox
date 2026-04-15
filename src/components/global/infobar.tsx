"use client";

import { Bell } from "lucide-react";

import type { NotificationWithUser } from "@/lib/types";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type InfobarProps = {
  notifications: NotificationWithUser[];
};

function getInitials(name?: string | null) {
  const parts = (name ?? "")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "TB";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function formatTimestamp(value: Date | string | null) {
  if (!value) {
    return "Unknown time";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function Infobar({ notifications }: InfobarProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex h-14 items-center justify-end border-b bg-background px-4">
      <Sheet>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="relative" aria-label="Open notifications" />}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </SheetTrigger>
        <SheetContent side="right" className="w-full border-border/60 p-0 sm:max-w-md">
          <SheetHeader className="space-y-2 border-b border-border/60 px-6 py-6">
            <SheetTitle className="text-lg">Notifications</SheetTitle>
            <SheetDescription>
              {notifications.length
                ? `You have ${notifications.length} recent update${notifications.length === 1 ? "" : "s"}.`
                : "You are all caught up for now."}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-7.5rem)]">
            <div className="space-y-1 p-3">
              {notifications.length ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-2xl border border-border/60 bg-card/80 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar size="sm">
                        <AvatarImage
                          src={notification.user.avatarUrl ?? undefined}
                          alt={notification.user.name}
                        />
                        <AvatarFallback>{getInitials(notification.user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm leading-6 text-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  No notifications yet. Activity updates will appear here.
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </header>
  );
}
