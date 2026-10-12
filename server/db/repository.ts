import { asc, desc, inArray } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import type {
  AdminUser,
  BlogPost,
  CmsPage,
  CmsSnapshot,
  ContactFormConfig,
  ContactSubmission,
  MediaAsset,
  MenuConfig,
  NewsletterSubscriber,
  RedirectRule,
} from '../cms/types';
import { db, type Tx } from './client';
import * as t from './schema';

/* ------------------------------------------------------------------ */
/* Conversions                                                         */
/* ------------------------------------------------------------------ */

const toDate = (s?: string | null) => (s ? new Date(s) : null);
const iso = (d?: Date | null) => (d ? d.toISOString() : undefined);

/** Retire les clés `undefined` pour que les objets restent comparables et sérialisables. */
function compact<T extends object>(o: T): T {
  for (const k of Object.keys(o) as (keyof T)[]) if (o[k] === undefined) delete o[k];
  return o;
}

const pageToRow = (p: CmsPage, position: number): typeof t.pages.$inferInsert => ({
  id: p.id,
  path: p.path,
  title: p.title,
  status: p.status,
  contentSource: p.contentSource,
  template: p.template,
  blocks: p.blocks,
  seo: p.seo,
  project: p.project ?? null,
  position,
  publishedAt: toDate(p.publishedAt),
  scheduledAt: toDate(p.scheduledAt),
  createdAt: new Date(p.createdAt),
  updatedAt: new Date(p.updatedAt),
});

const rowToPage = (r: typeof t.pages.$inferSelect): CmsPage =>
  compact({
    id: r.id,
    path: r.path,
    title: r.title,
    status: r.status,
    publishedAt: iso(r.publishedAt),
    scheduledAt: iso(r.scheduledAt),
    contentSource: r.contentSource,
    template: r.template,
    blocks: r.blocks,
    seo: r.seo,
    project: r.project ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  });

const postToRow = (p: BlogPost): typeof t.posts.$inferInsert => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt ?? '',
  coverImage: p.coverImage ?? null,
  blocks: p.blocks,
  seo: p.seo,
  status: p.status,
  author: p.author ?? null,
  tags: p.tags ?? [],
  publishedAt: toDate(p.publishedAt),
  createdAt: new Date(p.createdAt),
  updatedAt: new Date(p.updatedAt),
});

const rowToPost = (r: typeof t.posts.$inferSelect): BlogPost =>
  compact({
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    coverImage: r.coverImage ?? undefined,
    blocks: r.blocks,
    seo: r.seo,
    status: r.status,
    publishedAt: iso(r.publishedAt),
    author: r.author ?? undefined,
    tags: r.tags,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  });

const formToRow = (f: ContactFormConfig, position: number): typeof t.forms.$inferInsert => ({
  id: f.id,
  name: f.name,
  recipientEmails: f.recipientEmails,
  successPath: f.successPath,
  fields: f.fields,
  honeypotField: f.honeypotField ?? null,
  enabled: f.enabled,
  position,
});

const rowToForm = (r: typeof t.forms.$inferSelect): ContactFormConfig =>
  compact({
    id: r.id,
    name: r.name,
    recipientEmails: r.recipientEmails,
    successPath: r.successPath,
    fields: r.fields,
    honeypotField: r.honeypotField ?? undefined,
    enabled: r.enabled,
  });

const submissionToRow = (s: ContactSubmission): typeof t.formSubmissions.$inferInsert => ({
  id: s.id,
  formId: s.formId,
  payload: s.payload,
  ip: s.ip ?? null,
  userAgent: s.userAgent ?? null,
  read: s.read,
  createdAt: new Date(s.createdAt),
});

const rowToSubmission = (r: typeof t.formSubmissions.$inferSelect): ContactSubmission =>
  compact({
    id: r.id,
    formId: r.formId,
    payload: r.payload,
    ip: r.ip ?? undefined,
    userAgent: r.userAgent ?? undefined,
    createdAt: r.createdAt.toISOString(),
    read: r.read,
  });

const subscriberToRow = (s: NewsletterSubscriber): typeof t.subscribers.$inferInsert => ({
  id: s.id,
  email: s.email,
  status: s.status,
  source: s.source ?? null,
  confirmToken: s.confirmToken ?? null,
  createdAt: new Date(s.createdAt),
  confirmedAt: toDate(s.confirmedAt),
});

