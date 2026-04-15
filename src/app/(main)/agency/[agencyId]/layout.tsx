import { redirect } from "next/navigation";

import { Infobar } from "@/components/global/infobar";
import { Sidebar } from "@/components/sidebar";
import { getAuthUserDetails, getNotificationAndUser } from "@/lib/queries";

export default async function AgencyIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ agencyId: string }>;
}) {
  const { agencyId } = await params;

  const [userDetails, notifications] = await Promise.all([
    getAuthUserDetails(),
    getNotificationAndUser(agencyId),
  ]);

  if (!userDetails?.agency) {
    redirect("/agency");
  }

  if (userDetails.agencyId !== agencyId) {
    redirect("/agency/unauthorized");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        details={userDetails.agency}
        sidebarOptions={userDetails.agency.agencySidebarOptions}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Infobar notifications={notifications ?? []} />
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}
