import 'dotenv/config';
import { updateSnapshot } from '../server/cms/store';
import { pool } from '../server/db/client';

const snap = await updateSnapshot((s) => {
  const blog = s.pages.find((p) => p.path === '/blog/');
  if (!blog) throw new Error('/blog/ introuvable');
  blog.seo = { ...blog.seo, slug: blog.seo.slug || 'blog' };
  blog.updatedAt = new Date().toISOString();
  console.log('fixed /blog/ slug →', blog.seo.slug);
});

console.log(snap.pages.find((p) => p.path === '/blog/')?.seo);
await pool.end();
