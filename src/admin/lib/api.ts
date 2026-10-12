import type {
  AdminUser,
  BlogPost,
  CmsPage,
  CmsSnapshot,
  ContactFormConfig,
  ContactSubmission,
  MediaAsset,
  MenuItem,
  NewsletterSubscriber,
  RedirectRule,
  SeoMeta,
} from '../../../server/cms/types';
import type { SeoAnalysis } from '../../../server/cms/seoAnalyzer';
import type { AnalyticsSummary } from '../../../server/cms/types';

const TOKEN_KEY = 'pexen_admin_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)),
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`/api/admin${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Connexion au serveur impossible. Vérifiez votre réseau.');
  }
  if (res.status === 401 && path !== '/login') {
    tokenStore.set(null);
    window.dispatchEvent(new Event('admin:session-expired'));
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error || `Erreur ${res.status}`, data?.fields);
  return data as T;
}

const get = <T>(p: string) => request<T>(p);
const send = <T>(method: string, p: string, body?: unknown) =>
  request<T>(p, { method, body: body === undefined ? undefined : JSON.stringify(body) });

export type PublicUser = Pick<AdminUser, 'id' | 'email' | 'name' | 'role' | 'lastLoginAt'>;
export type ClientSnapshot = Omit<CmsSnapshot, 'users' | 'formSubmissions' | 'subscribers' | 'google'> & {
  users: PublicUser[];
  google: Omit<CmsSnapshot['google'], 'oauthRefreshToken'> & { hasRefreshToken: boolean };
};
export type PageWithScore = CmsPage & { seoScore: number };
export type PostWithScore = BlogPost & { seoScore: number };
export interface Revision {
  id: string;
  label: string;
  title: string;
  createdAt: string;
  authorEmail?: string;
}
export interface DashboardData {
  analytics: AnalyticsSummary;
  counts: Record<'pages' | 'publishedPages' | 'posts' | 'draftPosts' | 'unreadSubmissions' | 'submissions' | 'subscribers' | 'media', number>;
  seoAverage: number;
  recentSubmissions: ContactSubmission[];
  maintenance: boolean;
  health: { smtp: boolean; gemini: boolean; google: boolean; googleOAuthConfigured: boolean };
}
export interface SeoOverviewRow {
  kind: 'page' | 'post';
  id: string;
  title: string;
  url: string;
  status: string;
  seo: SeoMeta;
  analysis: SeoAnalysis;
}
export interface GoogleStatus {
  configured: boolean;
  connected: boolean;
  property?: string;
  lastSyncAt?: string;
  redirectUri: string;
}
export interface SearchPerformance {
  range: { start: string; end: string };
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  timeseries: { date: string; clicks: number; impressions: number }[];
  queries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  pages: { page: string; clicks: number; impressions: number; ctr: number; position: number }[];
}

export const api = {
  login: (email: string, password: string) => send<{ token: string; user: PublicUser }>('POST', '/login', { email, password }),
  me: () => get<{ user: PublicUser }>('/me'),
  changePassword: (current: string, next: string) => send<{ token: string }>('PUT', '/me/password', { current, next }),

  snapshot: () => get<ClientSnapshot>('/snapshot'),
  dashboard: () => get<DashboardData>('/dashboard'),
  saveSection: (section: 'general' | 'branding' | 'settings' | 'whatsapp' | 'ai' | 'newsletter' | 'google' | 'seo-settings', body: unknown) =>
    send<{ ok: true }>('PUT', `/${section}`, body),
  saveFloatingButtons: (buttons: unknown) => send('PUT', '/floating-buttons', { buttons }),
  saveMenu: (id: string, items: MenuItem[]) => send('PUT', `/menus/${id}`, { items }),
  saveRedirects: (redirects: RedirectRule[]) => send('PUT', '/redirects', { redirects }),

  pages: () => get<PageWithScore[]>('/pages'),
  createPage: (body: Partial<CmsPage>) => send<CmsPage>('POST', '/pages', body),
  updatePage: (id: string, body: Partial<CmsPage>) => send<PageWithScore>('PUT', `/pages/${id}`, body),
  deletePage: (id: string) => send('DELETE', `/pages/${id}`),
  pageRevisions: (id: string) => get<Revision[]>(`/pages/${id}/revisions`),
  restorePage: (id: string, rev: string) => send<CmsPage>('POST', `/pages/${id}/revisions/${rev}/restore`),

  posts: () => get<PostWithScore[]>('/posts'),
  createPost: (body: Partial<BlogPost>) => send<BlogPost>('POST', '/posts', body),
  updatePost: (id: string, body: Partial<BlogPost>) => send<PostWithScore>('PUT', `/posts/${id}`, body),
  deletePost: (id: string) => send('DELETE', `/posts/${id}`),
  postRevisions: (id: string) => get<Revision[]>(`/posts/${id}/revisions`),
  restorePost: (id: string, rev: string) => send<BlogPost>('POST', `/posts/${id}/revisions/${rev}/restore`),

  aiInfo: () =>
    get<{ usage: { date: string; requests: number; sessions: number; tokens: number; blocked: number; uniqueIps: number }; defaultSystemInstruction: string; configured: boolean }>(
      '/ai/info'
    ),

  seoOverview: () => get<SeoOverviewRow[]>('/seo/overview'),

  forms: () => get<{ forms: ContactFormConfig[]; submissions: ContactSubmission[] }>('/forms'),
  saveForm: (id: string, body: ContactFormConfig) => send('PUT', `/forms/${id}`, body),
  markSubmission: (id: string, read: boolean) => send('PATCH', `/submissions/${id}`, { read }),
  deleteSubmission: (id: string) => send('DELETE', `/submissions/${id}`),

  analytics: (days: number) => get<AnalyticsSummary>(`/analytics?days=${days}`),

  media: () => get<MediaAsset[]>('/media'),
  upload: (payload: { filename: string; dataBase64: string; mimeType: string; alt?: string }) => send<MediaAsset>('POST', '/media/upload', payload),
  updateMedia: (id: string, alt: string) => send('PATCH', `/media/${id}`, { alt }),
  deleteMedia: (id: string) => send('DELETE', `/media/${id}`),

  subscribers: () => get<Omit<NewsletterSubscriber, 'confirmToken'>[]>('/subscribers'),
  setSubscriberStatus: (id: string, status: NewsletterSubscriber['status']) => send('PATCH', `/subscribers/${id}`, { status }),
  deleteSubscriber: (id: string) => send('DELETE', `/subscribers/${id}`),

  users: () => get<PublicUser[]>('/users'),
  createUser: (body: { email: string; name: string; role: AdminUser['role']; password: string }) => send<PublicUser>('POST', '/users', body),
  updateUser: (id: string, body: { name?: string; role?: AdminUser['role']; password?: string }) => send('PATCH', `/users/${id}`, body),
  deleteUser: (id: string) => send('DELETE', `/users/${id}`),

  google: {
    status: () => get<GoogleStatus>('/google/status'),
    connect: () => get<{ authUrl: string }>('/google/connect'),
    sites: () => get<{ siteUrl: string; permissionLevel: string }[]>('/google/sites'),
    performance: (days: number) => get<SearchPerformance>(`/google/performance?days=${days}`),
    disconnect: () => send('POST', '/google/disconnect'),
  },
};
