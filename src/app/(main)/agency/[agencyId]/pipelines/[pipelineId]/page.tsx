import { redirect } from "next/navigation";

import { KanbanBoard } from "@/app/(main)/agency/[agencyId]/pipelines/_components/kanban-board";
import { PipelineNav } from "@/app/(main)/agency/[agencyId]/pipelines/_components/pipeline-nav";
import {
  getAuthUserDetails,
  getLanesWithTicketAndTags,
  getPipelineDetails,
  getPipelines,
  getTagsForAgency,
  getTeamMembers,
} from "@/lib/queries";

export default async function PipelineBoardPage({
  params,
}: {
  params: Promise<{ agencyId: string; pipelineId: string }>;
}) {
  const { agencyId, pipelineId } = await params;
  const userDetails = await getAuthUserDetails();

  if (!userDetails?.agency) {
    redirect("/agency");
  }

  if (userDetails.agencyId !== agencyId) {
    redirect("/agency/unauthorized");
  }

  const pipeline = await getPipelineDetails(pipelineId);

  if (!pipeline || pipeline.agencyId !== agencyId) {
    redirect(`/agency/${agencyId}/pipelines`);
  }

  const [pipelines, lanes, agencyWithTags, teamMembers] = await Promise.all([
    getPipelines(agencyId),
    getLanesWithTicketAndTags(pipelineId),
    getTagsForAgency(agencyId),
    getTeamMembers(agencyId),
  ]);

  return (
    <main className="min-h-full bg-background px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <PipelineNav
          agencyId={agencyId}
          currentPipelineId={pipelineId}
          pipelines={pipelines}
        />

        <KanbanBoard
          agencyId={agencyId}
          pipelineId={pipelineId}
          initialLanes={lanes}
          tags={agencyWithTags?.tags ?? []}
          teamMembers={teamMembers}
        />
      </div>
    </main>
  );
}
