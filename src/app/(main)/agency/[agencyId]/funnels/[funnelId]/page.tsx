import { Globe2, LayoutTemplate, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthUserDetails, getFunnel } from "@/lib/queries";

import { FunnelPagesList } from "./_components/funnel-pages-list";
import { FunnelSettings } from "./_components/funnel-settings";

export default async function FunnelDetailPage({
  params,
}: {
  params: Promise<{ agencyId: string; funnelId: string }>;
}) {
  const { agencyId, funnelId } = await params;
  const userDetails = await getAuthUserDetails();

  if (!userDetails?.agency) {
    redirect("/agency");
  }

  if (userDetails.agencyId !== agencyId) {
    redirect("/agency/unauthorized");
  }

  const funnel = await getFunnel(funnelId);

  if (!funnel || funnel.agencyId !== agencyId) {
    redirect(`/agency/${agencyId}/funnels`);
  }

  return (
    <main className="min-h-full bg-background px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-lg shadow-primary/5 backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Funnel detail
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {funnel.name}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Manage the funnel metadata and organize the page sequence here before opening an
                  individual page in the editor route.
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-border/60 bg-muted/30 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <LayoutTemplate className="h-4 w-4 text-primary" />
                {funnel.funnelPages.length} {funnel.funnelPages.length === 1 ? "page" : "pages"}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe2 className="h-4 w-4" />
                {funnel.subDomainName?.trim() || "No subdomain yet"}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border border-border/60 bg-card/90">
            <CardHeader>
              <CardDescription>Status</CardDescription>
              <CardTitle className="text-lg">{funnel.published ? "Published" : "Draft"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Publishing controls can expand here once public delivery flows are implemented.
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/90">
            <CardHeader>
              <CardDescription>Subdomain</CardDescription>
              <CardTitle className="text-lg">
                {funnel.subDomainName?.trim() || "Not configured"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This value is used by domain content lookup for public funnel rendering.
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/90">
            <CardHeader>
              <CardDescription>Page count</CardDescription>
              <CardTitle className="text-lg">{funnel.funnelPages.length}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Reorder the steps below to control the intended visitor flow.
            </CardContent>
          </Card>
        </section>

        <FunnelSettings agencyId={agencyId} funnel={funnel} />
        <FunnelPagesList
          agencyId={agencyId}
          funnelId={funnel.id}
          initialPages={funnel.funnelPages}
        />
      </div>
    </main>
  );
}
