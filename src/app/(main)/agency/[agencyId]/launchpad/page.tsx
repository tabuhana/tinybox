import {
  ArrowRight,
  Check,
  Mail,
  Rocket,
  Settings,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getAgencyDashboardData, getAuthUserDetails } from "@/lib/queries";

type ChecklistItem = {
  icon: typeof Rocket;
  title: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
};

export default async function LaunchpadPage({
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

  const hasFunnel = agency.funnels.length > 0;
  const hasPipeline = agency.pipelines.length > 0;
  const hasContact = agency.contacts.length > 0;
  const profileComplete = Boolean(
    agency.address && agency.city && agency.companyPhone,
  );

  const checklist: ChecklistItem[] = [
    {
      icon: Settings,
      title: "Complete your agency profile",
      description:
        "Add phone, address, and regional details so your workspace feels complete.",
      href: `/agency/${agencyId}/settings`,
      cta: "Open settings",
      done: profileComplete,
    },
    {
      icon: Rocket,
      title: "Launch your first funnel",
      description:
        "Build a landing page with the drag-and-drop editor and publish it on a subdomain.",
      href: `/agency/${agencyId}/funnels`,
      cta: "Go to funnels",
      done: hasFunnel,
    },
    {
      icon: Workflow,
      title: "Create a sales pipeline",
      description:
        "Set up lanes for your tickets and start tracking deals across your agency.",
      href: `/agency/${agencyId}/pipelines`,
      cta: "Open pipelines",
      done: hasPipeline,
    },
    {
      icon: Users,
      title: "Capture your first contact",
      description:
        "Connect a funnel contact form or add a contact manually to start building relationships.",
      href: `/agency/${agencyId}/contacts`,
      cta: "View contacts",
      done: hasContact,
    },
    {
      icon: Mail,
      title: "Invite your team",
      description:
        "Bring collaborators in with role-based invitations sent via email.",
      href: `/agency/${agencyId}/team`,
      cta: "Manage team",
      done: false,
    },
  ];

  const completed = checklist.filter((item) => item.done).length;
  const progress = Math.round((completed / checklist.length) * 100);

  return (
    <div className="min-h-full bg-background px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-lg shadow-primary/5 backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Launchpad
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Get your agency off the ground
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  A short checklist to prepare your workspace. Each step links
                  directly to the page where you can complete it.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 rounded-[1.5rem] border border-border/60 bg-muted/30 p-4 text-sm">
              <Badge variant="outline">
                {completed} / {checklist.length} complete
              </Badge>
              <Progress value={progress} className="w-48" />
              <span className="text-xs text-muted-foreground">
                {progress}% of your launchpad is done
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          {checklist.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="border border-border/60 bg-card/90"
              >
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  <div
                    className={`flex h-10 w-10 flex-none items-center justify-center rounded-2xl ${
                      item.done
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.done ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                  {item.done ? (
                    <Badge variant="outline" className="text-primary">
                      Done
                    </Badge>
                  ) : null}
                </CardHeader>
                <CardContent className="flex justify-end">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    {item.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </div>
  );
}
