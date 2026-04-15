import { Building2, ChartColumnBig, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthUserDetails } from "@/lib/queries";

function formatLocation(city?: string | null, state?: string | null, country?: string | null) {
  return [city, state, country].filter(Boolean).join(", ") || "Location not set";
}

export default async function AgencyDashboardPage({
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

  const agency = userDetails.agency;

  return (
    <main className="min-h-full bg-background px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-lg shadow-primary/5 backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Dashboard
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {agency.name}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Your agency dashboard is ready for upcoming analytics modules. For now, this gives you a clear snapshot of the workspace identity and the areas where data visualizations will land next.
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-border/60 bg-muted/30 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                {agency.whiteLabel ? "White label enabled" : "Standard branding mode"}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {agency.companyEmail}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {formatLocation(agency.city, agency.state, agency.country)}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border border-border/60 bg-card/90">
            <CardHeader>
              <CardDescription>Primary contact</CardDescription>
              <CardTitle className="text-lg">{agency.companyEmail}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              {agency.companyPhone || "Phone not set"}
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/90">
            <CardHeader>
              <CardDescription>Address</CardDescription>
              <CardTitle className="text-lg">{agency.address || "Add a mailing address"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {formatLocation(agency.city, agency.state, agency.country)}
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/90">
            <CardHeader>
              <CardDescription>Workspace mode</CardDescription>
              <CardTitle className="text-lg">
                {agency.whiteLabel ? "Client-ready presentation" : "Internal workspace"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {agency.whiteLabel
                ? "Branding controls are turned on for a more polished client experience."
                : "Enable white label in settings when you are ready to tailor the experience."}
            </CardContent>
          </Card>
        </section>

        <Card className="border border-dashed border-border/70 bg-linear-to-br from-muted/40 via-background to-background">
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ChartColumnBig className="h-4 w-4" />
              Charts placeholder
            </div>
            <CardTitle className="text-2xl">Performance insights coming next</CardTitle>
            <CardDescription className="max-w-2xl">
              Phase 9 will replace this placeholder with live chart modules. This panel reserves the space where funnel performance, pipeline flow, and revenue trend views will appear.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.75rem] border border-border/60 bg-card/80 p-6">
                <div className="flex h-64 items-end gap-3">
                  {[35, 55, 42, 78, 66, 88, 72].map((value, index) => (
                    <div
                      key={index}
                      className="flex flex-1 flex-col justify-end gap-3"
                    >
                      <div
                        className="rounded-t-3xl bg-primary/80"
                        style={{ height: `${value}%` }}
                      />
                      <div className="h-2 rounded-full bg-muted" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[1.75rem] border border-border/60 bg-card/80 p-5">
                  <p className="text-sm font-medium">Topline KPI slot</p>
                  <p className="mt-6 text-4xl font-semibold tracking-tight">--</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This will hold your lead-to-close metric summary.
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-border/60 bg-card/80 p-5">
                  <p className="text-sm font-medium">Activity trend slot</p>
                  <div className="mt-6 space-y-3">
                    {[1, 2, 3, 4].map((row) => (
                      <div key={row} className="h-3 rounded-full bg-muted" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Planned for chart and summary widgets once analytics land.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
