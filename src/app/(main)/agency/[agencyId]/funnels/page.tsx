import { ChartNoAxesColumnIncreasing, FileStack, Globe2, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FunnelForm } from "@/components/forms/funnel-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getAuthUserDetails, getFunnels } from "@/lib/queries";

function formatSubdomain(value?: string | null) {
  return value?.trim() ? value : "No subdomain yet";
}

export default async function AgencyFunnelsPage({
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

  const funnels = await getFunnels(agencyId);

  return (
    <main className="min-h-full bg-background px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-lg shadow-primary/5 backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Funnels
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Funnel workspace
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Create conversion flows, organize their pages, and jump into each funnel&apos;s
                  settings before the editor layer lands in the next phase.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <div className="grid gap-2 rounded-[1.5rem] border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <ChartNoAxesColumnIncreasing className="h-4 w-4 text-primary" />
                  {funnels.length} {funnels.length === 1 ? "funnel" : "funnels"}
                </div>
                <div className="flex items-center gap-2">
                  <FileStack className="h-4 w-4" />
                  {funnels.reduce((total, funnel) => total + funnel.funnelPages.length, 0)} total
                  {" "}pages
                </div>
              </div>

              <FunnelForm
                agencyId={agencyId}
                triggerLabel="Create funnel"
                triggerClassName="w-full sm:w-auto"
              />
            </div>
          </div>
        </section>

        {funnels.length ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {funnels.map((funnel) => (
              <Link
                key={funnel.id}
                href={`/agency/${agencyId}/funnels/${funnel.id}`}
                className="group"
              >
                <Card className="h-full border border-border/60 bg-card/90 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/5">
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{funnel.name}</CardTitle>
                        <CardDescription className="line-clamp-2 min-h-10">
                          {funnel.description?.trim() || "No description yet."}
                        </CardDescription>
                      </div>
                      <div className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {funnel.published ? "Live" : "Draft"}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="grid gap-4 text-sm">
                    <div className="rounded-[1.5rem] border border-border/60 bg-muted/20 p-4">
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <Globe2 className="size-4 text-primary" />
                        {formatSubdomain(funnel.subDomainName)}
                      </div>
                      <p className="mt-2 text-muted-foreground">
                        Open settings to manage funnel details and page order.
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-[1.25rem] border border-border/60 bg-background/80 px-4 py-3 text-muted-foreground">
                      <span>Pages</span>
                      <span className="text-base font-semibold text-foreground">
                        {funnel.funnelPages.length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </section>
        ) : (
          <Card className="border border-dashed border-border/70 bg-linear-to-br from-muted/40 via-background to-background">
            <CardContent className="p-6 md:p-10">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Plus className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No funnels yet</EmptyTitle>
                  <EmptyDescription>
                    Start with your first funnel to organize landing pages, subdomains, and
                    conversion paths for a specific offer.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <FunnelForm agencyId={agencyId} triggerLabel="Create your first funnel" />
                </EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
