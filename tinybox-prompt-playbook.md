# Tinybox Build Playbook: Coding Agent Prompts

This document breaks the Tinybox build into **self-contained prompt tasks** designed for coding agents (Claude Code, Cursor, Copilot, etc.). Each task includes all the context the agent needs to produce working code without referencing external documents.

**How to use this:**
1. Work through the phases in order (they have hard dependencies).
2. Copy the prompt for each task into your coding agent.
3. Verify at the checkpoint before moving on.
4. If a task references files from a previous task, make sure those files exist in your project first.

**Conventions used in prompts:**
- `[FULL CODE BLOCK]` = the prompt includes the complete file contents the agent should produce
- `[CONTEXT BLOCK]` = read-only reference the agent needs but shouldn't modify
- `[CHECKPOINT]` = manual verification step before moving on

---

## Phase 1: Project Scaffolding

### Task 1.1 — Create Project & Install Dependencies x

```
TASK: Scaffold a new Next.js project called "tinybox" using bun and install all dependencies.

STEPS:
1. Run: bun create next-app@latest tinybox
   - Select: TypeScript, App Router, Tailwind CSS, src/ directory, import alias @/*
2. cd tinybox
3. Install dependencies in these groups:

Core ORM & Auth:
bun add drizzle-orm mysql2 better-auth
bun add -D drizzle-kit

UI:
bun dlx shadcn-ui@latest init
(Select: TypeScript, Default style, CSS variables, tailwind.config.ts, src/app/globals.css, @/components alias)
bun add @tremor/react
bun add class-variance-authority clsx tailwind-merge tailwindcss-animate
bun add lucide-react
bun add next-themes sonner vaul cmdk
bun add embla-carousel-react

Forms & Validation:
bun add react-hook-form @hookform/resolvers zod

Payments:
bun add stripe @stripe/stripe-js @stripe/react-stripe-js

Uploads:
bun add uploadthing @uploadthing/react

Utilities:
bun add uuid date-fns @hello-pangea/dnd react-resizable-panels
bun add @tanstack/react-table
bun add -D @types/uuid

CHECKPOINT: Run `bun dev`. Default Next.js page loads at http://localhost:3000.
```

### Task 1.2 — Environment Variables & Folder Structure x

```
TASK: Set up the .env file and create the folder skeleton for the tinybox project.

1. Create `.env` at the project root with these variables:

# Database
DATABASE_URL=mysql://user:password@localhost:3306/tinybox

# Better Auth
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_WEBHOOK_SECRET_LIVE=

# Stripe Connect fee config
NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_PERCENT=2
NEXT_PUBLIC_PLATFORM_ONETIME_FEE=2
NEXT_PUBLIC_PLATFORM_AGENY_PERCENT=1

# UploadThing
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=...

# App
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_DOMAIN=localhost:3000
NEXT_PUBLIC_SCHEME=http://

2. Create this folder skeleton (empty directories and placeholder index files):

src/
├── app/
│   ├── (main)/
│   │   └── agency/
│   ├── agency/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── [domain]/
│   ├── api/
│   │   ├── auth/[...all]/
│   │   ├── stripe/
│   │   └── uploadthing/
│   └── site/
├── components/
│   ├── forms/
│   ├── icons/
│   ├── global/
│   ├── media/
│   ├── sidebar/
│   └── ui/
├── lib/
│   ├── db/
│   ├── stripe/
├── providers/
│   └── editor/

3. Create `src/lib/utils.ts`:
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

CHECKPOINT: Folder structure matches the skeleton. `bun dev` still runs.
```

### Task 1.3 — Next.js Config with Subdomain Rewrites x

```
TASK: Create `next.config.ts` at the project root with image remote patterns and subdomain rewrite rules.

The app serves published funnels on custom subdomains. The rewrite rule captures
the subdomain from the Host header and rewrites the request to a dynamic [domain]
route segment.

Create this file exactly:

// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uploadthing.com' },
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: 'files.stripe.com' },
    ],
  },
  reactStrictMode: false,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: `(?<subdomain>[^.]+)\\.${process.env.NEXT_PUBLIC_DOMAIN?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
            },
          ],
          destination: '/:subdomain/:path*',
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
}

export default nextConfig

HOW IT WORKS:
- Request to mysite.yourdomain.com/pricing is rewritten to /mysite/pricing
- This is handled by src/app/[domain]/... routes (built later in Phase 9)
- The regex captures a single subdomain level before the configured domain

CHECKPOINT: `bun dev` still runs without errors.
```

---

## Phase 2: Database Schema

### Task 2.1 — Drizzle Config & Client x

```
TASK: Set up Drizzle ORM configuration and the database client.

1. Create `drizzle.config.ts` at the project root:

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})

2. Create `src/lib/db/index.ts`:

import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

const connection = mysql.createPool({
  uri: process.env.DATABASE_URL!,
})

export const db = drizzle(connection, { schema, mode: 'default' })

3. Add these scripts to package.json:
"db:push": "drizzle-kit push",
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"

CHECKPOINT: No errors on import. Schema file is created in the next task.
```

### Task 2.2 — Schema: Better Auth Tables & Helpers x

```
TASK: Create the first part of `src/lib/db/schema.ts` containing helper functions,
enum definitions, and the Better Auth required tables.

Better Auth requires four specific tables (auth_user, auth_session, auth_account,
auth_verification) with exact column names following Better Auth conventions.
These are SEPARATE from the application user table (built in the next task).

Create `src/lib/db/schema.ts` with this content:

import {
  mysqlTable,
  varchar,
  text,
  longtext,
  boolean,
  int,
  decimal,
  datetime,
  mysqlEnum,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/mysql-core'
import { relations, sql } from 'drizzle-orm'

// ─── Helpers ────────────────────────────────────────────────────
const id = () => varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID())
const createdAt = () => datetime('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull()
const updatedAt = () => datetime('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull()

// ─── Enums ──────────────────────────────────────────────────────
export const roleEnum = mysqlEnum('role', [
  'AGENCY_OWNER',
  'AGENCY_ADMIN',
  'AGENCY_USER',
  'AGENCY_GUEST',
])

export const iconEnum = mysqlEnum('icon', [
  'settings', 'chart', 'calendar', 'check', 'chip', 'compass',
  'database', 'flag', 'home', 'info', 'link', 'lock', 'messages',
  'notification', 'payment', 'power', 'receipt', 'shield', 'star',
  'tune', 'videorecorder', 'wallet', 'warning', 'headphone', 'send',
  'pipelines', 'person', 'category', 'contact', 'clipboardIcon',
])

export const invitationStatusEnum = mysqlEnum('status', [
  'ACCEPTED', 'REVOKED', 'PENDING',
])

export const triggerTypesEnum = mysqlEnum('type', ['CONTACT_FORM'])
export const actionTypeEnum = mysqlEnum('type', ['CREATE_CONTACT'])

export const planEnum = mysqlEnum('plan', [
  'price_1OYxkqFj9oKEERu1NbKUxXxN',
  'price_1OYxkqFj9oKEERu1KfJGWxgN',
])

// ─── Better Auth Tables ─────────────────────────────────────────
// These are REQUIRED by Better Auth. Do not rename columns.

export const authUser = mysqlTable('auth_user', {
  id: varchar('id', { length: 191 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
})

export const authSession = mysqlTable('auth_session', {
  id: varchar('id', { length: 191 }).primaryKey(),
  expiresAt: datetime('expires_at', { mode: 'date' }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  ipAddress: varchar('ip_address', { length: 255 }),
  userAgent: text('user_agent'),
  userId: varchar('user_id', { length: 191 }).notNull(),
}, (t) => ({
  userIdIdx: index('session_user_id_idx').on(t.userId),
}))

export const authAccount = mysqlTable('auth_account', {
  id: varchar('id', { length: 191 }).primaryKey(),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 191 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: datetime('access_token_expires_at', { mode: 'date' }),
  refreshTokenExpiresAt: datetime('refresh_token_expires_at', { mode: 'date' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (t) => ({
  userIdIdx: index('account_user_id_idx').on(t.userId),
}))

export const authVerification = mysqlTable('auth_verification', {
  id: varchar('id', { length: 191 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  expiresAt: datetime('expires_at', { mode: 'date' }).notNull(),
  createdAt: datetime('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
})

DO NOT add application tables yet. They come in the next task.

CHECKPOINT: File compiles without TypeScript errors.
```

### Task 2.3 — Schema: Application Tables x

```
TASK: Append all application tables to `src/lib/db/schema.ts` (after the Better Auth tables).

These are the business domain tables. Add them below the auth tables in the same file.
Every table uses the id(), createdAt(), updatedAt() helpers already defined.

IMPORTANT NOTES:
- The `user` table is the APPLICATION user (separate from auth_user). It stores role,
  agencyId, and avatarUrl. The auth_user table is only for Better Auth session management.
- The `tagToTicket` table is an EXPLICIT many-to-many junction table. Prisma handled
  Tag<->Ticket implicitly, but Drizzle requires this.
- Subscription has a UNIQUE constraint on agencyId (one subscription per agency).

Add these table definitions:

// ─── Application User ───────────────────────────────────────────
export const user = mysqlTable('user', {
  id: varchar('id', { length: 191 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  role: roleEnum.notNull().default('AGENCY_USER'),
  agencyId: varchar('agency_id', { length: 191 }),
}, (t) => ({
  agencyIdIdx: index('user_agency_id_idx').on(t.agencyId),
}))

// ─── Agency ─────────────────────────────────────────────────────
export const agency = mysqlTable('agency', {
  id: id(),
  connectAccountId: varchar('connect_account_id', { length: 255 }).default(''),
  customerId: varchar('customer_id', { length: 255 }).notNull().default(''),
  name: varchar('name', { length: 255 }).notNull(),
  agencyLogo: text('agency_logo').notNull(),
  companyEmail: text('company_email').notNull(),
  companyPhone: varchar('company_phone', { length: 50 }).notNull(),
  whiteLabel: boolean('white_label').notNull().default(true),
  address: varchar('address', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  goal: int('goal').notNull().default(5),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

// ─── Tag ────────────────────────────────────────────────────────
export const tag = mysqlTable('tag', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 50 }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  agencyId: varchar('agency_id', { length: 191 }).notNull(),
}, (t) => ({
  agencyIdIdx: index('tag_agency_id_idx').on(t.agencyId),
}))

// ─── Pipeline ───────────────────────────────────────────────────
export const pipeline = mysqlTable('pipeline', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  agencyId: varchar('agency_id', { length: 191 }).notNull(),
}, (t) => ({
  agencyIdIdx: index('pipeline_agency_id_idx').on(t.agencyId),
}))

// ─── Lane ───────────────────────────────────────────────────────
export const lane = mysqlTable('lane', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  pipelineId: varchar('pipeline_id', { length: 191 }).notNull(),
  order: int('order').notNull().default(0),
}, (t) => ({
  pipelineIdIdx: index('lane_pipeline_id_idx').on(t.pipelineId),
}))

// ─── Ticket ─────────────────────────────────────────────────────
export const ticket = mysqlTable('ticket', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  laneId: varchar('lane_id', { length: 191 }).notNull(),
  order: int('order').notNull().default(0),
  value: decimal('value', { precision: 10, scale: 2 }),
  description: text('description'),
  customerId: varchar('customer_id', { length: 191 }),
  assignedUserId: varchar('assigned_user_id', { length: 191 }),
}, (t) => ({
  laneIdIdx: index('ticket_lane_id_idx').on(t.laneId),
  customerIdIdx: index('ticket_customer_id_idx').on(t.customerId),
  assignedUserIdIdx: index('ticket_assigned_user_id_idx').on(t.assignedUserId),
}))

// ─── Tag <-> Ticket Junction (explicit M2M) ─────────────────────
export const tagToTicket = mysqlTable('tag_to_ticket', {
  tagId: varchar('tag_id', { length: 191 }).notNull(),
  ticketId: varchar('ticket_id', { length: 191 }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.tagId, t.ticketId] }),
  tagIdIdx: index('tag_to_ticket_tag_id_idx').on(t.tagId),
  ticketIdIdx: index('tag_to_ticket_ticket_id_idx').on(t.ticketId),
}))

// ─── Trigger ────────────────────────────────────────────────────
export const trigger = mysqlTable('trigger', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  type: mysqlEnum('type', ['CONTACT_FORM']).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  agencyId: varchar('agency_id', { length: 191 }).notNull(),
}, (t) => ({
  agencyIdIdx: index('trigger_agency_id_idx').on(t.agencyId),
}))

// ─── Automation ─────────────────────────────────────────────────
export const automation = mysqlTable('automation', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  triggerId: varchar('trigger_id', { length: 191 }),
  published: boolean('published').notNull().default(false),
  agencyId: varchar('agency_id', { length: 191 }).notNull(),
}, (t) => ({
  triggerIdIdx: index('automation_trigger_id_idx').on(t.triggerId),
  agencyIdIdx: index('automation_agency_id_idx').on(t.agencyId),
}))

// ─── AutomationInstance ─────────────────────────────────────────
export const automationInstance = mysqlTable('automation_instance', {
  id: id(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  automationId: varchar('automation_id', { length: 191 }).notNull(),
  active: boolean('active').notNull().default(false),
}, (t) => ({
  automationIdIdx: index('automation_instance_automation_id_idx').on(t.automationId),
}))

// ─── Action ─────────────────────────────────────────────────────
export const action = mysqlTable('action', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  type: mysqlEnum('type', ['CREATE_CONTACT']).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  automationId: varchar('automation_id', { length: 191 }).notNull(),
  order: int('order').notNull(),
  laneId: varchar('lane_id', { length: 191 }).notNull().default('0'),
}, (t) => ({
  automationIdIdx: index('action_automation_id_idx').on(t.automationId),
}))

// ─── Contact ────────────────────────────────────────────────────
export const contact = mysqlTable('contact', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  agencyId: varchar('agency_id', { length: 191 }).notNull(),
}, (t) => ({
  agencyIdIdx: index('contact_agency_id_idx').on(t.agencyId),
}))

// ─── Media ──────────────────────────────────────────────────────
export const media = mysqlTable('media', {
  id: id(),
  type: varchar('type', { length: 50 }),
  name: varchar('name', { length: 255 }).notNull(),
  link: varchar('link', { length: 500 }).notNull().unique(),
  agencyId: varchar('agency_id', { length: 191 }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({
  agencyIdIdx: index('media_agency_id_idx').on(t.agencyId),
}))

// ─── Funnel ─────────────────────────────────────────────────────
export const funnel = mysqlTable('funnel', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  description: text('description'),
  published: boolean('published').notNull().default(false),
  subDomainName: varchar('sub_domain_name', { length: 255 }).unique(),
  favicon: text('favicon'),
  agencyId: varchar('agency_id', { length: 191 }).notNull(),
  liveProducts: text('live_products').default('[]'),
}, (t) => ({
  agencyIdIdx: index('funnel_agency_id_idx').on(t.agencyId),
}))

// ─── ClassName ──────────────────────────────────────────────────
export const className = mysqlTable('class_name', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 50 }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  funnelId: varchar('funnel_id', { length: 191 }).notNull(),
  customData: longtext('custom_data'),
}, (t) => ({
  funnelIdIdx: index('class_name_funnel_id_idx').on(t.funnelId),
}))

// ─── FunnelPage ─────────────────────────────────────────────────
export const funnelPage = mysqlTable('funnel_page', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  pathName: varchar('path_name', { length: 255 }).notNull().default(''),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  visits: int('visits').notNull().default(0),
  content: longtext('content'),
  order: int('order').notNull(),
  previewImage: text('preview_image'),
  funnelId: varchar('funnel_id', { length: 191 }).notNull(),
}, (t) => ({
  funnelIdIdx: index('funnel_page_funnel_id_idx').on(t.funnelId),
}))

// ─── AgencySidebarOption ────────────────────────────────────────
export const agencySidebarOption = mysqlTable('agency_sidebar_option', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull().default('Menu'),
  link: varchar('link', { length: 500 }).notNull().default('#'),
  icon: iconEnum.notNull().default('info'),
  agencyId: varchar('agency_id', { length: 191 }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({
  agencyIdIdx: index('agency_sidebar_option_agency_id_idx').on(t.agencyId),
}))

// ─── Invitation ─────────────────────────────────────────────────
export const invitation = mysqlTable('invitation', {
  id: id(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  agencyId: varchar('agency_id', { length: 191 }).notNull(),
  status: mysqlEnum('status', ['ACCEPTED', 'REVOKED', 'PENDING']).notNull().default('PENDING'),
  role: roleEnum.notNull().default('AGENCY_USER'),
}, (t) => ({
  agencyIdIdx: index('invitation_agency_id_idx').on(t.agencyId),
}))

// ─── Notification ───────────────────────────────────────────────
export const notification = mysqlTable('notification', {
  id: id(),
  notification: varchar('notification', { length: 500 }).notNull(),
  agencyId: varchar('agency_id', { length: 191 }).notNull(),
  userId: varchar('user_id', { length: 191 }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({
  agencyIdIdx: index('notification_agency_id_idx').on(t.agencyId),
  userIdIdx: index('notification_user_id_idx').on(t.userId),
}))

// ─── Subscription ───────────────────────────────────────────────
export const subscription = mysqlTable('subscription', {
  id: id(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  plan: planEnum,
  price: varchar('price', { length: 50 }),
  active: boolean('active').notNull().default(false),
  priceId: varchar('price_id', { length: 191 }).notNull(),
  customerId: varchar('customer_id', { length: 191 }).notNull(),
  currentPeriodEndDate: datetime('current_period_end_date', { mode: 'date' }).notNull(),
  subscriptionId: varchar('subscription_id', { length: 191 }).notNull().unique(),
  agencyId: varchar('agency_id', { length: 191 }).unique(),
}, (t) => ({
  customerIdIdx: index('subscription_customer_id_idx').on(t.customerId),
}))

// ─── AddOns ─────────────────────────────────────────────────────
export const addOns = mysqlTable('add_ons', {
  id: id(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  name: varchar('name', { length: 255 }).notNull(),
  active: boolean('active').notNull().default(false),
  priceId: varchar('price_id', { length: 191 }).notNull().unique(),
  agencyId: varchar('agency_id', { length: 191 }),
}, (t) => ({
  agencyIdIdx: index('add_ons_agency_id_idx').on(t.agencyId),
}))

CHECKPOINT: TypeScript compiles with no errors.
```

### Task 2.4 — Schema: All Relations x

```
TASK: Append all Drizzle relation definitions to the bottom of `src/lib/db/schema.ts`.

Relations tell Drizzle's query builder how to join tables when using `with: {}`.
You must define BOTH sides of every relationship.

Key things to know:
- `one()` = belongs-to or has-one. Requires `fields` and `references`.
- `many()` = has-many. No fields/references needed.
- The tagToTicket junction table has relations to BOTH tag and ticket.
- subscription uses agency.id -> subscription.agencyId (one-to-one).

Append these after all table definitions:

export const userRelations = relations(user, ({ one, many }) => ({
  agency: one(agency, { fields: [user.agencyId], references: [agency.id] }),
  tickets: many(ticket),
  notifications: many(notification),
}))

export const agencyRelations = relations(agency, ({ many, one }) => ({
  users: many(user),
  sidebarOptions: many(agencySidebarOption),
  invitations: many(invitation),
  notifications: many(notification),
  subscription: one(subscription, { fields: [agency.id], references: [subscription.agencyId] }),
  addOns: many(addOns),
  funnels: many(funnel),
  media: many(media),
  contacts: many(contact),
  triggers: many(trigger),
  automations: many(automation),
  pipelines: many(pipeline),
  tags: many(tag),
}))

export const tagRelations = relations(tag, ({ one, many }) => ({
  agency: one(agency, { fields: [tag.agencyId], references: [agency.id] }),
  tagToTickets: many(tagToTicket),
}))

export const pipelineRelations = relations(pipeline, ({ one, many }) => ({
  agency: one(agency, { fields: [pipeline.agencyId], references: [agency.id] }),
  lanes: many(lane),
}))

export const laneRelations = relations(lane, ({ one, many }) => ({
  pipeline: one(pipeline, { fields: [lane.pipelineId], references: [pipeline.id] }),
  tickets: many(ticket),
}))

export const ticketRelations = relations(ticket, ({ one, many }) => ({
  lane: one(lane, { fields: [ticket.laneId], references: [lane.id] }),
  customer: one(contact, { fields: [ticket.customerId], references: [contact.id] }),
  assigned: one(user, { fields: [ticket.assignedUserId], references: [user.id] }),
  tagToTickets: many(tagToTicket),
}))

export const tagToTicketRelations = relations(tagToTicket, ({ one }) => ({
  tag: one(tag, { fields: [tagToTicket.tagId], references: [tag.id] }),
  ticket: one(ticket, { fields: [tagToTicket.ticketId], references: [ticket.id] }),
}))

export const triggerRelations = relations(trigger, ({ one, many }) => ({
  agency: one(agency, { fields: [trigger.agencyId], references: [agency.id] }),
  automations: many(automation),
}))

export const automationRelations = relations(automation, ({ one, many }) => ({
  trigger: one(trigger, { fields: [automation.triggerId], references: [trigger.id] }),
  agency: one(agency, { fields: [automation.agencyId], references: [agency.id] }),
  actions: many(action),
  instances: many(automationInstance),
}))

export const automationInstanceRelations = relations(automationInstance, ({ one }) => ({
  automation: one(automation, { fields: [automationInstance.automationId], references: [automation.id] }),
}))

export const actionRelations = relations(action, ({ one }) => ({
  automation: one(automation, { fields: [action.automationId], references: [automation.id] }),
}))

export const contactRelations = relations(contact, ({ one, many }) => ({
  agency: one(agency, { fields: [contact.agencyId], references: [agency.id] }),
  tickets: many(ticket),
}))

export const mediaRelations = relations(media, ({ one }) => ({
  agency: one(agency, { fields: [media.agencyId], references: [agency.id] }),
}))

export const funnelRelations = relations(funnel, ({ one, many }) => ({
  agency: one(agency, { fields: [funnel.agencyId], references: [agency.id] }),
  funnelPages: many(funnelPage),
  classNames: many(className),
}))

export const classNameRelations = relations(className, ({ one }) => ({
  funnel: one(funnel, { fields: [className.funnelId], references: [funnel.id] }),
}))

export const funnelPageRelations = relations(funnelPage, ({ one }) => ({
  funnel: one(funnel, { fields: [funnelPage.funnelId], references: [funnel.id] }),
}))

export const agencySidebarOptionRelations = relations(agencySidebarOption, ({ one }) => ({
  agency: one(agency, { fields: [agencySidebarOption.agencyId], references: [agency.id] }),
}))

export const invitationRelations = relations(invitation, ({ one }) => ({
  agency: one(agency, { fields: [invitation.agencyId], references: [agency.id] }),
}))

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id] }),
  agency: one(agency, { fields: [notification.agencyId], references: [agency.id] }),
}))

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  agency: one(agency, { fields: [subscription.agencyId], references: [agency.id] }),
}))

