import { FolderOpen, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { MediaCard } from "@/components/media/media-card";
import { UploadMedia } from "@/components/media/upload-media";
import { getAuthUserDetails, getMedia } from "@/lib/queries";

export default async function MediaPage({
  params,
}: {
  params: Promise<{ agencyId: string }>;
}) {
  const { agencyId } = await params;
  const userDetails = await getAuthUserDetails();

  if (!userDetails?.agency) {
    redirect("/agency");
  }

  if (userDetails.agencyId !== agencyId) {
    redirect("/agency/unauthorized");
  }

  const data = await getMedia(agencyId);
  const media = data?.media ?? [];

  return (
    <div className="min-h-full bg-background px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-lg shadow-primary/5 backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Media library
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Your assets
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Reusable images, videos, and files for funnels and campaigns.
                  Paste a URL from your CDN, storage bucket, or upload service
                  to register the asset here.
                </p>
              </div>
            </div>
            <UploadMedia agencyId={agencyId} />
          </div>
        </section>

        {media.length === 0 ? (
          <section className="flex flex-col items-center justify-center gap-3 rounded-[2rem] border border-dashed border-border/70 bg-card/60 p-12 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-medium">No media yet</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add your first asset by clicking &ldquo;Add media&rdquo;. Assets
              appear here and become available inside the funnel editor.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {media.map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
