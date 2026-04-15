"use server";

import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser } from "./auth-server";
import { db } from "./db";
import * as schema from "./db/schema";
import {
  CreateFunnelFormSchema,
  type Agency,
  type CreateMediaType,
  type FunnelPage,
  type Lane,
  type Tag,
  type Ticket,
  type User,
} from "./types";

type TeamUserInput = Pick<User, "id" | "email" | "name" | "avatarUrl" | "role">;
type AgencyRole = Extract<
  User["role"],
  "AGENCY_OWNER" | "AGENCY_ADMIN" | "AGENCY_MEMBER" | "AGENCY_USER"
>;

export const getAuthUserDetails = async () => {
  const authUser = await getCurrentUser();

  if (!authUser?.email) {
    return;
  }

  const userData = await db.query.user.findFirst({
    where: eq(schema.user.email, authUser.email),
    with: {
      agency: {
        with: {
          agencySidebarOptions: true,
        },
      },
    },
  });

  return userData;
};

export const getAgencyDashboardData = async (agencyId: string) => {
  return db.query.agency.findFirst({
    where: eq(schema.agency.id, agencyId),
    with: {
      pipelines: {
        with: {
          lanes: {
            with: {
              tickets: true,
            },
          },
        },
      },
      funnels: {
        with: {
          funnelPages: true,
        },
      },
      contacts: true,
    },
  });
};

export const saveActivityLogsNotification = async ({
  agencyId,
  description,
}: {
  agencyId: string;
  description: string;
}) => {
  const authUser = await getCurrentUser();
  let userData: User | undefined;

  if (!authUser?.email) {
    const result = await db.query.user.findFirst({
      where: eq(schema.user.agencyId, agencyId),
    });

    if (result) {
      userData = result;
    }
  } else {
    const result = await db.query.user.findFirst({
      where: eq(schema.user.email, authUser.email),
    });

    if (result) {
      userData = result;
    }
  }

  if (!userData) {
    console.log("Could not find a user");
    return;
  }

  await db.insert(schema.notification).values({
    message: `${userData.name} | ${description}`,
    userId: userData.id,
    agencyId,
  });
};

export const initUser = async (newUser: Partial<User>) => {
  const authUser = await getCurrentUser();

  if (!authUser?.email || !authUser.id) {
    return;
  }

  const existing = await db.query.user.findFirst({
    where: eq(schema.user.email, authUser.email),
  });

  if (existing) {
    await db
      .update(schema.user)
      .set(newUser)
      .where(eq(schema.user.email, authUser.email));
  } else {
    await db.insert(schema.user).values({
      id: authUser.id,
      avatarUrl: authUser.image ?? "",
      email: authUser.email,
      name: authUser.name ?? authUser.email,
      role: newUser.role ?? "AGENCY_USER",
    });
  }

  return db.query.user.findFirst({
    where: eq(schema.user.email, authUser.email),
  });
};

export const createTeamUser = async (agencyId: string, user: TeamUserInput) => {
  if (user.role === "AGENCY_OWNER") {
    return null;
  }

  try {
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.email, user.email),
    });

    if (existingUser?.agencyId && existingUser.agencyId !== agencyId) {
      console.log("User already belongs to another agency");
      return null;
    }

    if (existingUser) {
      await db
        .update(schema.user)
        .set({
          agencyId,
          role: user.role,
          avatarUrl: user.avatarUrl,
          name: user.name,
          updatedAt: new Date(),
        })
        .where(eq(schema.user.email, user.email));

      return db.query.user.findFirst({
        where: eq(schema.user.email, user.email),
      });
    }

    await db.insert(schema.user).values({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      agencyId,
      role: user.role,
    });

    return db.query.user.findFirst({
      where: eq(schema.user.email, user.email),
    });
  } catch (error) {
    console.log("Error creating team user:", error);
    return null;
  }
};

export const verifyAndAcceptInvitation = async () => {
  const authUser = await getCurrentUser();

  if (!authUser?.email) {
    redirect("/agency/sign-in");
  }

  const invitationExists = await db.query.invitation.findFirst({
    where: and(
      eq(schema.invitation.email, authUser.email),
      eq(schema.invitation.status, "PENDING"),
    ),
  });

  if (invitationExists) {
    const userDetails = await createTeamUser(invitationExists.agencyId, {
      email: invitationExists.email,
      avatarUrl: authUser.image ?? "",
      id: authUser.id,
      name: authUser.name ?? authUser.email,
      role: invitationExists.role,
    });

    await saveActivityLogsNotification({
      agencyId: invitationExists.agencyId,
      description: "Joined",
    });

    if (userDetails) {
      await db
        .delete(schema.invitation)
        .where(eq(schema.invitation.email, userDetails.email));

      return userDetails.agencyId;
    }

    return null;
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(schema.user.email, authUser.email),
  });

  return existingUser?.agencyId ?? null;
};