export const addOnsRelations = relations(addOns, ({ one }) => ({
  agency: one(agency, { fields: [addOns.agencyId], references: [agency.id] }),
}))

CHECKPOINT: Run `bun db:push`. Then run `bun db:studio`. All tables appear in
the Drizzle Studio browser including: user, agency, auth_user, auth_session,
tag_to_ticket junction, subscription, funnel_page, etc.
```

---

## Phase 3: Authentication (Better Auth)

### Task 3.1 — Better Auth Server & Client Setup x

```
TASK: Set up Better Auth with four files: server instance, client instance,
API route handler, and server-side session helpers.

CONTEXT: Better Auth replaces Clerk. It uses cookie-based sessions, requires
no provider wrapper in the layout, and stores session data in the auth_* tables
defined in the schema.

1. Create `src/lib/auth.ts` (server instance):

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import * as schema from './db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'mysql',
    schema: {
      user: schema.authUser,
      session: schema.authSession,
      account: schema.authAccount,
      verification: schema.authVerification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
})

export type Session = typeof auth.$Infer.Session

2. Create `src/lib/auth-client.ts` (client instance):

import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_URL,
})

export const { signIn, signUp, signOut, useSession } = authClient

3. Create `src/app/api/auth/[...all]/route.ts` (API catch-all):

import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)

