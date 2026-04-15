import { Layers2, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { PipelineForm } from "@/components/forms/pipeline-form";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getAuthUserDetails, getPipelines } from "@/lib/queries";

export default async function PipelinesPage({
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

  const pipelines = await getPipelines(agencyId);

  if (pipelines.length) {
    redirect(`/agency/${agencyId}/pipelines/${pipelines[0].id}`);
  }

  return (
    <main className="min-h-full bg-background px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-linear-to-br from-primary/12 via-background to-background shadow-lg shadow-primary/5">
          <div className="space-y-4 px-6 py-8 md:px-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Pipeline setup
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Build your first pipeline board
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Create a pipeline to organize every opportunity from first touch through close.
                Once the board exists, you can add lanes, tickets, owners, and tags from one
                command center.
              </p>
            </div>
          </div>
        </section>

        <Empty className="rounded-[2rem] border border-dashed border-border/70 bg-card/80 px-6 py-14 shadow-sm shadow-primary/5">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Layers2 className="size-5 text-primary" />
            </EmptyMedia>
            <EmptyTitle>No pipelines yet</EmptyTitle>
            <EmptyDescription>
              Start with a single board for your core workflow, then branch into specialized
              pipelines as the agency grows.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <PipelineForm agencyId={agencyId} triggerLabel="Create pipeline" />
          </EmptyContent>
        </Empty>
      </div>
    </main>
  );
}
