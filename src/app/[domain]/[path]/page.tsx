import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";

import { FunnelEditor } from "@/components/funnels/funnel-editor";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getDomainContent } from "@/lib/queries";
import { EditorStoreProvider } from "@/providers/editor-store-provider";

function parseEditorContent(content: string | null) {
  if (!content) {
    return undefined;
  }

  try {
    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

export default async function DomainPathPage({
  params,
}: {
  params: Promise<{ domain: string; path: string }>;
}) {
  const { domain, path } = await params;
  const funnel = await getDomainContent(domain);
  const funnelPage = funnel?.funnelPages.find((page) => page.pathName === path);

  if (!funnel || !funnelPage) {
    notFound();
  }

  await db
    .update(schema.funnelPage)
    .set({
      visits: sql`${schema.funnelPage.visits} + 1`,
    })
    .where(eq(schema.funnelPage.id, funnelPage.id));

  return (
    <EditorStoreProvider
      key={funnelPage.id}
      funnelPage={funnelPage}
      elements={parseEditorContent(funnelPage.content)}
      initialPreviewMode
    >
      <FunnelEditor agencyId={funnel.agencyId} funnelId={funnel.id} funnelPage={funnelPage} liveMode />
    </EditorStoreProvider>
  );
}
