import { Sparkles, Users2 } from "lucide-react";
import { redirect } from "next/navigation";

import { ContactForm } from "@/app/(main)/agency/[agencyId]/contacts/_components/contact-form";
import { ContactsTable } from "@/app/(main)/agency/[agencyId]/contacts/_components/contacts-table";
import { getAuthUserDetails, getContactsByAgencyId } from "@/lib/queries";

export default async function AgencyContactsPage({
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

  const contacts = await getContactsByAgencyId(agencyId);

  return (
    <main className="min-h-full bg-background px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-linear-to-br from-primary/12 via-background to-background shadow-lg shadow-primary/5">
          <div className="flex flex-col gap-8 px-6 py-8 md:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Contacts
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Keep customer records organized
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Manage every lead and customer profile in one place so ticketing and funnel work
                  stay linked to real contact details.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <ContactForm agencyId={agencyId} />
              <p className="text-sm text-muted-foreground">
                Contact updates are instantly available across tickets and automation flows.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Users2 className="size-4 text-primary" />
            {contacts.length} total contact{contacts.length === 1 ? "" : "s"}
          </div>
          <ContactsTable agencyId={agencyId} contacts={contacts} />
        </section>
      </div>
    </main>
  );
}