4. Create `src/lib/auth-server.ts` (server helpers that replace Clerk's currentUser()):

import { auth } from './auth'
import { headers } from 'next/headers'

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

NOTE: In Next.js 16, headers() is async and must be awaited.

CHECKPOINT: No TypeScript errors. The API route at /api/auth/* is reachable
(visiting /api/auth/error in the browser should return a Better Auth response,
not a 404).
```

### Task 3.2 — Auth Guard & Protected Layout x

```
TASK: Create the auth guard utility and the protected layout that replaces
Clerk's authMiddleware.

CONTEXT: Next.js 16 removed middleware. Instead of middleware intercepting every
request, we protect routes at the layout level. The (main) route group wraps all
protected pages. Routes OUTSIDE (main) (like sign-in, sign-up, site, API routes)
are public.

1. Create `src/lib/auth-guard.ts`:

import { getSession } from './auth-server'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    redirect('/agency/sign-in')
  }
  return session
}

2. Create `src/app/(main)/layout.tsx`:

import { requireAuth } from '@/lib/auth-guard'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()
  return <>{children}</>
}

ROUTE STRUCTURE (public vs protected):

src/app/
├── site/                     # PUBLIC - landing page
├── agency/
│   ├── sign-in/              # PUBLIC - sign-in page
│   └── sign-up/              # PUBLIC - sign-up page
├── (main)/
│   └── agency/
│       └── [agencyId]/       # PROTECTED - auth enforced by (main)/layout.tsx
├── [domain]/                 # PUBLIC - published funnels
├── api/                      # PUBLIC - API routes
└── layout.tsx                # Root layout (no auth)

CHECKPOINT: Visiting /agency/[any-id] while logged out redirects to /agency/sign-in.
```

### Task 3.3 — Sign-In & Sign-Up Pages x

```
TASK: Create the sign-in and sign-up pages using Better Auth's client SDK.

These are custom form pages (not pre-built components like Clerk's <SignIn />).
They call signIn.email() and signUp.email() from the auth client.

1. Create `src/app/agency/sign-in/page.tsx`:

'use client'
import { signIn } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await signIn.email({ email, password })
    if (error) {
      setError(error.message ?? 'Sign in failed')
    } else {
      router.push('/agency')
    }
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          className="border rounded p-2" required />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded p-2" required />
        <button type="submit" className="bg-primary text-white rounded p-2">
          Sign In
        </button>
        <a href="/agency/sign-up" className="text-sm text-center underline">
          Don't have an account? Sign up
        </a>
      </form>
    </div>
  )
}

2. Create `src/app/agency/sign-up/page.tsx`:

'use client'
import { signUp } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await signUp.email({ name, email, password })
    if (error) {
      setError(error.message ?? 'Sign up failed')
    } else {
      router.push('/agency')
    }
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold text-center">Sign Up</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input type="text" placeholder="Full Name" value={name}
          onChange={e => setName(e.target.value)}
          className="border rounded p-2" required />
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          className="border rounded p-2" required />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded p-2" required />
        <button type="submit" className="bg-primary text-white rounded p-2">
          Sign Up
        </button>
        <a href="/agency/sign-in" className="text-sm text-center underline">
          Already have an account? Sign in
        </a>
      </form>
    </div>
  )
}

NOTE: These are intentionally minimal forms. You can style them with shadcn/ui
components later. The important thing is that the auth flow works.

CHECKPOINT: Sign up with a new account. Sign in. Visit /agency (protected).
Sign out. Verify redirect to sign-in when logged out.
Check auth_user and auth_session tables in Drizzle Studio for the new records.
```

---

## Phase 4: UI Shell

### Task 4.1 — shadcn Components, Theme, Modal, Root Layout x

```
TASK: Install shadcn/ui components, create the theme provider, modal provider,
blur page wrapper, and update the root layout.

1. Install shadcn components (run this single command):

bun shadcn-ui@latest add accordion alert-dialog aspect-ratio avatar \
  button card checkbox collapsible command context-menu dialog \
  dropdown-menu form hover-card input label menubar navigation-menu \
  popover progress radio-group scroll-area select separator sheet \
  skeleton slider switch table tabs textarea toast toggle toggle-group \
  tooltip

2. Create `src/providers/theme-provider.tsx`:

'use client'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

3. Create `src/providers/modal-provider.tsx`:

'use client'
import { createContext, useContext, useEffect, useState } from 'react'

interface ModalProviderProps { children: React.ReactNode }

export type ModalData = { [key: string]: any }

type ModalContextType = {
  data: ModalData
  isOpen: boolean
  setOpen: (modal: React.ReactNode, fetchData?: () => Promise<any>) => void
  setClose: () => void
}

export const ModalContext = createContext<ModalContextType>({
  data: {},
  isOpen: false,
  setOpen: () => {},
  setClose: () => {},
})

const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<ModalData>({})
  const [showingModal, setShowingModal] = useState<React.ReactNode>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  const setOpen = async (modal: React.ReactNode, fetchData?: () => Promise<any>) => {
    if (modal) {
      if (fetchData) {
        setData({ ...data, ...(await fetchData()) } || {})
      }
      setShowingModal(modal)
      setIsOpen(true)
    }
  }

  const setClose = () => {
    setIsOpen(false)
    setData({})
  }

  if (!isMounted) return null

  return (
    <ModalContext.Provider value={{ data, setOpen, setClose, isOpen }}>
      {children}
      {showingModal}
    </ModalContext.Provider>
  )
}

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) throw new Error('useModal must be used within ModalProvider')
  return context
}

export default ModalProvider

4. Create `src/components/global/blur-page.tsx`:

import React from 'react'

const BlurPage = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="h-screen overflow-scroll backdrop-blur-[35px] dark:bg-muted/40 bg-muted/60 dark:shadow-2xl dark:shadow-black mx-auto pt-24 p-4 absolute top-0 right-0 left-0 bottom-0 z-[11]"
      id="blur-page"
    >
      {children}
    </div>
  )
}

export default BlurPage

5. Update `src/app/layout.tsx`:

import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import ModalProvider from '@/providers/modal-provider'
import { Toaster } from '@/components/ui/sonner'

const font = DM_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tinybox',
  description: 'All in one Agency Solution',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={font.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ModalProvider>
            {children}
            <Toaster />
          </ModalProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

CHECKPOINT: Dark mode toggles work. Toast notifications fire (test with
`toast('Hello')` from sonner). Modal context is available. App renders with
DM Sans font.
```

---

## Phase 5: Types & Query Layer

### Task 5.1 — Types File x

```
TASK: Create `src/lib/types.ts` with all TypeScript types and Zod validation schemas.

This file replaces all `import { Model } from '@prisma/client'` statements.
Types are inferred from the Drizzle schema using InferSelectModel.

PREREQUISITE: src/lib/db/schema.ts must exist with all tables defined.

Create `src/lib/types.ts` with this exact content:

import { z } from 'zod'
import type { InferSelectModel } from 'drizzle-orm'
import * as schema from './db/schema'
import Stripe from 'stripe'

// ─── Table types (replaces @prisma/client imports) ──────────────
export type User = InferSelectModel<typeof schema.user>
export type Agency = InferSelectModel<typeof schema.agency>
export type Tag = InferSelectModel<typeof schema.tag>
export type Ticket = InferSelectModel<typeof schema.ticket>
export type Lane = InferSelectModel<typeof schema.lane>
export type Contact = InferSelectModel<typeof schema.contact>
export type Notification = InferSelectModel<typeof schema.notification>
export type Pipeline = InferSelectModel<typeof schema.pipeline>
export type Funnel = InferSelectModel<typeof schema.funnel>
export type FunnelPage = InferSelectModel<typeof schema.funnelPage>
export type Media = InferSelectModel<typeof schema.media>
export type Invitation = InferSelectModel<typeof schema.invitation>
export type Subscription = InferSelectModel<typeof schema.subscription>
export type AgencySidebarOption = InferSelectModel<typeof schema.agencySidebarOption>

// ─── Composite types ────────────────────────────────────────────
export type NotificationWithUser =
  | (Notification & { user: User })[]
  | undefined

export type TicketAndTags = Ticket & {
  tags: Tag[]
  assigned: User | null
  customer: Contact | null
}

export type LaneDetail = Lane & {
  tickets: TicketAndTags[]
}

export type CreateMediaType = {
  link: string
  name: string
}

// ─── Zod Schemas ────────────────────────────────────────────────
export const FunnelPageSchema = z.object({
  name: z.string().min(1),
  pathName: z.string().optional(),
})

export const CreatePipelineFormSchema = z.object({
  name: z.string().min(1),
})

export const CreateFunnelFormSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  subDomainName: z.string().optional(),
  favicon: z.string().optional(),
})

export const LaneFormSchema = z.object({
  name: z.string().min(1),
})

const currencyNumberRegex = /^\d+(\.\d{1,2})?$/
export const TicketFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  value: z.string().refine((value) => currencyNumberRegex.test(value), {
    message: 'Value must be a valid price.',
  }),
})

export const ContactUserFormSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email(),
})

// ─── Stripe types ───────────────────────────────────────────────
export type Address = {
  city: string; country: string; line1: string; postal_code: string; state: string
}
export type ShippingInfo = { address: Address; name: string }
export type StripeCustomerType = {
  email: string; name: string; shipping: ShippingInfo; address: Address
}
export type PricesList = Stripe.ApiList<Stripe.Price>

CHECKPOINT: No TypeScript errors. All types resolve correctly.
```

### Task 5.2 — Queries: Auth & User x

```
TASK: Create `src/lib/queries.ts` with the first group of server actions covering
authentication, user management, and agency initialization.

This is a 'use server' file. All functions are server actions.
Key pattern: getCurrentUser() replaces Clerk's currentUser().

PREREQUISITES:
- src/lib/db/index.ts (Drizzle client)
- src/lib/db/schema.ts (all tables + relations)
- src/lib/auth-server.ts (getCurrentUser helper)
- src/lib/types.ts (all type definitions)

Create `src/lib/queries.ts` starting with these imports and functions:

'use server'

import { db } from './db'
import * as schema from './db/schema'
import { eq, and, sql, like, inArray, desc, asc } from 'drizzle-orm'
import { getCurrentUser } from './auth-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { v4 } from 'uuid'
import type { User, Agency, Tag, Lane, Ticket, CreateMediaType } from './types'
import { CreateFunnelFormSchema } from './types'

// ─── getAuthUserDetails ─────────────────────────────────────────
// Fetches the app user record (with agency + sidebar options) for the
// currently authenticated user. This is called on almost every protected page.
export const getAuthUserDetails = async () => {
  const authUser = await getCurrentUser()
  if (!authUser) return

  const userData = await db.query.user.findFirst({
    where: eq(schema.user.email, authUser.email),
    with: {
      agency: {
        with: {
          sidebarOptions: true,
        },
      },
    },
  })

  return userData
}

// ─── saveActivityLogsNotification ───────────────────────────────
// Creates a notification record. If no auth user, finds any user in the agency.
export const saveActivityLogsNotification = async ({
  agencyId,
  description,
}: {
  agencyId: string
  description: string
}) => {
  const authUser = await getCurrentUser()
  let userData: User | undefined

  if (!authUser) {
    const result = await db.query.user.findFirst({
      where: eq(schema.user.agencyId, agencyId),
    })
    if (result) userData = result
  } else {
    const result = await db.query.user.findFirst({
      where: eq(schema.user.email, authUser.email),
    })
    if (result) userData = result
  }

  if (!userData) {
    console.log('Could not find a user')
    return
  }

  await db.insert(schema.notification).values({
    notification: `${userData.name} | ${description}`,
    userId: userData.id,
    agencyId,
  })
}

// ─── initUser ───────────────────────────────────────────────────
// Creates or updates the app user record. Called during onboarding.
// No more clerkClient.users.updateUserMetadata -- role is in user table.
export const initUser = async (newUser: Partial<User>) => {
  const authUser = await getCurrentUser()
  if (!authUser) return

  const existing = await db.query.user.findFirst({
    where: eq(schema.user.email, authUser.email),
  })

  if (existing) {
    await db.update(schema.user)
      .set(newUser)
      .where(eq(schema.user.email, authUser.email))
  } else {
    await db.insert(schema.user).values({
      id: authUser.id,
      avatarUrl: authUser.image ?? '',
      email: authUser.email,
      name: authUser.name,
      role: newUser.role ?? 'AGENCY_USER',
    })
  }

  return db.query.user.findFirst({ where: eq(schema.user.email, authUser.email) })
}

// ─── createTeamUser ─────────────────────────────────────────────
export const createTeamUser = async (agencyId: string, user: User) => {
  if (user.role === 'AGENCY_OWNER') return null

  try {
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.email, user.email),
    })

    if (existingUser?.agencyId && existingUser.agencyId !== agencyId) {
      console.log('User already belongs to another agency')
      return null
    }

    if (existingUser) {
      await db.update(schema.user)
        .set({
          agencyId,
          role: user.role,
          avatarUrl: user.avatarUrl,
          name: user.name,
          updatedAt: new Date(),
        })
        .where(eq(schema.user.email, user.email))
      return { ...existingUser, agencyId, role: user.role, avatarUrl: user.avatarUrl, name: user.name }
    }

    await db.insert(schema.user).values({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      agencyId,
      role: user.role,
    })

    return user
  } catch (error) {
    console.log('Error creating team user:', error)
    return null
  }
}

// ─── verifyAndAcceptInvitation ───────────────────────────────────
export const verifyAndAcceptInvitation = async () => {
  const authUser = await getCurrentUser()
  if (!authUser) return redirect('/agency/sign-in')

  const invitationExists = await db.query.invitation.findFirst({
    where: and(
      eq(schema.invitation.email, authUser.email),
      eq(schema.invitation.status, 'PENDING')
    ),
  })

  if (invitationExists) {
    const userDetails = await createTeamUser(invitationExists.agencyId, {
      email: invitationExists.email,
      agencyId: invitationExists.agencyId,
      avatarUrl: authUser.image ?? '',
      id: authUser.id,
      name: authUser.name,
      role: invitationExists.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await saveActivityLogsNotification({
      agencyId: invitationExists.agencyId,
      description: 'Joined',
    })

    if (userDetails) {
      await db.delete(schema.invitation)
        .where(eq(schema.invitation.email, userDetails.email))
      return userDetails.agencyId
    }
    return null
  } else {
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.email, authUser.email),
    })
    return existingUser?.agencyId ?? null
  }
}

// ─── getUser / updateUser / deleteUser ──────────────────────────
export const getUser = async (id: string) => {
  return db.query.user.findFirst({ where: eq(schema.user.id, id) })
}

export const updateUser = async (userData: Partial<User>) => {
  if (!userData.email) throw new Error('Email required')
  await db.update(schema.user)
    .set(userData)
    .where(eq(schema.user.email, userData.email))
  return db.query.user.findFirst({ where: eq(schema.user.email, userData.email) })
}

export const deleteUser = async (userId: string) => {
  const deletedUser = await db.query.user.findFirst({ where: eq(schema.user.id, userId) })
  await db.delete(schema.user).where(eq(schema.user.id, userId))
  return deletedUser
}

// ─── sendInvitation ─────────────────────────────────────────────
export const sendInvitation = async (
  role: 'AGENCY_OWNER' | 'AGENCY_ADMIN' | 'AGENCY_USER' | 'AGENCY_GUEST',
  email: string,
  agencyId: string
) => {
  await db.insert(schema.invitation).values({ email, agencyId, role })
  // TODO: Send invitation email using Resend or similar
  return db.query.invitation.findFirst({ where: eq(schema.invitation.email, email) })
}

// ─── getNotificationAndUser ─────────────────────────────────────
export const getNotificationAndUser = async (agencyId: string) => {
  try {
    return await db.query.notification.findMany({
      where: eq(schema.notification.agencyId, agencyId),
      with: { user: true },
      orderBy: desc(schema.notification.createdAt),
    })
  } catch (error) {
    console.log(error)
  }
}

CHECKPOINT: File compiles. You can test by calling initUser() from a
temporary API route or server component. Check Drizzle Studio for the
new user record.
```

### Task 5.3 — Queries: Agency CRUD x

```
TASK: Append agency-related server actions to `src/lib/queries.ts`.

Add these functions to the existing queries.ts file:

// ─── upsertAgency ───────────────────────────────────────────────
// Creates a new agency OR updates existing. On create, also:
// 1. Links the user to the agency
// 2. Creates 10 default sidebar options
// 3. Creates a default "Lead Cycle" pipeline
export const upsertAgency = async (agencyData: Agency, price?: string) => {
  if (!agencyData.companyEmail) return null
  try {
    const existing = await db.query.agency.findFirst({
      where: eq(schema.agency.id, agencyData.id),
    })

    if (existing) {
      await db.update(schema.agency).set(agencyData).where(eq(schema.agency.id, agencyData.id))
      return db.query.agency.findFirst({ where: eq(schema.agency.id, agencyData.id) })
    }

    await db.insert(schema.agency).values(agencyData)

    await db.update(schema.user)
      .set({ agencyId: agencyData.id })
      .where(eq(schema.user.email, agencyData.companyEmail))

    const sidebarDefaults = [
      { name: 'Dashboard', icon: 'category' as const, link: `/agency/${agencyData.id}` },
      { name: 'Launchpad', icon: 'clipboardIcon' as const, link: `/agency/${agencyData.id}/launchpad` },
      { name: 'Billing', icon: 'payment' as const, link: `/agency/${agencyData.id}/billing` },
      { name: 'Settings', icon: 'settings' as const, link: `/agency/${agencyData.id}/settings` },
      { name: 'Funnels', icon: 'pipelines' as const, link: `/agency/${agencyData.id}/funnels` },
      { name: 'Media', icon: 'database' as const, link: `/agency/${agencyData.id}/media` },
      { name: 'Automations', icon: 'chip' as const, link: `/agency/${agencyData.id}/automations` },
      { name: 'Pipelines', icon: 'flag' as const, link: `/agency/${agencyData.id}/pipelines` },
      { name: 'Contacts', icon: 'person' as const, link: `/agency/${agencyData.id}/contacts` },
      { name: 'Team', icon: 'shield' as const, link: `/agency/${agencyData.id}/team` },
    ]

    await db.insert(schema.agencySidebarOption).values(
      sidebarDefaults.map(opt => ({ ...opt, agencyId: agencyData.id }))
    )

    await db.insert(schema.pipeline).values({
      name: 'Lead Cycle',
      agencyId: agencyData.id,
    })

    return db.query.agency.findFirst({ where: eq(schema.agency.id, agencyData.id) })
  } catch (error) {
    console.log(error)
  }
}

// ─── updateAgencyDetails ────────────────────────────────────────
export const updateAgencyDetails = async (
  agencyId: string,
  agencyDetails: Partial<Agency>
) => {
  await db.update(schema.agency)
    .set(agencyDetails)
    .where(eq(schema.agency.id, agencyId))
  return db.query.agency.findFirst({ where: eq(schema.agency.id, agencyId) })
}

// ─── deleteAgency ───────────────────────────────────────────────
export const deleteAgency = async (agencyId: string) => {
  await db.delete(schema.agency).where(eq(schema.agency.id, agencyId))
}

CHECKPOINT: Call upsertAgency() with test data. Verify in Drizzle Studio:
agency row exists, 10 sidebar options created, "Lead Cycle" pipeline created,
user row has agencyId set.
```

### Task 5.4 — Queries: Pipeline, Lane, Ticket, Tag x

```
TASK: Append pipeline/lane/ticket/tag server actions to `src/lib/queries.ts`.

IMPORTANT PATTERN - Junction Table (Tag <-> Ticket):
Prisma handled Tag[] on Ticket as implicit M2M. In Drizzle, we use an explicit
tagToTicket junction table. When reading tickets with tags, we query through
tagToTickets and flatten. When writing, we delete old junction rows then re-insert.

Add these functions:

// ─── getPipelines ───────────────────────────────────────────────
export const getPipelines = async (agencyId: string) => {
  return db.query.pipeline.findMany({
    where: eq(schema.pipeline.agencyId, agencyId),
    with: {
      lanes: {
        with: { tickets: true },
      },
    },
  })
}

// ─── getPipelineDetails ─────────────────────────────────────────
export const getPipelineDetails = async (pipelineId: string) => {
  return db.query.pipeline.findFirst({
    where: eq(schema.pipeline.id, pipelineId),
  })
}

// ─── upsertPipeline ────────────────────────────────────────────
export const upsertPipeline = async (pipelineData: {
  id?: string; name: string; agencyId: string
}) => {
  const id = pipelineData.id || v4()
  const existing = await db.query.pipeline.findFirst({ where: eq(schema.pipeline.id, id) })

  if (existing) {
    await db.update(schema.pipeline).set(pipelineData).where(eq(schema.pipeline.id, id))
  } else {
    await db.insert(schema.pipeline).values({ ...pipelineData, id })
  }

  return db.query.pipeline.findFirst({ where: eq(schema.pipeline.id, id) })
}

// ─── deletePipeline ─────────────────────────────────────────────
export const deletePipeline = async (pipelineId: string) => {
  await db.delete(schema.pipeline).where(eq(schema.pipeline.id, pipelineId))
}

// ─── getLanesWithTicketAndTags ───────────────────────────────────
// This is the key M2M query. Reads through the junction table then flattens.
export const getLanesWithTicketAndTags = async (pipelineId: string) => {
  const lanes = await db.query.lane.findMany({
    where: eq(schema.lane.pipelineId, pipelineId),
    orderBy: asc(schema.lane.order),
    with: {
      tickets: {
        orderBy: asc(schema.ticket.order),
        with: {
          assigned: true,
          customer: true,
          tagToTickets: {
            with: { tag: true },
          },
        },
      },
    },
  })

  return lanes.map(lane => ({
    ...lane,
    tickets: lane.tickets.map(ticket => ({
      ...ticket,
      tags: ticket.tagToTickets.map(tt => tt.tag),
    })),
  }))
}

// ─── upsertLane ─────────────────────────────────────────────────
export const upsertLane = async (laneData: {
  id?: string; name: string; pipelineId: string; order?: number
}) => {
  let order = laneData.order
  if (order === undefined || order === null) {
    const existingLanes = await db.query.lane.findMany({
      where: eq(schema.lane.pipelineId, laneData.pipelineId),
    })
    order = existingLanes.length
  }

  const id = laneData.id || v4()
  const existing = await db.query.lane.findFirst({ where: eq(schema.lane.id, id) })

  if (existing) {
    await db.update(schema.lane).set({ ...laneData, order }).where(eq(schema.lane.id, id))
  } else {
    await db.insert(schema.lane).values({ ...laneData, id, order })
  }

  return db.query.lane.findFirst({ where: eq(schema.lane.id, id) })
}

// ─── deleteLane ─────────────────────────────────────────────────
export const deleteLane = async (laneId: string) => {
  await db.delete(schema.lane).where(eq(schema.lane.id, laneId))
}

// ─── updateLanesOrder ───────────────────────────────────────────
export const updateLanesOrder = async (lanes: Lane[]) => {
  try {
    await db.transaction(async (tx) => {
      for (const lane of lanes) {
        await tx.update(schema.lane)
          .set({ order: lane.order })
          .where(eq(schema.lane.id, lane.id))
      }
    })
  } catch (error) {
    console.log(error, 'ERROR UPDATE LANES ORDER')
  }
}

// ─── updateTicketsOrder ─────────────────────────────────────────
export const updateTicketsOrder = async (tickets: Ticket[]) => {
  try {
    await db.transaction(async (tx) => {
      for (const ticket of tickets) {
        await tx.update(schema.ticket)
          .set({ order: ticket.order, laneId: ticket.laneId })
          .where(eq(schema.ticket.id, ticket.id))
      }
    })
  } catch (error) {
    console.log(error, 'ERROR UPDATE TICKET ORDER')
  }
}

// ─── upsertTicket ───────────────────────────────────────────────
// Manages the tagToTicket junction table: delete old rows, insert new.
export const upsertTicket = async (
  ticketData: {
    id?: string; name: string; laneId: string; order?: number;
    value?: string; description?: string; customerId?: string; assignedUserId?: string
  },
  tags: Tag[]
) => {
  let order = ticketData.order
  if (order === undefined || order === null) {
    const existingTickets = await db.query.ticket.findMany({
      where: eq(schema.ticket.laneId, ticketData.laneId),
    })
    order = existingTickets.length
  }

  const id = ticketData.id || v4()
  const existing = await db.query.ticket.findFirst({ where: eq(schema.ticket.id, id) })

  if (existing) {
    await db.update(schema.ticket).set({ ...ticketData, order }).where(eq(schema.ticket.id, id))
    await db.delete(schema.tagToTicket).where(eq(schema.tagToTicket.ticketId, id))
  } else {
    await db.insert(schema.ticket).values({ ...ticketData, id, order })
  }

  if (tags.length > 0) {
    await db.insert(schema.tagToTicket).values(
      tags.map(tag => ({ tagId: tag.id, ticketId: id }))
    )
  }

  const result = await db.query.ticket.findFirst({
    where: eq(schema.ticket.id, id),
    with: {
      assigned: true,
      customer: true,
      lane: true,
      tagToTickets: { with: { tag: true } },
    },
  })

  if (!result) return null
  return { ...result, tags: result.tagToTickets.map(tt => tt.tag) }
}

// ─── deleteTicket ───────────────────────────────────────────────
export const deleteTicket = async (ticketId: string) => {
  await db.delete(schema.tagToTicket).where(eq(schema.tagToTicket.ticketId, ticketId))
  await db.delete(schema.ticket).where(eq(schema.ticket.id, ticketId))
}

// ─── getTicketsWithTags ─────────────────────────────────────────
export const getTicketsWithTags = async (pipelineId: string) => {
  const tickets = await db.query.ticket.findMany({
    where: eq(schema.ticket.laneId,
      sql`(SELECT id FROM lane WHERE pipeline_id = ${pipelineId})`
    ),
    with: {
      assigned: true,
      customer: true,
      tagToTickets: { with: { tag: true } },
    },
  })

  return tickets.map(t => ({
    ...t,
    tags: t.tagToTickets.map(tt => tt.tag),
  }))
}

// ─── _getTicketsWithAllRelations ────────────────────────────────
export const _getTicketsWithAllRelations = async (laneId: string) => {
  const tickets = await db.query.ticket.findMany({
    where: eq(schema.ticket.laneId, laneId),
    with: {
      assigned: true,
      customer: true,
      lane: true,
      tagToTickets: { with: { tag: true } },
    },
  })

  return tickets.map(t => ({
    ...t,
    tags: t.tagToTickets.map(tt => tt.tag),
  }))
}

// ─── upsertTag / getTagsForAgency / deleteTag ──────────────────
export const upsertTag = async (
  agencyId: string,
  tagData: { id?: string; name: string; color: string }
) => {
  const id = tagData.id || v4()
  const existing = await db.query.tag.findFirst({
    where: and(eq(schema.tag.id, id), eq(schema.tag.agencyId, agencyId)),
  })

  if (existing) {
    await db.update(schema.tag).set(tagData).where(eq(schema.tag.id, id))
  } else {
    await db.insert(schema.tag).values({ ...tagData, id, agencyId })
  }

  return db.query.tag.findFirst({ where: eq(schema.tag.id, id) })
}

export const getTagsForAgency = async (agencyId: string) => {
  return db.query.agency.findFirst({
    where: eq(schema.agency.id, agencyId),
    with: { tags: true },
  })
}

export const deleteTag = async (tagId: string) => {
  await db.delete(schema.tagToTicket).where(eq(schema.tagToTicket.tagId, tagId))
  await db.delete(schema.tag).where(eq(schema.tag.id, tagId))
}

CHECKPOINT: All pipeline/lane/ticket/tag queries compile without errors.
```

### Task 5.5 — Queries: Media, Funnel, Contact x

```
TASK: Append media, funnel, and contact server actions to `src/lib/queries.ts`.

Add these functions:

// ─── Media ──────────────────────────────────────────────────────
export const getMedia = async (agencyId: string) => {
  return db.query.agency.findFirst({
    where: eq(schema.agency.id, agencyId),
    with: { media: true },
  })
}

export const createMedia = async (agencyId: string, mediaFile: CreateMediaType) => {
  await db.insert(schema.media).values({
    link: mediaFile.link,
    name: mediaFile.name,
    agencyId,
  })
  return db.query.media.findFirst({ where: eq(schema.media.link, mediaFile.link) })
}

export const deleteMedia = async (mediaId: string) => {
  await db.delete(schema.media).where(eq(schema.media.id, mediaId))
}

// ─── Funnels ────────────────────────────────────────────────────
export const getFunnels = async (agencyId: string) => {
  return db.query.funnel.findMany({
    where: eq(schema.funnel.agencyId, agencyId),
    with: { funnelPages: true },
  })
}

export const getFunnel = async (funnelId: string) => {
  return db.query.funnel.findFirst({
    where: eq(schema.funnel.id, funnelId),
    with: {
      funnelPages: {
        orderBy: asc(schema.funnelPage.order),
      },
    },
  })
}

export const upsertFunnel = async (
  agencyId: string,
  funnelData: z.infer<typeof CreateFunnelFormSchema> & { liveProducts: string },
  funnelId: string
) => {
  const existing = await db.query.funnel.findFirst({
    where: eq(schema.funnel.id, funnelId),
  })

  if (existing) {
    await db.update(schema.funnel).set(funnelData).where(eq(schema.funnel.id, funnelId))
  } else {
    await db.insert(schema.funnel).values({
      ...funnelData,
      id: funnelId || v4(),
      agencyId,
    })
  }

  return db.query.funnel.findFirst({ where: eq(schema.funnel.id, funnelId) })
}

export const updateFunnelProducts = async (products: string, funnelId: string) => {
  await db.update(schema.funnel)
    .set({ liveProducts: products })
    .where(eq(schema.funnel.id, funnelId))
  return db.query.funnel.findFirst({ where: eq(schema.funnel.id, funnelId) })
}

export const upsertFunnelPage = async (
  agencyId: string,
  funnelPageData: {
    id?: string; name: string; pathName?: string; order: number;
    content?: string; previewImage?: string; visits?: number
  },
  funnelId: string
) => {
  if (!agencyId || !funnelId) return

  const id = funnelPageData.id || ''
  const existing = id
    ? await db.query.funnelPage.findFirst({ where: eq(schema.funnelPage.id, id) })
    : null

  const defaultContent = JSON.stringify([{
    content: [],
    id: '__body',
    name: 'Body',
    styles: { backgroundColor: 'white' },
    type: '__body',
  }])

  if (existing) {
    await db.update(schema.funnelPage).set(funnelPageData).where(eq(schema.funnelPage.id, id))
  } else {
    await db.insert(schema.funnelPage).values({
      ...funnelPageData,
      content: funnelPageData.content ?? defaultContent,
      funnelId,
    })
  }

  revalidatePath(`/agency/${agencyId}/funnels/${funnelId}`, 'page')
  return db.query.funnelPage.findFirst({
    where: existing ? eq(schema.funnelPage.id, id) : eq(schema.funnelPage.funnelId, funnelId),
  })
}

export const deleteFunnelPage = async (funnelPageId: string) => {
  await db.delete(schema.funnelPage).where(eq(schema.funnelPage.id, funnelPageId))
}

export const getFunnelPageDetails = async (funnelPageId: string) => {
  return db.query.funnelPage.findFirst({
    where: eq(schema.funnelPage.id, funnelPageId),
  })
}

export const getDomainContent = async (subDomainName: string) => {
  return db.query.funnel.findFirst({
    where: eq(schema.funnel.subDomainName, subDomainName),
    with: { funnelPages: true },
  })
}

// ─── Contacts ───────────────────────────────────────────────────
export const searchContacts = async (searchTerms: string) => {
  return db.query.contact.findMany({
    where: like(schema.contact.name, `%${searchTerms}%`),
  })
}

export const upsertContact = async (contactData: {
  id?: string; name: string; email: string; agencyId: string
}) => {
  const id = contactData.id || v4()
  const existing = await db.query.contact.findFirst({ where: eq(schema.contact.id, id) })

  if (existing) {
    await db.update(schema.contact).set(contactData).where(eq(schema.contact.id, id))
  } else {
    await db.insert(schema.contact).values({ ...contactData, id })
  }

  return db.query.contact.findFirst({ where: eq(schema.contact.id, id) })
}

CHECKPOINT: All ~40 server actions compile without errors. Test the complete
query layer by calling initUser() -> upsertAgency() -> getAuthUserDetails()
end-to-end. Verify data in Drizzle Studio: agency has default sidebar options
and a "Lead Cycle" pipeline.
```

---

## Phase 6: Stripe Integration

### Task 6.1 — Stripe Client & Server Actions

```
TASK: Create the Stripe integration files: server client, browser client,
and server actions for subscription management.

1. Create `src/lib/stripe/index.ts`:

import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2023-10-16',
  appInfo: { name: Tinybox App', version: '0.1.0' },
})

2. Create `src/lib/stripe/stripe-client.ts`:

import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>
export const getStripe = (connectedAccountId?: string) => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
      { stripeAccount: connectedAccountId }
    )
  }
  return stripePromise
}

3. Create `src/lib/stripe/stripe-actions.ts`:

'use server'
import Stripe from 'stripe'
import { db } from '../db'
import * as schema from '../db/schema'
import { eq } from 'drizzle-orm'
import { stripe } from '.'

export const subscriptionCreated = async (
  subscription: Stripe.Subscription,
  customerId: string
) => {
  try {
    const agencyResult = await db.query.agency.findFirst({
      where: eq(schema.agency.customerId, customerId),
    })
    if (!agencyResult) throw new Error('Could not find agency to upsert subscription')

    const data = {
      active: subscription.status === 'active',
      agencyId: agencyResult.id,
      customerId,
      currentPeriodEndDate: new Date(subscription.current_period_end * 1000),
      priceId: (subscription as any).plan.id,
      subscriptionId: subscription.id,
      plan: (subscription as any).plan.id,
    }

    const existing = await db.query.subscription.findFirst({
      where: eq(schema.subscription.agencyId, agencyResult.id),
    })

    if (existing) {
      await db.update(schema.subscription).set(data).where(eq(schema.subscription.agencyId, agencyResult.id))
    } else {
      await db.insert(schema.subscription).values(data)
    }

    console.log(`Created Subscription for ${subscription.id}`)
  } catch (error) {
    console.log('Error from Create action', error)
  }
}

export const getConnectAccountProducts = async (stripeAccount: string) => {
  const products = await stripe.products.list(
    { limit: 50, expand: ['data.default_price'] },
    { stripeAccount }
  )
  return products.data
}

CHECKPOINT: Files compile. Stripe client initializes without error
(you'll need valid STRIPE_SECRET_KEY to actually call the API).
```

### Task 6.2 — Stripe API Routes

```
TASK: Create the Stripe API routes for webhooks and subscription management.

1. Create `src/app/api/stripe/webhook/route.ts`:

Build a POST handler that:
- Reads the raw request body
- Verifies the Stripe webhook signature using STRIPE_WEBHOOK_SECRET
- Handles these event types:
  - customer.subscription.created -> call subscriptionCreated()
  - customer.subscription.updated -> call subscriptionCreated() (same logic)
- Returns 200 on success, 400 on signature failure

Use stripe.webhooks.constructEvent() for verification.
Import subscriptionCreated from '@/lib/stripe/stripe-actions'.

2. Create `src/app/api/stripe/create-subscription/route.ts`:

Build a POST handler that:
- Accepts { customerId, priceId } from the request body
- Looks up the agency by customerId using Drizzle:
  db.query.agency.findFirst({ where: eq(schema.agency.customerId, customerId), with: { subscription: true } })
- If active subscription exists: update it (swap price item)
- If no subscription: create new with payment_behavior: 'default_incomplete'
- Returns { subscriptionId, clientSecret }

CHECKPOINT: Webhook route responds to POST requests.
```

---

## Phase 7: UploadThing Media

### Task 7.1 — UploadThing File Router & Media Pages

```
TASK: Set up UploadThing for file uploads and create the media bucket functionality.

1. Create `src/app/api/uploadthing/core.ts`:

import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { getCurrentUser } from '@/lib/auth-server'

const f = createUploadthing()

export const ourFileRouter = {
  avatar: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getCurrentUser()
      if (!user) throw new Error('Unauthorized')
      return { userId: user.id }
    })
    .onUploadComplete(async () => {}),
  agencyLogo: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getCurrentUser()
      if (!user) throw new Error('Unauthorized')
      return { userId: user.id }
    })
    .onUploadComplete(async () => {}),
  media: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getCurrentUser()
      if (!user) throw new Error('Unauthorized')
      return { userId: user.id }
    })
    .onUploadComplete(async () => {}),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

2. Create `src/app/api/uploadthing/route.ts`:

import { createRouteHandler } from 'uploadthing/next'
import { ourFileRouter } from './core'

export const { GET, POST } = createRouteHandler({ router: ourFileRouter })

3. Build the media bucket page at `src/app/(main)/agency/[agencyId]/media/page.tsx`:
   - Fetch media using getMedia(agencyId) from queries
   - Display uploaded files in a grid
   - Include an upload button using @uploadthing/react's UploadButton component
   - Include delete functionality using deleteMedia() from queries
   - Use createMedia() to save the upload record after UploadThing returns

CHECKPOINT: Upload a file via the media page. See it in the grid.
Delete it. Verify the media table in Drizzle Studio updates correctly.
```

---

## Phase 8: Agency Pages & Sidebar

### Task 8.1 — Agency Entry Point & Sidebar x

```
TASK: Build the agency entry point page and the sidebar navigation component.

1. Create `src/app/(main)/agency/page.tsx`:
   - Call verifyAndAcceptInvitation()
   - If it returns an agencyId, redirect to /agency/[agencyId]
   - If null, render the agency creation form (AgencyDetails component)

2. Create the sidebar component at `src/components/sidebar/menu-options.tsx`:
   - This is a CLIENT component
   - Props: agency details and sidebarOptions array
   - Renders a vertical nav with icons and labels from the sidebarOptions
   - Highlights the current active route
   - Includes the agency logo at the top
   - Includes user info and sign-out button at the bottom (using useSession()
     and signOut() from auth-client)

3. Create `src/app/(main)/agency/[agencyId]/layout.tsx`:
   - This is a SERVER component
   - Await params (Next.js 16: params is a Promise)
   - Call getAuthUserDetails() to get user with agency + sidebar options
   - Verify user belongs to this agency (userDetails.agencyId === agencyId)
   - If not, redirect to /agency/unauthorized
   - Fetch notifications via getNotificationAndUser(agencyId)
   - Render: <Sidebar> + <Infobar> + {children}

DATA FLOW:
layout.tsx (server)
  -> getAuthUserDetails()
  -> returns user with agency.sidebarOptions
  -> passes data as props to <Sidebar />
  -> <MenuOptions details={agency} sidebarOptions={options} />

IMPORTANT NEXT.JS 16 PATTERN:
params is now a Promise. Always destructure with await:
  const { agencyId } = await params

CHECKPOINT: After login, visiting /agency redirects to /agency/[agencyId].
Sidebar renders with all 10 default options. Current route is highlighted.
```

### Task 8.2 — Agency Settings & Dashboard Skeleton x

```
TASK: Build the agency settings page and a skeleton dashboard.

1. Create `src/app/(main)/agency/[agencyId]/settings/page.tsx`:
   - Server component
   - Fetch agency details via getAuthUserDetails()
   - Render the AgencyDetails form component (reuse from agency creation)
   - The form calls updateAgencyDetails() on submit

2. Create `src/components/forms/agency-details.tsx`:
   - Client component using react-hook-form + zod validation
   - Fields: name, email, phone, address, city, state, zip, country, logo (UploadThing), white label toggle
   - On submit: calls upsertAgency() or updateAgencyDetails()
   - Shows toast on success/error

3. Create `src/app/(main)/agency/[agencyId]/page.tsx` (dashboard):
   - Server component
   - For now, just fetch and display basic agency info
   - Show a placeholder for charts (Tremor charts added in Phase 9)

TYPE IMPORTS: Use `import type { Agency } from '@/lib/types'` everywhere.
Never import from '@prisma/client'.

CHECKPOINT: Settings page loads, form pre-fills with agency data,
updates save correctly. Dashboard page renders.
```

---

## Phase 9: Team & Invitations

### Task 9.1 — Team Management Page x

```
TASK: Build the team management page with user table and invitation system.

1. Create `src/app/(main)/agency/[agencyId]/team/page.tsx`:
   - Server component
   - Fetch team members: db.query.user.findMany({ where: eq(schema.user.agencyId, agencyId) })
   - Render with @tanstack/react-table
   - Columns: name, email, role, avatar, actions (edit/delete)

2. Create the invitation dialog component:
   - Client component
   - Form with email input and role select (AGENCY_ADMIN, AGENCY_USER, AGENCY_GUEST)
   - Calls sendInvitation(role, email, agencyId) on submit
   - Shows toast confirmation

3. Create user edit functionality:
   - Calls updateUser() to change role
   - Calls deleteUser() to remove team member
   - Both trigger saveActivityLogsNotification()

INVITATION FLOW (Better Auth replacement for Clerk invitations):
1. sendInvitation() inserts into invitation table with status: 'PENDING'
2. (Optional) Send email via Resend with a link to /agency
3. When invited user signs up and visits /agency, verifyAndAcceptInvitation()
   finds the pending invitation matching their email
4. Creates user with the invited role, deletes the invitation

CHECKPOINT: Send invitation. Sign up with that email. Verify automatic role
assignment. Team table shows the new member.
```

---

## Phase 10: CRM Pipeline & Kanban

### Task 10.1 — Pipeline Pages & Kanban Board x

```
TASK: Build the pipeline management pages with a drag-and-drop Kanban board.

CONTEXT: The Kanban uses @hello-pangea/dnd (React 19 compatible drop-in replacement
for react-beautiful-dnd). Lanes are columns, tickets are draggable cards within lanes.

1. Create `src/app/(main)/agency/[agencyId]/pipelines/page.tsx`:
   - Fetch pipelines via getPipelines(agencyId)
   - If pipelines exist, redirect to first pipeline
   - Otherwise show "Create Pipeline" CTA

2. Create `src/app/(main)/agency/[agencyId]/pipelines/[pipelineId]/page.tsx`:
   - Fetch lanes with tickets via getLanesWithTicketAndTags(pipelineId)
   - Render the Kanban board component

3. Build the Kanban board component:
   - Uses DragDropContext, Droppable, Draggable from @hello-pangea/dnd
   - Lanes are Droppable columns
   - Tickets are Draggable cards within lanes
   - On drag end:
     - If reordering lanes: call updateLanesOrder()
     - If moving tickets: call updateTicketsOrder()
   - Each ticket card shows: name, value, assigned user avatar, tag badges
   - Click ticket opens edit modal

4. Build ticket create/edit form:
   - Uses TicketFormSchema for validation
   - Tag selector (multi-select from agency tags)
   - Customer selector (search contacts via searchContacts())
   - Assigned user selector
   - Calls upsertTicket(ticketData, selectedTags)

CRITICAL TYPE CHANGE from Prisma:
  // OLD (Prisma): ticket.Tags, ticket.Assigned, ticket.Customer
  // NEW (Drizzle): ticket.tags, ticket.assigned, ticket.customer
  // The relation names are lowercase in Drizzle

CHECKPOINT: Create pipeline. Add lanes. Add tickets with tags.
Drag tickets between lanes. Verify order persists on reload.
```

---

## Phase 11: Funnel Builder

### Task 11.1 — Funnel List & CRUD Pages x

```
TASK: Build the funnel listing page and funnel detail/settings page.

1. Create `src/app/(main)/agency/[agencyId]/funnels/page.tsx`:
   - Fetch funnels via getFunnels(agencyId)
   - Render funnel cards showing name, description, subdomain, page count
   - "Create Funnel" button opens modal with CreateFunnelFormSchema form
   - Calls upsertFunnel() on submit

2. Create `src/app/(main)/agency/[agencyId]/funnels/[funnelId]/page.tsx`:
   - Fetch funnel via getFunnel(funnelId)
   - Show funnel settings (name, description, subdomain, favicon)
   - List funnel pages with reorder capability
   - "Add Page" calls upsertFunnelPage()
   - Click page opens the editor (Phase 11.2)

CHECKPOINT: Create a funnel. Add pages to it. Verify in Drizzle Studio.
```

### Task 11.2 — Funnel Editor x

```
TASK: Build the drag-and-drop funnel page editor.

CONTEXT: The editor uses React Context + useReducer to manage editor state.
Page content is stored as serialized JSON in funnelPage.content (longtext column).
The editor loads it via getFunnelPageDetails() -> JSON.parse(content) -> dispatches
LOAD_DATA. On save, it JSON.stringify(elements) -> upsertFunnelPage().

1. Create `src/providers/editor/editor-provider.tsx`:
   - EditorContext with useReducer
   - State shape: { elements: EditorElement[], selectedElement, device, previewMode, ... }
   - Actions: ADD_ELEMENT, UPDATE_ELEMENT, DELETE_ELEMENT, MOVE_ELEMENT,
     CHANGE_CLICKED_ELEMENT, LOAD_DATA, TOGGLE_PREVIEW_MODE, etc.
   - TYPE: import type { FunnelPage } from '@/lib/types' (NOT @prisma/client)

2. Create `src/providers/editor/editor-actions.tsx`:
   - Action type definitions and action creators
   - EditorElement type with recursive children
   - EditorBtns type union

3. Create the editor component at `src/components/funnels/funnel-editor.tsx`:
   - Renders the element tree recursively
   - Each element type has its own component:
     - TextComponent, ContainerComponent, VideoComponent, ImageComponent,
       LinkComponent, ContactFormComponent, PaymentFormComponent
   - These are pure React components with no auth/ORM dependencies
   - Drag-and-drop for reordering/nesting elements
   - Sidebar with element palette (drag to add)
   - Properties panel for styling selected element
   - Save button calls upsertFunnelPage() with JSON.stringify(elements)

4. Create `src/app/(main)/agency/[agencyId]/funnels/[funnelId]/editor/[funnelPageId]/page.tsx`:
   - Fetch page via getFunnelPageDetails(funnelPageId)
   - Wrap in EditorProvider
   - Render FunnelEditor

CHECKPOINT: Open editor. Drag elements onto canvas. Style them.
Save. Reload. Content persists.
```

---

## Phase 12: Dashboard & Contacts

### Task 12.1 — Agency Dashboard with Charts x

```
TASK: Build the full agency dashboard with Tremor charts and metrics.

Replace the skeleton dashboard from Phase 8.2 with:

1. Revenue metrics from Stripe subscription data
2. Goal progress bar (agency.goal)
3. Pipeline value totals (sum ticket values across all pipelines)
4. Contact count
5. Funnel performance (total page visits)

DATA FETCHING:
const agencyDetails = await db.query.agency.findFirst({
  where: eq(schema.agency.id, agencyId),
  with: {
    subscription: true,
    pipelines: { with: { lanes: { with: { tickets: true } } } },
    funnels: { with: { funnelPages: true } },
    contacts: true,
  },
})

const totalValue = agencyDetails.pipelines
  .flatMap(p => p.lanes)
  .flatMap(l => l.tickets)
  .reduce((sum, t) => sum + Number(t.value ?? 0), 0)

CHARTS: Use Tremor's AreaChart and DonutChart components. These are pure
client components that receive data as props -- no auth/ORM changes needed.

CHECKPOINT: Dashboard loads with real data from your agency.
```

### Task 12.2 — Contacts Page & Notifications x

```
TASK: Build the contacts management page and the infobar notification display.

1. Create `src/app/(main)/agency/[agencyId]/contacts/page.tsx`:
   - Fetch contacts for the agency
   - Render with @tanstack/react-table
   - "Create Contact" form using ContactUserFormSchema
   - Calls upsertContact() on submit

2. Build/update the Infobar component (rendered in the agency layout):
   - Fetches notifications via getNotificationAndUser(agencyId) (already done in layout)
   - Displays in a dropdown/sheet
   - Each notification shows the user avatar + notification text + timestamp

CHECKPOINT: Create contact. See it in contacts list.
Perform actions (create funnel, add team member, etc.).
Notifications appear in the infobar.
```

---

## Phase 13: Subdomain Routing & Published Funnels

### Task 13.1 — Domain Route Pages

```
TASK: Create the public-facing funnel pages served via subdomain routing.

CONTEXT: The rewrites in next.config.ts (from Phase 1) rewrite
mysite.yourdomain.com/pricing -> /mysite/pricing. These [domain] routes
handle that rewritten path.

1. Create `src/app/[domain]/page.tsx`:

import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import EditorProvider from '@/providers/editor/editor-provider'
import FunnelEditor from '@/components/funnels/funnel-editor'

export default async function DomainPage({
  params,
}: {
  params: Promise<{ domain: string }>
}) {
  const { domain } = await params

  const funnel = await db.query.funnel.findFirst({
    where: eq(schema.funnel.subDomainName, domain),
    with: {
      funnelPages: {
        orderBy: (pages, { asc }) => [asc(pages.order)],
      },
    },
  })

  if (!funnel || !funnel.funnelPages.length) return notFound()

  const firstPage = funnel.funnelPages[0]

  await db.update(schema.funnelPage)
    .set({ visits: (firstPage.visits ?? 0) + 1 })
    .where(eq(schema.funnelPage.id, firstPage.id))

  return (
    <EditorProvider
      agencyId={funnel.agencyId}
      funnelId={funnel.id}
      pageDetails={firstPage}
    >
      <FunnelEditor funnelPageId={firstPage.id} liveMode={true} />
    </EditorProvider>
  )
}

2. Create `src/app/[domain]/[path]/page.tsx`:
   - Same pattern but matches funnelPage by pathName === path
   - Increments visits counter
   - Renders in liveMode={true}

3. LOCAL TESTING:
   - Edit hosts file: 127.0.0.1 mysite.localhost
   - Set NEXT_PUBLIC_DOMAIN=localhost:3000
   - Visit http://mysite.localhost:3000
   - Should render the funnel with subDomainName: 'mysite'

CHECKPOINT (FINAL): End-to-end flow works:
Sign up -> create agency -> create funnel with subdomain -> build funnel page
in editor -> visit subdomain URL -> see published funnel.
```

---

## Appendix A: Quick Reference — Prisma to Drizzle Patterns

Use this as a cheat sheet when translating any remaining components:

| Prisma                                   | Drizzle                                                        |
| ---------------------------------------- | -------------------------------------------------------------- |
| `import { Model } from '@prisma/client'` | `import type { Model } from '@/lib/types'`                     |
| `db.model.findUnique({ where: { id } })` | `db.query.model.findFirst({ where: eq(schema.model.id, id) })` |
| `db.model.findMany({ where, orderBy })`  | `db.query.model.findMany({ where, orderBy })`                  |
| `db.model.create({ data })`              | `db.insert(schema.model).values(data)`                         |
| `db.model.update({ where, data })`       | `db.update(schema.model).set(data).where(...)`                 |
| `db.model.delete({ where })`             | `db.delete(schema.model).where(...)`                           |
| `include: { Relation: true }`            | `with: { relation: true }`                                     |
| `orderBy: { field: 'asc' }`              | `orderBy: asc(schema.model.field)`                             |
| `db.$transaction([...])`                 | `db.transaction(async (tx) => { ... })`                        |
| `ticket.Tags` (capitalized)              | `ticket.tags` (lowercase)                                      |
| Implicit M2M                             | Explicit junction table + `.map()` to flatten                  |

## Appendix B: Quick Reference — Clerk to Better Auth Patterns

| Clerk                                        | Better Auth                                        |
| -------------------------------------------- | -------------------------------------------------- |
| `currentUser()`                              | `getCurrentUser()` from `src/lib/auth-server.ts`   |
| `auth()`                                     | `getSession()` from `src/lib/auth-server.ts`       |
| `useUser()`                                  | `useSession()` from `src/lib/auth-client.ts`       |
| `<SignIn />` component                       | Custom form calling `signIn.email()`               |
| `<SignUp />` component                       | Custom form calling `signUp.email()`               |
| `<UserButton />`                             | Custom dropdown using `useSession()` + `signOut()` |
| `authMiddleware({ publicRoutes })`           | `requireAuth()` in `(main)/layout.tsx`             |
| `clerkClient.users.updateUserMetadata()`     | Store role in app `user` table directly            |
| `clerkClient.invitations.createInvitation()` | Insert into `invitation` table + send email        |
| `user.emailAddresses[0].emailAddress`        | `session.user.email`                               |
| `user.imageUrl`                              | `session.user.image`                               |

## Appendix C: Next.js 14 to 16 Patterns

| Next.js 14                           | Next.js 16                                          |
| ------------------------------------ | --------------------------------------------------- |
| `params: { id: string }` (sync)      | `params: Promise<{ id: string }>` (must await)      |
| `searchParams: { q: string }` (sync) | `searchParams: Promise<{ q: string }>` (must await) |
| `headers()` (sync)                   | `await headers()`                                   |
| `cookies()` (sync)                   | `await cookies()`                                   |
| `middleware.ts` for auth             | `requireAuth()` in layouts                          |
| `middleware.ts` for routing          | `rewrites` in `next.config.ts`                      |
| `react-beautiful-dnd`                | `@hello-pangea/dnd`                                 |
| `next.config.js` (CJS)               | `next.config.ts` (ESM)                              |