export const getUser = async (id: string) => {
  return db.query.user.findFirst({ where: eq(schema.user.id, id) });
};

export const getTeamMembers = async (agencyId: string) => {
  return db.query.user.findMany({
    where: eq(schema.user.agencyId, agencyId),
    orderBy: asc(schema.user.name),
  });
};

export const updateUser = async (userData: Partial<User>) => {
  if (!userData.email) {
    throw new Error("Email required");
  }

  await db
    .update(schema.user)
    .set(userData)
    .where(eq(schema.user.email, userData.email));

  return db.query.user.findFirst({
    where: eq(schema.user.email, userData.email),
  });
};

export const deleteUser = async (userId: string) => {
  const deletedUser = await db.query.user.findFirst({
    where: eq(schema.user.id, userId),
  });

  await db.delete(schema.user).where(eq(schema.user.id, userId));

  return deletedUser;
};

export const sendInvitation = async (
  role: AgencyRole,
  email: string,
  agencyId: string,
) => {
  await db.insert(schema.invitation).values({ email, agencyId, role });

  return db.query.invitation.findFirst({
    where: eq(schema.invitation.email, email),
  });
};

export const getNotificationAndUser = async (agencyId: string) => {
  try {
    return await db.query.notification.findMany({
      where: eq(schema.notification.agencyId, agencyId),
      with: { user: true },
      orderBy: desc(schema.notification.createdAt),
    });
  } catch (error) {
    console.log(error);
  }
};