const rowToSubscriber = (r: typeof t.subscribers.$inferSelect): NewsletterSubscriber =>
  compact({
    id: r.id,
    email: r.email,
    status: r.status,
    source: r.source ?? undefined,
    confirmToken: r.confirmToken ?? undefined,
    createdAt: r.createdAt.toISOString(),
    confirmedAt: iso(r.confirmedAt),
  });

const mediaToRow = (m: MediaAsset): typeof t.media.$inferInsert => ({
  id: m.id,
  filename: m.filename,
  url: m.url,
  mimeType: m.mimeType,
  sizeBytes: m.sizeBytes,
  alt: m.alt ?? null,
  createdAt: new Date(m.createdAt),
});

const rowToMedia = (r: typeof t.media.$inferSelect): MediaAsset =>
  compact({
    id: r.id,
    filename: r.filename,
    url: r.url,
    mimeType: r.mimeType,
    sizeBytes: r.sizeBytes,
    alt: r.alt ?? undefined,
    createdAt: r.createdAt.toISOString(),
  });

const userToRow = (u: AdminUser): typeof t.users.$inferInsert => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  passwordHash: u.passwordHash,
  salt: u.salt,
  lastLoginAt: toDate(u.lastLoginAt),
});

const rowToUser = (r: typeof t.users.$inferSelect): AdminUser =>
  compact({
    id: r.id,
    email: r.email,
    passwordHash: r.passwordHash,
    salt: r.salt,
    role: r.role,
    name: r.name,
    lastLoginAt: iso(r.lastLoginAt),
  });

const menuToRow = (m: MenuConfig): typeof t.menus.$inferInsert => ({ id: m.id, label: m.label, items: m.items });

/* ------------------------------------------------------------------ */
/* Lecture                                                             */
/* ------------------------------------------------------------------ */

const SINGLETONS = ['general', 'branding', 'whatsapp', 'floatingButtons', 'ai', 'newsletter', 'settings', 'google'] as const;
type SingletonKey = (typeof SINGLETONS)[number];

/** Charge l'état complet du CMS ; `null` si la base n'a jamais été initialisée. */
export async function loadFromDatabase(): Promise<CmsSnapshot | null> {
  const settingsRows = await db.select().from(t.siteSettings);
  if (!settingsRows.length) return null;
  const settings = new Map(settingsRows.map((r) => [r.key, r.value]));

  const [pages, posts, menus, redirects, forms, submissions, subscribers, media, users] = await Promise.all([
    db.select().from(t.pages).orderBy(asc(t.pages.position), asc(t.pages.createdAt)),
    db.select().from(t.posts).orderBy(desc(t.posts.createdAt)),
    db.select().from(t.menus),
    db.select().from(t.redirects).orderBy(asc(t.redirects.position)),
    db.select().from(t.forms).orderBy(asc(t.forms.position)),
    db.select().from(t.formSubmissions).orderBy(desc(t.formSubmissions.createdAt)),
    db.select().from(t.subscribers).orderBy(desc(t.subscribers.createdAt)),
    db.select().from(t.media).orderBy(desc(t.media.createdAt)),
    db.select().from(t.users).orderBy(asc(t.users.createdAt)),
  ]);

  const menuOrder = ['primary', 'mobile', 'footer'];
  return {
    version: Number(settings.get('version') ?? 1),
    general: settings.get('general'),
    branding: settings.get('branding'),
    whatsapp: settings.get('whatsapp'),
    floatingButtons: settings.get('floatingButtons') ?? [],
    ai: settings.get('ai'),
    newsletter: settings.get('newsletter'),
    settings: settings.get('settings'),
    google: settings.get('google') ?? { connected: false },
    pages: pages.map(rowToPage),
    posts: posts.map(rowToPost),
    menus: menus
      .sort((a, b) => menuOrder.indexOf(a.id) - menuOrder.indexOf(b.id))
      .map((m) => ({ id: m.id, label: m.label, items: m.items })),
    redirects: redirects.map((r) => ({ from: r.fromPath, to: r.toPath, permanent: r.permanent })),
    forms: forms.map(rowToForm),
    formSubmissions: submissions.map(rowToSubmission),
    subscribers: subscribers.map(rowToSubscriber),
    media: media.map(rowToMedia),
    users: users.map(rowToUser),
  } as CmsSnapshot;
}

