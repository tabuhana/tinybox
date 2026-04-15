"use client";

import { formatDistanceToNow } from "date-fns";
import { FileText, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteMedia } from "@/lib/queries";
import type { Media } from "@/lib/types";

export function MediaCard({ media }: { media: Media }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isImage = media.type === "image";
  const isVideo = media.type === "video";

  const onDelete = () => {
    startTransition(async () => {
      try {
        await deleteMedia(media.id);
        toast.success("Media removed.");
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Failed to remove media.");
      }
    });
  };

  return (
    <div className="group overflow-hidden rounded-3xl border border-border/60 bg-card/90 shadow-sm backdrop-blur">
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-muted/40">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.link}
            alt={media.name}
            className="h-full w-full object-cover"
          />
        ) : isVideo ? (
          <video
            src={media.link}
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
          />
        ) : (
          <FileText className="h-10 w-10 text-muted-foreground" />
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button
                size="icon"
                variant="destructive"
                className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100"
              />
            }
          >
            <Trash2 className="h-4 w-4" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove media?</DialogTitle>
              <DialogDescription>
                This removes the file record from the library. The hosted asset
                itself must be deleted from your storage separately.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={isPending}
              >
                {isPending ? "Removing..." : "Remove"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium">{media.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            Added {formatDistanceToNow(new Date(media.createdAt))} ago
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {media.type}
        </Badge>
      </div>
    </div>
  );
}
