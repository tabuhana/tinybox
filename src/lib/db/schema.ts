import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const createdAt = () =>
  timestamp("created_at", { mode: "date" }).defaultNow().notNull();

export const updatedAt = () =>
  timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull();

export const roleEnum = pgEnum("role", [
  "USER",
  "ADMIN",
  "AGENCY_OWNER",
  "AGENCY_ADMIN",
  "AGENCY_MEMBER",
  "AGENCY_USER",
]);

export const iconEnum = pgEnum("icon", [
  "box",
  "briefcase",
  "code",
  "database",
  "file",
  "globe",
  "star",
  "info",
]);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "REVOKED",
]);

export const triggerTypesEnum = pgEnum("trigger_types", [
  "MANUAL",
  "SCHEDULE",
  "WEBHOOK",
  "EVENT",
  "CONTACT_FORM",
]);

export const actionTypeEnum = pgEnum("action_type", [
  "CREATE",
  "UPDATE",
  "DELETE",
  "NOTIFY",
  "WEBHOOK",
  "CREATE_CONTACT",
]);

export const planEnum = pgEnum("plan", ["FREE", "PRO", "TEAM", "ENTERPRISE"]);

export const user = pgTable(
  "user",
  {
    id: id(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    avatarUrl: text("avatar_url"),
    role: roleEnum("role").notNull().default("AGENCY_USER"),
    agencyId: text("agency_id").references(() => agency.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("user_agency_id_idx").on(t.agencyId)],
);

export const session = pgTable(
  "session",
  {
    id: id(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: id(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: "date" }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: "date" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: id(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  agency: one(agency, { fields: [user.agencyId], references: [agency.id] }),
  tickets: many(ticket),
  notifications: many(notification),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const agency = pgTable(
  "agency",
  {
    id: id(),
    name: varchar("name", { length: 255 }).notNull(),
    companyEmail: text("company_email").notNull(),
    companyPhone: text("company_phone"),
    whiteLabel: boolean("white_label").default(false).notNull(),
    address: text("address"),
    city: text("city"),
    zipCode: text("zip_code"),
    state: text("state"),
    country: text("country"),
    goal: integer("goal"),
    icon: iconEnum("icon").default("box").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("agency_company_email_idx").on(t.companyEmail)],
);

export const tag = pgTable(
  "tag",
  {
    id: id(),
    name: text("name").notNull(),
    color: text("color"),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agency.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("tag_agency_id_idx").on(t.agencyId)],
);

export const pipeline = pgTable(
  "pipeline",
  {
    id: id(),
    name: text("name").notNull(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agency.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("pipeline_agency_id_idx").on(t.agencyId)],
);

export const lane = pgTable(
  "lane",
  {
    id: id(),
    name: text("name").notNull(),
    order: integer("order").default(0).notNull(),
    pipelineId: text("pipeline_id")
      .notNull()
      .references(() => pipeline.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("lane_pipeline_id_idx").on(t.pipelineId)],
);

export const ticket = pgTable(
  "ticket",
  {
    id: id(),
    name: text("name").notNull(),
    description: text("description"),
    value: decimal("value", { precision: 10, scale: 2 }),
    order: integer("order").default(0).notNull(),
    laneId: text("lane_id")
      .notNull()
      .references(() => lane.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => contact.id, {
      onDelete: "set null",
    }),
    assignedUserId: text("assigned_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("ticket_lane_id_idx").on(t.laneId),
    index("ticket_customer_id_idx").on(t.customerId),
    index("ticket_assigned_user_id_idx").on(t.assignedUserId),
  ],
);

export const tagToTicket = pgTable(
  "tag_to_ticket",
  {
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.tagId, t.ticketId] }),
    index("tag_to_ticket_tag_id_idx").on(t.tagId),
    index("tag_to_ticket_ticket_id_idx").on(t.ticketId),
  ],
);

export const trigger = pgTable(
  "trigger",
  {
    id: id(),
    name: text("name").notNull(),
    type: triggerTypesEnum("type").notNull().default("MANUAL"),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agency.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("trigger_agency_id_idx").on(t.agencyId)],
);

export const automation = pgTable(
  "automation",
  {
    id: id(),
    name: text("name").notNull(),
    published: boolean("published").default(false).notNull(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agency.id, { onDelete: "cascade" }),
    triggerId: text("trigger_id")
      .notNull()
      .references(() => trigger.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("automation_agency_id_idx").on(t.agencyId),
    index("automation_trigger_id_idx").on(t.triggerId),
  ],
);

export const automationInstance = pgTable(
  "automation_instance",
  {
    id: id(),
    status: text("status").default("PENDING").notNull(),
    automationId: text("automation_id")
      .notNull()
      .references(() => automation.id, { onDelete: "cascade" }),
    contactId: text("contact_id").references(() => contact.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("automation_instance_automation_id_idx").on(t.automationId),
    index("automation_instance_contact_id_idx").on(t.contactId),
  ],
);

export const action = pgTable(
  "action",
  {
    id: id(),
    name: text("name").notNull(),
    type: actionTypeEnum("type").notNull().default("CREATE"),
    order: integer("order").default(0).notNull(),
    automationId: text("automation_id")
      .notNull()
      .references(() => automation.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("action_automation_id_idx").on(t.automationId)],
);

export const contact = pgTable(
  "contact",
  {
    id: id(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agency.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("contact_agency_id_idx").on(t.agencyId)],
);

export const media = pgTable(
  "media",
  {
    id: id(),
    type: text("type").notNull(),
    name: text("name").notNull(),
    link: text("link").notNull(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agency.id, { onDelete: "cascade" }),
    uploadedById: text("uploaded_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("media_agency_id_idx").on(t.agencyId),
    index("media_uploaded_by_id_idx").on(t.uploadedById),
  ],
);

export const funnel = pgTable(
  "funnel",
  {
    id: id(),
    name: text("name").notNull(),
    description: text("description"),
    published: boolean("published").default(false).notNull(),
    subDomainName: text("sub_domain_name"),
    liveProducts: text("live_products"),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agency.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("funnel_agency_id_idx").on(t.agencyId)],
);

export const className = pgTable(
  "class_name",
  {
    id: id(),
    name: text("name").notNull(),
    color: text("color"),
    customData: text("custom_data"),
    funnelId: text("funnel_id")
      .notNull()
      .references(() => funnel.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("class_name_funnel_id_idx").on(t.funnelId)],
);

export const funnelPage = pgTable(
  "funnel_page",
  {
    id: id(),
    name: text("name").notNull(),
    pathName: text("path_name").notNull(),
    order: integer("order").default(0).notNull(),
    visits: integer("visits").default(0).notNull(),
    content: text("content"),
    previewImage: text("preview_image"),
    funnelId: text("funnel_id")
      .notNull()
      .references(() => funnel.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("funnel_page_funnel_id_idx").on(t.funnelId)],
);

export const agencySidebarOption = pgTable(
  "agency_sidebar_option",
  {
    id: id(),
    name: text("name").notNull(),
    link: text("link").notNull(),
    icon: iconEnum("icon").default("info").notNull(),
    order: integer("order").default(0).notNull(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agency.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("agency_sidebar_option_agency_id_idx").on(t.agencyId)],
);

export const invitation = pgTable(
  "invitation",
  {
    id: id(),
    email: text("email").notNull(),
    role: roleEnum("role").notNull().default("AGENCY_MEMBER"),
    status: invitationStatusEnum("status").notNull().default("PENDING"),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agency.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("invitation_email_idx").on(t.email),
    index("invitation_agency_id_idx").on(t.agencyId),
  ],
);

export const notification = pgTable(
  "notification",
  {
    id: id(),
    message: text("message").notNull(),
    read: boolean("read").default(false).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agency.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("notification_user_id_idx").on(t.userId),
    index("notification_agency_id_idx").on(t.agencyId),
  ],
);

export const subscription = pgTable(
  "subscription",
  {
    id: id(),
    priceId: text("price_id"),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeCurrentPeriodEnd: integer("stripe_current_period_end"),
    currentPeriodEndDate: timestamp("current_period_end_date", {
      mode: "date",
    }).notNull(),
    active: boolean("active").default(false).notNull(),
    plan: planEnum("plan").notNull().default("FREE"),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agency.id, { onDelete: "cascade" })
      .unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("subscription_agency_id_idx").on(t.agencyId)],
);

export const addOns = pgTable(
  "add_ons",
  {
    id: id(),
    name: text("name").notNull(),
    active: boolean("active").default(false).notNull(),
    priceId: text("price_id"),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agency.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("add_ons_agency_id_idx").on(t.agencyId)],
);

export const agencyRelations = relations(agency, ({ many }) => ({
  users: many(user),
  tags: many(tag),
  pipelines: many(pipeline),
  triggers: many(trigger),
  automations: many(automation),
  contacts: many(contact),
  media: many(media),
  funnels: many(funnel),
  agencySidebarOptions: many(agencySidebarOption),
  invitations: many(invitation),
  notifications: many(notification),
  subscriptions: many(subscription),
  addOns: many(addOns),
}));

export const tagRelations = relations(tag, ({ one, many }) => ({
  agency: one(agency, { fields: [tag.agencyId], references: [agency.id] }),
  tagToTickets: many(tagToTicket),
}));

export const pipelineRelations = relations(pipeline, ({ one, many }) => ({
  agency: one(agency, { fields: [pipeline.agencyId], references: [agency.id] }),
  lanes: many(lane),
}));

export const laneRelations = relations(lane, ({ one, many }) => ({
  pipeline: one(pipeline, { fields: [lane.pipelineId], references: [pipeline.id] }),
  tickets: many(ticket),
}));

export const ticketRelations = relations(ticket, ({ one, many }) => ({
  lane: one(lane, { fields: [ticket.laneId], references: [lane.id] }),
  customer: one(contact, { fields: [ticket.customerId], references: [contact.id] }),
  assignedUser: one(user, {
    fields: [ticket.assignedUserId],
    references: [user.id],
  }),
  tagToTickets: many(tagToTicket),
}));

export const tagToTicketRelations = relations(tagToTicket, ({ one }) => ({
  tag: one(tag, { fields: [tagToTicket.tagId], references: [tag.id] }),
  ticket: one(ticket, {
    fields: [tagToTicket.ticketId],
    references: [ticket.id],
  }),
}));

export const triggerRelations = relations(trigger, ({ one, many }) => ({
  agency: one(agency, { fields: [trigger.agencyId], references: [agency.id] }),
  automations: many(automation),
}));

export const automationRelations = relations(automation, ({ one, many }) => ({
  agency: one(agency, { fields: [automation.agencyId], references: [agency.id] }),
  trigger: one(trigger, {
    fields: [automation.triggerId],
    references: [trigger.id],
  }),
  instances: many(automationInstance),
  actions: many(action),
}));

export const automationInstanceRelations = relations(
  automationInstance,
  ({ one }) => ({
    automation: one(automation, {
      fields: [automationInstance.automationId],
      references: [automation.id],
    }),
    contact: one(contact, {
      fields: [automationInstance.contactId],
      references: [contact.id],
    }),
  }),
);

export const actionRelations = relations(action, ({ one }) => ({
  automation: one(automation, {
    fields: [action.automationId],
    references: [automation.id],
  }),
}));

export const contactRelations = relations(contact, ({ one, many }) => ({
  agency: one(agency, { fields: [contact.agencyId], references: [agency.id] }),
  tickets: many(ticket),
  automationInstances: many(automationInstance),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  agency: one(agency, { fields: [media.agencyId], references: [agency.id] }),
  uploadedBy: one(user, { fields: [media.uploadedById], references: [user.id] }),
}));

export const funnelRelations = relations(funnel, ({ one, many }) => ({
  agency: one(agency, { fields: [funnel.agencyId], references: [agency.id] }),
  classNames: many(className),
  funnelPages: many(funnelPage),
}));

export const classNameRelations = relations(className, ({ one }) => ({
  funnel: one(funnel, { fields: [className.funnelId], references: [funnel.id] }),
}));

export const funnelPageRelations = relations(funnelPage, ({ one }) => ({
  funnel: one(funnel, { fields: [funnelPage.funnelId], references: [funnel.id] }),
}));

export const agencySidebarOptionRelations = relations(
  agencySidebarOption,
  ({ one }) => ({
    agency: one(agency, {
      fields: [agencySidebarOption.agencyId],
      references: [agency.id],
    }),
  }),
);

export const invitationRelations = relations(invitation, ({ one }) => ({
  agency: one(agency, {
    fields: [invitation.agencyId],
    references: [agency.id],
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id] }),
  agency: one(agency, {
    fields: [notification.agencyId],
    references: [agency.id],
  }),
}));

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  agency: one(agency, {
    fields: [subscription.agencyId],
    references: [agency.id],
  }),
}));

export const addOnsRelations = relations(addOns, ({ one }) => ({
  agency: one(agency, { fields: [addOns.agencyId], references: [agency.id] }),
}));
