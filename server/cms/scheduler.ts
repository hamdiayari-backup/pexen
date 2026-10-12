import type { CmsPage, CmsSnapshot, PageContentSource } from './types';
import { createDefaultSeoGlobal } from './defaults';
import { migrateContentToBlocks } from './contentMigration';

/** Publie les pages/articles planifiés dont la date est passée. */
export function applyScheduledPublishing(snapshot: CmsSnapshot): boolean {
  const now = Date.now();
  let changed = false;

  for (const page of snapshot.pages) {
    if (page.status === 'scheduled' && page.scheduledAt) {
      if (new Date(page.scheduledAt).getTime() <= now) {
        page.status = 'published';
        page.publishedAt = new Date().toISOString();
        changed = true;
      }
    }
  }

  for (const post of snapshot.posts) {
    if (post.status === 'draft' && post.publishedAt) {
      const pub = new Date(post.publishedAt).getTime();
      if (pub <= now && pub > 0) {
        post.status = 'published';
        changed = true;
      }
    }
  }

  return changed;
}

export function migrateSnapshot(snapshot: CmsSnapshot): void {
  if (!snapshot.settings.seo) snapshot.settings.seo = createDefaultSeoGlobal();
  if (!snapshot.floatingButtons) snapshot.floatingButtons = [];
  for (const page of snapshot.pages) {
    const p = page as CmsPage & { contentSource?: PageContentSource };
    if (!p.contentSource) {
      p.contentSource =
        page.path === '/mentions-legales/' ||
        page.path === '/politique-de-confidentialite/' ||
        page.path === '/cookies/'
          ? 'cms'
          : 'react';
    }
  }
  migrateContentToBlocks(snapshot);
}