/* ------------------------------------------------------------------ */
/* Écriture différentielle                                             */
/* ------------------------------------------------------------------ */

type AnyTable = PgTable & { id: Parameters<typeof inArray>[0] };

/** Upsert des lignes modifiées et suppression des lignes disparues, comparées par `id`. */
async function syncCollection<Row extends { id: string }>(
  tx: Tx,
  table: AnyTable,
  prev: Row[],
  next: Row[],
  immutableOnUpdate: string[] = []
) {
  const before = new Map(prev.map((r) => [r.id, JSON.stringify(r)]));
  const changed = next.filter((r) => before.get(r.id) !== JSON.stringify(r));
  const nextIds = new Set(next.map((r) => r.id));
  const removed = prev.filter((r) => !nextIds.has(r.id)).map((r) => r.id);

  if (removed.length) await tx.delete(table).where(inArray(table.id, removed));
  for (const row of changed) {
    const set: Record<string, unknown> = { ...row };
    delete set.id;
    for (const k of immutableOnUpdate) delete set[k];
    await tx
      .insert(table)
      .values(row as never)
      .onConflictDoUpdate({ target: table.id as never, set: set as never });
  }
}

const rowsOf = <T, R>(items: T[] | undefined, map: (x: T, i: number) => R) => (items ?? []).map(map);

/**
 * Persiste dans une transaction uniquement ce qui diffère entre `prev` et `next`.
 * `prev = null` écrit l'état complet (initialisation / import).
 */
export async function persistSnapshot(tx: Tx, prev: CmsSnapshot | null, next: CmsSnapshot): Promise<void> {
  const singletonValues: Record<SingletonKey | 'version', unknown> = {
    version: next.version,
    general: next.general,
    branding: next.branding,
    whatsapp: next.whatsapp,
    floatingButtons: next.floatingButtons,
    ai: next.ai,
    newsletter: next.newsletter,
    settings: next.settings,
    google: next.google,
  };
  for (const [key, value] of Object.entries(singletonValues)) {
    const old = prev ? (key === 'version' ? prev.version : prev[key as SingletonKey]) : undefined;
    if (prev && JSON.stringify(old) === JSON.stringify(value)) continue;
    await tx
      .insert(t.siteSettings)
      .values({ key, value: value ?? null, updatedAt: new Date() })
      .onConflictDoUpdate({ target: t.siteSettings.key, set: { value: value ?? null, updatedAt: new Date() } });
  }

  await syncCollection(tx, t.pages as AnyTable, rowsOf(prev?.pages, pageToRow) as never, rowsOf(next.pages, pageToRow) as never, ['createdAt']);
  await syncCollection(tx, t.posts as AnyTable, rowsOf(prev?.posts, postToRow) as never, rowsOf(next.posts, postToRow) as never, ['createdAt']);
  await syncCollection(tx, t.menus as AnyTable, rowsOf(prev?.menus, menuToRow) as never, rowsOf(next.menus, menuToRow) as never);
  await syncCollection(tx, t.forms as AnyTable, rowsOf(prev?.forms, formToRow) as never, rowsOf(next.forms, formToRow) as never);
  await syncCollection(
    tx,
    t.formSubmissions as AnyTable,
    rowsOf(prev?.formSubmissions, submissionToRow) as never,
    rowsOf(next.formSubmissions, submissionToRow) as never,
    ['createdAt']
  );
  await syncCollection(
    tx,
    t.subscribers as AnyTable,
    rowsOf(prev?.subscribers, subscriberToRow) as never,
    rowsOf(next.subscribers, subscriberToRow) as never,
    ['createdAt']
  );
  await syncCollection(tx, t.media as AnyTable, rowsOf(prev?.media, mediaToRow) as never, rowsOf(next.media, mediaToRow) as never, ['createdAt']);
  await syncCollection(tx, t.users as AnyTable, rowsOf(prev?.users, userToRow) as never, rowsOf(next.users, userToRow) as never);

  if (!prev || JSON.stringify(prev.redirects) !== JSON.stringify(next.redirects)) {
    await syncRedirects(tx, next.redirects ?? []);
  }
}

async function syncRedirects(tx: Tx, rules: RedirectRule[]) {
  await tx.delete(t.redirects);
  if (!rules.length) return;
  await tx.insert(t.redirects).values(
    rules.map((r, position) => ({ fromPath: r.from, toPath: r.to, permanent: r.permanent, position }))
  );
}
