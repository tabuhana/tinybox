import { ShieldCheck, Sparkles, Users2 } from "lucide-react";
import { redirect } from "next/navigation";

import { SendInvitation } from "@/app/(main)/agency/[agencyId]/team/_components/send-invitation";
import { TeamTable } from "@/app/(main)/agency/[agencyId]/team/_components/team-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthUserDetails, getTeamMembers } from "@/lib/queries";

function countAdmins(teamMembers: Awaited<ReturnType<typeof getTeamMembers>>) {
  return teamMembers.filter(
    (member) => member.role === "AGENCY_OWNER" || member.role === "AGENCY_ADMIN",
  ).length;
}

export default async function AgencyTeamPage({
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

  const teamMembers = await getTeamMembers(agencyId);
  const adminCount = countAdmins(teamMembers);

  return (
    <main className="min-h-full bg-background px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-linear-to-br from-primary/12 via-background to-background shadow-lg shadow-primary/5">
          <div className="flex flex-col gap-8 px-6 py-8 md:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Team
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Keep your agency roster sharp
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Manage collaborators, refine access levels, and invite the next person
                  into the workspace without leaving your command center.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <SendInvitation agencyId={agencyId} />
              <p className="text-sm text-muted-foreground">
                Invitations are accepted automatically the next time that user enters
                `/agency`.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border border-border/60 bg-card/90">
            <CardHeader>
              <CardDescription>Total teammates</CardDescription>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                {teamMembers.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users2 className="size-4 text-primary" />
              Active members currently tied to this agency
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/90">
            <CardHeader>
              <CardDescription>Admin coverage</CardDescription>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                {adminCount}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              Owners and admins with elevated controls
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/90">
            <CardHeader>
              <CardDescription>Access posture</CardDescription>
              <CardTitle className="text-lg">Invitation-driven onboarding</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              New users inherit their assigned role when they sign in and land on the
              agency gateway.
            </CardContent>
          </Card>
        </section>

        <section>
          <TeamTable
            agencyId={agencyId}
            users={teamMembers}
            currentUserEmail={userDetails.email}
          />
        </section>
      </div>
    </main>
  );
}
