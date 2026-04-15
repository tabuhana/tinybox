"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FunnelPerformancePoint = {
  label: string;
  visits: number;
  funnelName: string;
};

type PipelineValuePoint = {
  name: string;
  value: number;
  fill: string;
};

type DashboardChartsProps = {
  funnelPerformanceData: FunnelPerformancePoint[];
  pipelineValueData: PipelineValuePoint[];
};

const visitsChartConfig = {
  visits: {
    label: "Visits",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const pipelineChartConfig = {
  value: {
    label: "Pipeline value",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function DashboardCharts({
  funnelPerformanceData,
  pipelineValueData,
}: DashboardChartsProps) {
  const hasFunnelData = funnelPerformanceData.some((item) => item.visits > 0);
  const hasPipelineData = pipelineValueData.some((item) => item.value > 0);

  return (
    <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      <Card className="border border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle>Funnel Performance</CardTitle>
          <CardDescription>
            Page visits across your funnels based on stored visit counts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasFunnelData ? (
            <ChartContainer className="h-[320px] w-full" config={visitsChartConfig}>
              <AreaChart
                accessibilityLayer
                data={funnelPerformanceData}
                margin={{ left: 12, right: 12, top: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  minTickGap={24}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis axisLine={false} tickLine={false} tickMargin={10} width={44} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => [
                        `${Number(value).toLocaleString()} visits`,
                        item.payload.funnelName,
                      ]}
                    />
                  }
                  cursor={false}
                />
                <Area
                  dataKey="visits"
                  fill="var(--color-visits)"
                  fillOpacity={0.22}
                  stroke="var(--color-visits)"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-muted/20 px-6 text-center text-sm text-muted-foreground">
              Funnel visits will appear here once your pages start receiving traffic.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle>Pipeline Value Mix</CardTitle>
          <CardDescription>
            Current value distribution across every pipeline in this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasPipelineData ? (
            <ChartContainer className="h-[320px] w-full" config={pipelineChartConfig}>
              <PieChart accessibilityLayer>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        `$${Number(value).toLocaleString()}`,
                        name,
                      ]}
                    />
                  }
                />
                <Pie
                  data={pipelineValueData}
                  dataKey="value"
                  innerRadius={72}
                  nameKey="name"
                  paddingAngle={3}
                >
                  {pipelineValueData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-muted/20 px-6 text-center text-sm text-muted-foreground">
              Add ticket values to your pipelines to unlock the portfolio breakdown.
            </div>
          )}
          {hasPipelineData ? (
            <div className="mt-4 grid gap-2">
              {pipelineValueData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl border border-border/50 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium tabular-nums">
                    ${item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
