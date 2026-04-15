import type { InferSelectModel } from "drizzle-orm";
import type Stripe from "stripe";
import { z } from "zod";

import * as schema from "@/lib/db/schema";

/** Drizzle row shapes — auth tables use better-auth types (`src/lib/auth.ts`). */
export type User = InferSelectModel<typeof schema.user>;
export type Agency = InferSelectModel<typeof schema.agency>;
export type Tag = InferSelectModel<typeof schema.tag>;
export type Ticket = InferSelectModel<typeof schema.ticket>;
export type Lane = InferSelectModel<typeof schema.lane>;
export type Contact = InferSelectModel<typeof schema.contact>;
export type Notification = InferSelectModel<typeof schema.notification>;
export type Pipeline = InferSelectModel<typeof schema.pipeline>;
export type Funnel = InferSelectModel<typeof schema.funnel>;
export type FunnelPage = InferSelectModel<typeof schema.funnelPage>;
export type Media = InferSelectModel<typeof schema.media>;
export type CreateMediaType = Pick<Media, "name" | "link" | "type">;
export type Invitation = InferSelectModel<typeof schema.invitation>;
export type Subscription = InferSelectModel<typeof schema.subscription>;
export type AgencySidebarOption = InferSelectModel<
  typeof schema.agencySidebarOption
>;

/** Shapes returned by joined queries (not inferred automatically at call sites). */
export type NotificationWithUser = Notification & { user: User };

export type TicketAndTags = Ticket & { tags: Tag[] };

export type LaneDetail = Lane & { tickets: TicketAndTags[] };

export const FunnelPageSchema = z.object({
  name: z.string().min(1),
  pathName: z.string().min(1),
  order: z.coerce.number().int().default(0),
  content: z.string().optional().nullable(),
  funnelId: z.string().min(1),
});

export const CreatePipelineFormSchema = z.object({
  name: z.string().min(1),
  agencyId: z.string().min(1),
});

export const CreateFunnelFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  published: z.boolean().optional(),
  subDomainName: z.string().optional().nullable(),
  agencyId: z.string().min(1),
});

export const LaneFormSchema = z.object({
  name: z.string().min(1),
  order: z.coerce.number().int().default(0),
  pipelineId: z.string().min(1),
});

export const TicketFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  value: z.string().optional().nullable(),
  laneId: z.string().min(1),
  customerId: z.string().optional().nullable(),
  assignedUserId: z.string().optional().nullable(),
});

export const ContactUserFormSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  agencyId: z.string().min(1),
});

/** Stripe SDK is not instantiated here — types only for billing code paths. */
export type StripePriceList = Stripe.ApiList<Stripe.Price>;
