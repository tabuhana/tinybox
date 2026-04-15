import {
  Building2,
  ChartColumnBig,
  Globe2,
  Mail,
  MapPin,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { redirect } from "next/navigation";

import { DashboardCharts } from "./_components/dashboard-charts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getAgencyDashboardData, getAuthUserDetails } from "@/lib/queries";

function formatLocation(city?: string | null, state?: string | null, country?: string | null) {
  return [city, state, country].filter(Boolean).join(", ") || "Location not set";
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const chartPalette = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
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

  const agency = await getAgencyDashboardData(agencyId);

  if (!agency) {
    redirect("/agency");
  }

  const totalPipelineValue = agency.pipelines.reduce(
    (pipelineSum, pipeline) =>
      pipelineSum +
      pipeline.lanes.reduce(
        (laneSum, lane) =>
          laneSum + lane.tickets.reduce((ticketSum, ticket) => ticketSum + Number(ticket.value ?? 0), 0),
        0,
      ),
    0,
  );

  const totalVisits = agency.funnels.reduce(
    (funnelSum, funnel) =>
      funnelSum + funnel.funnelPages.reduce((pageSum, page) => pageSum + page.visits, 0),
    0,
  );

  const contactCount = agency.contacts.length;
  const goalValue = Number(agency.goal ?? 0);
  const goalProgress = goalValue > 0 ? Math.min((totalPipelineValue / goalValue) * 100, 100) : 0;

  const pipelineValueData = agency.pipelines
    .map((pipeline, index) => ({
      name: pipeline.name,
      value: Number(
        pipeline.lanes
          .reduce(
            (laneSum, lane) =>
              laneSum + lane.tickets.reduce((ticketSum, ticket) => ticketSum + Number(ticket.value ?? 0), 0),
            0,
          )
          .toFixed(2),
      ),
      fill: chartPalette[index % chartPalette.length],
    }))
    .sort((left, right) => right.value - left.value);

  const funnelPerformanceData = agency.funnels.flatMap((funnel) =>
    [...funnel.funnelPages]
      .sort((left, right) => left.order - right.order)
      .map((page) => ({
        label: page.name,
        visits: page.visits,
        funnelName: funnel.name,
      })),
  );

  return (
    <div className="min-h-full bg-background px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
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
                  Track the health of your agency with live pipeline totals, funnel traffic, goal progress,
                  and a Stripe-ready revenue slot that stays safely in placeholder mode until billing is
                  connected.
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card className="border border-border/60 bg-card/90">
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Revenue / MRR
              </div>
              <CardTitle className="text-3xl">$--</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Connect Stripe to view recurring revenue and billing trend data.</p>
              <Badge variant="outline">Placeholder</Badge>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/90">
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                Goal Progress
              </div>
              <CardTitle className="text-3xl">
                {goalValue > 0 ? `${Math.round(goalProgress)}%` : "No goal"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current pipeline value</span>
                <span className="font-medium">{formatCurrency(totalPipelineValue)}</span>
              </div>
              <Progress value={goalProgress} />
              <p className="text-sm text-muted-foreground">
                {goalValue > 0
                  ? `${formatCurrency(goalValue)} target for this agency`
                  : "Set an agency goal in settings to track progress here."}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/90">
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ChartColumnBig className="h-4 w-4" />
                Pipeline Value
              </div>
              <CardTitle className="text-3xl">{formatCurrency(totalPipelineValue)}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Spread across {formatNumber(agency.pipelines.length)} pipeline
              {agency.pipelines.length === 1 ? "" : "s"}.
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/90">
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                Contacts
              </div>
              <CardTitle className="text-3xl">{formatNumber(contactCount)}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Total contacts currently associated with this agency.
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/90">
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe2 className="h-4 w-4" />
                Funnel Visits
              </div>
              <CardTitle className="text-3xl">{formatNumber(totalVisits)}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Combined traffic across {formatNumber(agency.funnels.length)} funnel
              {agency.funnels.length === 1 ? "" : "s"}.
            </CardContent>
          </Card>
        </section>

        <DashboardCharts
          funnelPerformanceData={funnelPerformanceData}
          pipelineValueData={pipelineValueData}
        />

        <Card className="border border-dashed border-border/70 bg-linear-to-br from-muted/40 via-background to-background">
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Stripe Placeholder
            </div>
            <CardTitle className="text-2xl">Revenue analytics will land here</CardTitle>
            <CardDescription className="max-w-2xl">
              Billing is intentionally left disconnected for now. Once Stripe is configured, this section
              can be upgraded with subscription metrics, plan breakdowns, and MRR trend charts without
              changing the rest of the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.75rem] border border-border/60 bg-card/80 p-6">
                <p className="text-sm font-medium text-foreground">Stripe-backed metrics slot</p>
                <div className="mt-6 grid gap-3">
                  {["MRR trend", "Active subscriptions", "Plan mix", "Churn insights"].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-2xl border border-dashed border-border/60 px-4 py-3"
                    >
                      <span className="text-sm text-muted-foreground">{item}</span>
                      <span className="text-sm font-medium text-foreground">Pending Stripe</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-[1.75rem] border border-border/60 bg-card/80 p-6">
                <div className="space-y-3">
                  <Badge variant="outline">Stripe not connected</Badge>
                  <p className="text-3xl font-semibold tracking-tight">$--</p>
                  <p className="text-sm text-muted-foreground">
                    Revenue placeholders are visible so the layout is ready, but no billing data will load
                    until Stripe is configured.
                  </p>
                </div>
                <Button disabled variant="outline">
                  Connect Stripe
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
