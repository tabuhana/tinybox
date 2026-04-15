import { redirect } from "next/navigation";

import { FunnelEditor } from "@/components/funnels/funnel-editor";
import { EditorStoreProvider } from "@/providers/editor-store-provider";
import {
  getAuthUserDetails,
  getFunnel,
  getFunnelPageDetails,
  getMedia,
} from "@/lib/queries";

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

export default async function FunnelPageEditorRoute({
  params,
}: {
  params: Promise<{
    agencyId: string;
    funnelId: string;
    funnelPageId: string;
  }>;
}) {
  const { agencyId, funnelId, funnelPageId } = await params;
  const userDetails = await getAuthUserDetails();

  if (!userDetails?.agency) {
    redirect("/agency");
  }

  if (userDetails.agencyId !== agencyId) {
    redirect("/agency/unauthorized");
  }

  const [funnel, funnelPage, mediaData] = await Promise.all([
    getFunnel(funnelId),
    getFunnelPageDetails(funnelPageId),
    getMedia(agencyId),
  ]);

  if (!funnel || funnel.agencyId !== agencyId) {
    redirect(`/agency/${agencyId}/funnels`);
  }

  if (!funnelPage || funnelPage.funnelId !== funnelId) {
    redirect(`/agency/${agencyId}/funnels/${funnelId}`);
  }

  return (
    <EditorStoreProvider
      key={funnelPage.id}
      funnelPage={funnelPage}
      elements={parseEditorContent(funnelPage.content)}
    >
      <FunnelEditor
        agencyId={agencyId}
        funnelId={funnelId}
        funnelPage={funnelPage}
        media={mediaData?.media ?? []}
      />
    </EditorStoreProvider>
  );
}
