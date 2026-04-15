import { redirect } from "next/navigation";

import { AgencyDetails } from "@/components/forms/agency-details";
import { getAuthUserDetails } from "@/lib/queries";

export default async function AgencySettingsPage({
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

  return (
    <main className="min-h-full bg-background px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Settings
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Agency settings</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Update the core details that define how your workspace looks and how your team references the agency internally.
          </p>
        </div>

        <AgencyDetails data={userDetails.agency} />
      </div>
    </main>
  );
}
