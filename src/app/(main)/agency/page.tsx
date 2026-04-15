import { redirect } from "next/navigation";

import { AgencyDetails } from "@/components/forms/agency-details";
import { verifyAndAcceptInvitation } from "@/lib/queries";

export default async function AgencyPage() {
  const agencyId = await verifyAndAcceptInvitation();

  if (agencyId) {
    redirect(`/agency/${agencyId}`);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="space-y-2 text-center md:text-left">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Agency onboarding
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Create an Agency</h1>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground md:mx-0">
            Get started by defining the details your team will build around. You can refine everything later from settings.
          </p>
        </div>
        <AgencyDetails />
      </div>
    </main>
  );
}
