import {
  pgTable,
  text,
  boolean,
  integer,
  bigint,
  jsonb,
  timestamp,
  uuid,
  serial,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type {
  AdminUser,
  CmsBlock,
  ContactFormField,
  ContentRevision,
  MenuItem,
  SeoMeta,
} from '../cms/types';
import type { ProjectMeta } from '../cms/blocks';

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/** Réglages « singleton » (infos générales, identité, IA, WhatsApp…) : une ligne par section. */
export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const pages = pgTable(
  'pages',
  {
    id: text('id').primaryKey(),
    path: text('path').notNull(),
    title: text('title').notNull(),
    status: text('status', { enum: ['draft', 'published', 'scheduled'] }).notNull(),
    contentSource: text('content_source', { enum: ['react', 'cms'] }).notNull(),
    template: text('template', { enum: ['default', 'landing', 'legal', 'project'] }).notNull(),
    blocks: jsonb('blocks').$type<CmsBlock[]>().notNull(),
    seo: jsonb('seo').$type<SeoMeta>().notNull(),
    project: jsonb('project').$type<ProjectMeta>(),
    position: integer('position').notNull().default(0),
    publishedAt: ts('published_at'),
    scheduledAt: ts('scheduled_at'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => [uniqueIndex('pages_path_uq').on(t.path), index('pages_status_idx').on(t.status)]
);

export const posts = pgTable(
  'posts',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    excerpt: text('excerpt').notNull().default(''),
    coverImage: text('cover_image'),
    blocks: jsonb('blocks').$type<CmsBlock[]>().notNull(),
    seo: jsonb('seo').$type<SeoMeta>().notNull(),
    status: text('status', { enum: ['draft', 'published'] }).notNull(),
    author: text('author'),
    tags: text('tags').array().notNull().default([]),
    publishedAt: ts('published_at'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => [uniqueIndex('posts_slug_uq').on(t.slug), index('posts_status_idx').on(t.status, t.publishedAt)]
);

export const revisions = pgTable(
  'revisions',
  {
    id: uuid('id').primaryKey(),
    entityType: text('entity_type', { enum: ['page', 'post'] }).notNull(),
    entityId: text('entity_id').notNull(),
    label: text('label').notNull(),
    snapshot: jsonb('snapshot').$type<ContentRevision['snapshot']>().notNull(),
    authorEmail: text('author_email'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('revisions_entity_idx').on(t.entityType, t.entityId, t.createdAt)]
);

export const menus = pgTable('menus', {
  id: text('id', { enum: ['primary', 'mobile', 'footer'] }).primaryKey(),
  label: text('label').notNull(),
  items: jsonb('items').$type<MenuItem[]>().notNull(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const redirects = pgTable(
  'redirects',
  {
    id: serial('id').primaryKey(),
    fromPath: text('from_path').notNull(),
    toPath: text('to_path').notNull(),
    permanent: boolean('permanent').notNull().default(true),
    position: integer('position').notNull().default(0),
  },
  (t) => [uniqueIndex('redirects_from_uq').on(t.fromPath)]
);

export const forms = pgTable('forms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  recipientEmails: text('recipient_emails').array().notNull().default([]),
  successPath: text('success_path').notNull(),
  fields: jsonb('fields').$type<ContactFormField[]>().notNull(),
  honeypotField: text('honeypot_field'),
  enabled: boolean('enabled').notNull().default(true),
  position: integer('position').notNull().default(0),
});

export const formSubmissions = pgTable(
  'form_submissions',
  {
    id: text('id').primaryKey(),
    formId: text('form_id').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    read: boolean('read').notNull().default(false),
    createdAt: ts('created_at').notNull(),
  },
  (t) => [index('form_submissions_created_idx').on(t.createdAt), index('form_submissions_form_idx').on(t.formId)]
);

export const subscribers = pgTable(
  'newsletter_subscribers',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    status: text('status', { enum: ['pending', 'active', 'unsubscribed'] }).notNull(),
    source: text('source'),
    confirmToken: text('confirm_token'),
    createdAt: ts('created_at').notNull(),
    confirmedAt: ts('confirmed_at'),
  },
  (t) => [uniqueIndex('subscribers_email_uq').on(t.email), index('subscribers_token_idx').on(t.confirmToken)]
);

export const media = pgTable(
  'media',
  {
    id: text('id').primaryKey(),
    filename: text('filename').notNull(),
    url: text('url').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    alt: text('alt'),
    createdAt: ts('created_at').notNull(),
  },
  (t) => [index('media_created_idx').on(t.createdAt)]
);

export const users = pgTable(
  'admin_users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    role: text('role', { enum: ['superadmin', 'editor', 'seo', 'viewer'] }).$type<AdminUser['role']>().notNull(),
    passwordHash: text('password_hash').notNull(),
    salt: text('salt').notNull(),
    lastLoginAt: ts('last_login_at'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('admin_users_email_uq').on(t.email)]
);

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey(),
    kind: text('kind', { enum: ['view', 'leave'] }).notNull(),
    sessionId: text('session_id').notNull(),
    path: text('path').notNull(),
    referrer: text('referrer'),
    country: text('country'),
    city: text('city'),
    device: text('device', { enum: ['mobile', 'tablet', 'desktop', 'unknown'] }).notNull(),
    durationSec: integer('duration_sec'),
    ts: ts('ts').notNull(),
  },
  (t) => [
    index('analytics_ts_idx').on(t.ts),
    index('analytics_kind_ts_idx').on(t.kind, t.ts),
    index('analytics_session_idx').on(t.sessionId),
  ]
);