export const upsertAgency = async (agencyData: Agency, price?: string) => {
  void price;

  if (!agencyData.companyEmail) {
    return null;
  }

  try {
    const existingAgency = await db.query.agency.findFirst({
      where: eq(schema.agency.id, agencyData.id),
    });

    if (existingAgency) {
      await db
        .update(schema.agency)
        .set(agencyData)
        .where(eq(schema.agency.id, agencyData.id));

      return db.query.agency.findFirst({
        where: eq(schema.agency.id, agencyData.id),
      });
    }

    await db.insert(schema.agency).values(agencyData);

    await db
      .update(schema.user)
      .set({ agencyId: agencyData.id })
      .where(eq(schema.user.email, agencyData.companyEmail));

    const sidebarDefaults = [
      { name: "Dashboard", icon: "box" as const, link: `/agency/${agencyData.id}` },
      {
        name: "Launchpad",
        icon: "star" as const,
        link: `/agency/${agencyData.id}/launchpad`,
      },
      {
        name: "Billing",
        icon: "briefcase" as const,
        link: `/agency/${agencyData.id}/billing`,
      },
      {
        name: "Settings",
        icon: "info" as const,
        link: `/agency/${agencyData.id}/settings`,
      },
      {
        name: "Funnels",
        icon: "globe" as const,
        link: `/agency/${agencyData.id}/funnels`,
      },
      {
        name: "Media",
        icon: "file" as const,
        link: `/agency/${agencyData.id}/media`,
      },
      {
        name: "Automations",
        icon: "code" as const,
        link: `/agency/${agencyData.id}/automations`,
      },
      {
        name: "Pipelines",
        icon: "database" as const,
        link: `/agency/${agencyData.id}/pipelines`,
      },
      {
        name: "Contacts",
        icon: "star" as const,
        link: `/agency/${agencyData.id}/contacts`,
      },
      {
        name: "Team",
        icon: "briefcase" as const,
        link: `/agency/${agencyData.id}/team`,
      },
    ];

    await db.insert(schema.agencySidebarOption).values(
      sidebarDefaults.map((option, index) => ({
        ...option,
        agencyId: agencyData.id,
        order: index,
      })),
    );

    await db.insert(schema.pipeline).values({
      name: "Lead Cycle",
      agencyId: agencyData.id,
    });

    return db.query.agency.findFirst({
      where: eq(schema.agency.id, agencyData.id),
    });
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const updateAgencyDetails = async (
  agencyId: string,
  agencyDetails: Partial<Agency>,
) => {
  await db
    .update(schema.agency)
    .set(agencyDetails)
    .where(eq(schema.agency.id, agencyId));

  return db.query.agency.findFirst({
    where: eq(schema.agency.id, agencyId),
  });
};

export const deleteAgency = async (agencyId: string) => {
  await db.delete(schema.agency).where(eq(schema.agency.id, agencyId));
};

export const getPipelines = async (agencyId: string) => {
  return db.query.pipeline.findMany({
    where: eq(schema.pipeline.agencyId, agencyId),
    with: {
      lanes: {
        with: { tickets: true },
      },
    },
  });
};

export const getPipelineDetails = async (pipelineId: string) => {
  return db.query.pipeline.findFirst({
    where: eq(schema.pipeline.id, pipelineId),
  });
};

export const upsertPipeline = async (pipelineData: {
  id?: string;
  name: string;
  agencyId: string;
}) => {
  const id = pipelineData.id ?? crypto.randomUUID();
  const existing = await db.query.pipeline.findFirst({
    where: eq(schema.pipeline.id, id),
  });

  if (existing) {
    await db.update(schema.pipeline).set(pipelineData).where(eq(schema.pipeline.id, id));
  } else {
    await db.insert(schema.pipeline).values({ ...pipelineData, id });
  }

  return db.query.pipeline.findFirst({
    where: eq(schema.pipeline.id, id),
  });
};

export const deletePipeline = async (pipelineId: string) => {
  await db.delete(schema.pipeline).where(eq(schema.pipeline.id, pipelineId));
};

export const getLanesWithTicketAndTags = async (pipelineId: string) => {
  const lanes = await db.query.lane.findMany({
    where: eq(schema.lane.pipelineId, pipelineId),
    orderBy: asc(schema.lane.order),
    with: {
      tickets: {
        orderBy: asc(schema.ticket.order),
        with: {
          assignedUser: true,
          customer: true,
          tagToTickets: {
            with: { tag: true },
          },
        },
      },
    },
  });

  return lanes.map((lane) => ({
    ...lane,
    tickets: lane.tickets.map((ticket) => ({
      ...ticket,
      tags: ticket.tagToTickets.map((tagToTicket) => tagToTicket.tag),
    })),
  }));
};

export const upsertLane = async (laneData: {
  id?: string;
  name: string;
  pipelineId: string;
  order?: number;
}) => {
  let order = laneData.order;

  if (order === undefined || order === null) {
    const existingLanes = await db.query.lane.findMany({
      where: eq(schema.lane.pipelineId, laneData.pipelineId),
    });
    order = existingLanes.length;
  }

  const id = laneData.id ?? crypto.randomUUID();
  const existing = await db.query.lane.findFirst({
    where: eq(schema.lane.id, id),
  });

  if (existing) {
    await db.update(schema.lane).set({ ...laneData, order }).where(eq(schema.lane.id, id));
  } else {
    await db.insert(schema.lane).values({ ...laneData, id, order });
  }

  return db.query.lane.findFirst({
    where: eq(schema.lane.id, id),
  });
};

export const deleteLane = async (laneId: string) => {
  await db.delete(schema.lane).where(eq(schema.lane.id, laneId));
};

export const updateLanesOrder = async (lanes: Lane[]) => {
  try {
    await db.transaction(async (tx) => {
      for (const lane of lanes) {
        await tx.update(schema.lane).set({ order: lane.order }).where(eq(schema.lane.id, lane.id));
      }
    });
  } catch (error) {
    console.log(error, "ERROR UPDATE LANES ORDER");
  }
};

export const updateTicketsOrder = async (tickets: Ticket[]) => {
  try {
    await db.transaction(async (tx) => {
      for (const ticket of tickets) {
        await tx
          .update(schema.ticket)
          .set({ order: ticket.order, laneId: ticket.laneId })
          .where(eq(schema.ticket.id, ticket.id));
      }
    });
  } catch (error) {
    console.log(error, "ERROR UPDATE TICKET ORDER");
  }
};

export const updateFunnelPagesOrder = async (pages: FunnelPage[]) => {
  try {
    await db.transaction(async (tx) => {
      for (const page of pages) {
        await tx
          .update(schema.funnelPage)
          .set({ order: page.order })
          .where(eq(schema.funnelPage.id, page.id));
      }
    });
  } catch (error) {
    console.log(error, "ERROR UPDATE FUNNEL PAGES ORDER");
  }
};

export const upsertTicket = async (
  ticketData: {
    id?: string;
    name: string;
    laneId: string;
    order?: number;
    value?: string;
    description?: string;
    customerId?: string;
    assignedUserId?: string;
  },
  tags: Tag[],
) => {
  let order = ticketData.order;

  if (order === undefined || order === null) {
    const existingTickets = await db.query.ticket.findMany({
      where: eq(schema.ticket.laneId, ticketData.laneId),
    });
    order = existingTickets.length;
  }

  const id = ticketData.id ?? crypto.randomUUID();
  const existing = await db.query.ticket.findFirst({
    where: eq(schema.ticket.id, id),
  });

  if (existing) {
    await db.update(schema.ticket).set({ ...ticketData, order }).where(eq(schema.ticket.id, id));
    await db.delete(schema.tagToTicket).where(eq(schema.tagToTicket.ticketId, id));
  } else {
    await db.insert(schema.ticket).values({ ...ticketData, id, order });
  }

  if (tags.length > 0) {
    await db
      .insert(schema.tagToTicket)
      .values(tags.map((tag) => ({ tagId: tag.id, ticketId: id })));
  }

  const result = await db.query.ticket.findFirst({
    where: eq(schema.ticket.id, id),
    with: {
      assignedUser: true,
      customer: true,
      lane: true,
      tagToTickets: { with: { tag: true } },
    },
  });

  if (!result) {
    return null;
  }

  return {
    ...result,
    tags: result.tagToTickets.map((tagToTicket) => tagToTicket.tag),
  };
};

export const deleteTicket = async (ticketId: string) => {
  await db.delete(schema.tagToTicket).where(eq(schema.tagToTicket.ticketId, ticketId));
  await db.delete(schema.ticket).where(eq(schema.ticket.id, ticketId));
};

export const getTicketsWithTags = async (pipelineId: string) => {
  const tickets = await db.query.ticket.findMany({
    where: sql`${schema.ticket.laneId} in (
      select ${schema.lane.id}
      from ${schema.lane}
      where ${schema.lane.pipelineId} = ${pipelineId}
    )`,
    with: {
      assignedUser: true,
      customer: true,
      tagToTickets: { with: { tag: true } },
    },
  });

  return tickets.map((ticket) => ({
    ...ticket,
    tags: ticket.tagToTickets.map((tagToTicket) => tagToTicket.tag),
  }));
};

export const _getTicketsWithAllRelations = async (laneId: string) => {
  const tickets = await db.query.ticket.findMany({
    where: eq(schema.ticket.laneId, laneId),
    with: {
      assignedUser: true,
      customer: true,
      lane: true,
      tagToTickets: { with: { tag: true } },
    },
  });

  return tickets.map((ticket) => ({
    ...ticket,
    tags: ticket.tagToTickets.map((tagToTicket) => tagToTicket.tag),
  }));
};

export const upsertTag = async (
  agencyId: string,
  tagData: { id?: string; name: string; color: string },
) => {
  const id = tagData.id ?? crypto.randomUUID();
  const existing = await db.query.tag.findFirst({
    where: and(eq(schema.tag.id, id), eq(schema.tag.agencyId, agencyId)),
  });

  if (existing) {
    await db.update(schema.tag).set(tagData).where(eq(schema.tag.id, id));
  } else {
    await db.insert(schema.tag).values({ ...tagData, id, agencyId });
  }

  return db.query.tag.findFirst({
    where: eq(schema.tag.id, id),
  });
};

export const getTagsForAgency = async (agencyId: string) => {
  return db.query.agency.findFirst({
    where: eq(schema.agency.id, agencyId),
    with: { tags: true },
  });
};

export const deleteTag = async (tagId: string) => {
  await db.delete(schema.tagToTicket).where(eq(schema.tagToTicket.tagId, tagId));
  await db.delete(schema.tag).where(eq(schema.tag.id, tagId));
};

export const getMedia = async (agencyId: string) => {
  return db.query.agency.findFirst({
    where: eq(schema.agency.id, agencyId),
    with: { media: true },
  });
};

export const createMedia = async (agencyId: string, mediaFile: CreateMediaType) => {
  await db.insert(schema.media).values({
    type: mediaFile.type,
    link: mediaFile.link,
    name: mediaFile.name,
    agencyId,
  });

  return db.query.media.findFirst({
    where: eq(schema.media.link, mediaFile.link),
  });
};

export const deleteMedia = async (mediaId: string) => {
  await db.delete(schema.media).where(eq(schema.media.id, mediaId));
};

export const getFunnels = async (agencyId: string) => {
  return db.query.funnel.findMany({
    where: eq(schema.funnel.agencyId, agencyId),
    with: { funnelPages: true },
  });
};

export const getFunnel = async (funnelId: string) => {
  return db.query.funnel.findFirst({
    where: eq(schema.funnel.id, funnelId),
    with: {
      funnelPages: {
        orderBy: asc(schema.funnelPage.order),
      },
    },
  });
};

export const upsertFunnel = async (
  agencyId: string,
  funnelData: Omit<z.infer<typeof CreateFunnelFormSchema>, "agencyId"> & {
    liveProducts: string;
  },
  funnelId: string,
) => {
  const id = funnelId || crypto.randomUUID();
  const existing = await db.query.funnel.findFirst({
    where: eq(schema.funnel.id, id),
  });

  if (existing) {
    await db
      .update(schema.funnel)
      .set({ ...funnelData, agencyId })
      .where(eq(schema.funnel.id, id));
  } else {
    await db.insert(schema.funnel).values({
      ...funnelData,
      id,
      agencyId,
    });
  }

  return db.query.funnel.findFirst({ where: eq(schema.funnel.id, id) });
};

export const updateFunnelProducts = async (products: string, funnelId: string) => {
  await db
    .update(schema.funnel)
    .set({ liveProducts: products })
    .where(eq(schema.funnel.id, funnelId));

  return db.query.funnel.findFirst({ where: eq(schema.funnel.id, funnelId) });
};

export const upsertFunnelPage = async (
  agencyId: string,
  funnelPageData: {
    id?: string;
    name: string;
    pathName?: string;
    order: number;
    content?: string;
    previewImage?: string;
    visits?: number;
  },
  funnelId: string,
) => {
  if (!agencyId || !funnelId) {
    return;
  }

  const pageId = funnelPageData.id ?? crypto.randomUUID();
  const existing = await db.query.funnelPage.findFirst({
    where: eq(schema.funnelPage.id, pageId),
  });

  const defaultContent = JSON.stringify([
    {
      content: [],
      id: "__body",
      name: "Body",
      styles: { backgroundColor: "white" },
      type: "__body",
    },
  ]);

  if (existing) {
    await db
      .update(schema.funnelPage)
      .set({
        ...funnelPageData,
        pathName: funnelPageData.pathName ?? existing.pathName,
      })
      .where(eq(schema.funnelPage.id, pageId));
  } else {
    await db.insert(schema.funnelPage).values({
      ...funnelPageData,
      id: pageId,
      pathName: funnelPageData.pathName ?? "",
      content: funnelPageData.content ?? defaultContent,
      funnelId,
    });
  }

  revalidatePath(`/agency/${agencyId}/funnels/${funnelId}`, "page");

  return db.query.funnelPage.findFirst({
    where: eq(schema.funnelPage.id, pageId),
  });
};

export const deleteFunnelPage = async (funnelPageId: string) => {
  await db.delete(schema.funnelPage).where(eq(schema.funnelPage.id, funnelPageId));
};

export const getFunnelPageDetails = async (funnelPageId: string) => {
  return db.query.funnelPage.findFirst({
    where: eq(schema.funnelPage.id, funnelPageId),
  });
};

export const getDomainContent = async (subDomainName: string) => {
  return db.query.funnel.findFirst({
    where: eq(schema.funnel.subDomainName, subDomainName),
    with: {
      funnelPages: {
        orderBy: asc(schema.funnelPage.order),
      },
    },
  });
};

export const searchContacts = async (searchTerms: string) => {
  return db.query.contact.findMany({
    where: like(schema.contact.name, `%${searchTerms}%`),
  });
};

export const getContactsByAgencyId = async (agencyId: string) => {
  return db.query.contact.findMany({
    where: eq(schema.contact.agencyId, agencyId),
    orderBy: desc(schema.contact.createdAt),
  });
};

export const upsertContact = async (contactData: {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  agencyId: string;
}) => {
  const id = contactData.id ?? crypto.randomUUID();
  const existing = await db.query.contact.findFirst({
    where: eq(schema.contact.id, id),
  });

  if (existing) {
    await db.update(schema.contact).set(contactData).where(eq(schema.contact.id, id));
  } else {
    await db.insert(schema.contact).values({ ...contactData, id });
  }

  return db.query.contact.findFirst({ where: eq(schema.contact.id, id) });
};

export const deleteContact = async (contactId: string) => {
  await db.delete(schema.contact).where(eq(schema.contact.id, contactId));
};
