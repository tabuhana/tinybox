"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMedia } from "@/lib/queries";

const schema = z.object({
  name: z.string().min(1, "Name is required."),
  link: z.url("Enter a valid URL."),
  type: z.enum(["image", "video", "file"]),
});

type Values = z.infer<typeof schema>;

export function UploadMedia({ agencyId }: { agencyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", link: "", type: "image" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await createMedia(agencyId, values);
        toast.success("Media added.");
        form.reset();
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Failed to add media.");
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Add media</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add media from URL</DialogTitle>
          <DialogDescription>
            Paste a link to an image, video, or file hosted on your storage of
            choice. Upload integrations can be wired in later.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="media-name">Name</Label>
            <Input
              id="media-name"
              placeholder="Hero background"
              disabled={isPending}
              {...form.register("name")}
            />
            {form.formState.errors.name?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="media-link">Link</Label>
            <Input
              id="media-link"
              placeholder="https://..."
              disabled={isPending}
              {...form.register("link")}
            />
            {form.formState.errors.link?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.link.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="media-type">Type</Label>
            <Controller
              name="type"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isPending}
                >
                  <SelectTrigger id="media-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding..." : "Add media"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
