import crypto from 'crypto';
import { loadSnapshot, updateSnapshot } from '../cms/store';
import { canSeo, superOnly } from '../middleware/adminAuth';
import { asyncRouter, HttpError } from '../http';

const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
].join(' ');

const pendingStates = new Map<string, number>();

function oauthConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/admin/google/callback',
  };
}

let accessCache: { token: string; exp: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (accessCache && accessCache.exp > Date.now() + 30_000) return accessCache.token;
  const s = await loadSnapshot();
  if (!s.google.oauthRefreshToken) throw new HttpError(400, 'Compte Google non connecté');
  const { clientId, clientSecret } = oauthConfig();
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: s.google.oauthRefreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const json = (await r.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!json.access_token) throw new HttpError(502, json.error_description || 'Jeton Google refusé, reconnectez le compte');
  accessCache = { token: json.access_token, exp: Date.now() + (json.expires_in || 3600) * 1000 };
  return json.access_token;
}

async function googleFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const r = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const json = (await r.json()) as T & { error?: { message?: string } };
  if (!r.ok) throw new HttpError(502, json.error?.message || `Erreur API Google (${r.status})`);
  return json;
}

export function createGoogleOAuthRouter() {
  const router = asyncRouter();

  router.get('/status', canSeo, async (_req, res) => {
    const s = await loadSnapshot();
    res.json({
      configured: !!oauthConfig().clientId && !!oauthConfig().clientSecret,
      connected: s.google.connected && !!s.google.oauthRefreshToken,
      property: s.google.searchConsoleProperty,
      lastSyncAt: s.google.lastSyncAt,
      redirectUri: oauthConfig().redirectUri,
    });
  });

  router.get('/connect', canSeo, async (_req, res) => {
    const { clientId, redirectUri } = oauthConfig();
    if (!clientId) throw new HttpError(503, 'Identifiants OAuth Google non configurés sur le serveur');
    const state = crypto.randomBytes(24).toString('hex');
    pendingStates.set(state, Date.now() + 10 * 60_000);
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state,
    }).toString();
    res.json({ authUrl: url.toString() });
  });

  router.get('/callback', async (req, res) => {
    const code = String(req.query.code || '');
    const state = String(req.query.state || '');
    const exp = pendingStates.get(state);
    pendingStates.delete(state);
    if (!code || !exp || exp < Date.now()) return res.redirect('/administrator/seo?google=error');

    const { clientId, clientSecret, redirectUri } = oauthConfig();
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });
    const tokens = (await r.json()) as { refresh_token?: string };
    if (!r.ok || !tokens.refresh_token) return res.redirect('/administrator/seo?google=error');

    accessCache = null;
    await updateSnapshot((s) => {
      s.google.connected = true;
      s.google.oauthRefreshToken = tokens.refresh_token;
      s.google.lastSyncAt = new Date().toISOString();
    });
    res.redirect('/administrator/seo?google=connected');
  });

  router.get('/sites', canSeo, async (_req, res) => {
    const data = await googleFetch<{ siteEntry?: { siteUrl: string; permissionLevel: string }[] }>(
      'https://www.googleapis.com/webmasters/v3/sites'
    );
    res.json(data.siteEntry || []);
  });

  router.get('/performance', canSeo, async (req, res) => {
    const s = await loadSnapshot();
    const site = s.google.searchConsoleProperty;
    if (!site) throw new HttpError(400, 'Sélectionnez une propriété Search Console');
    const days = Math.min(Number(req.query.days) || 28, 480);
    const end = new Date(Date.now() - 2 * 86400000);
    const start = new Date(end.getTime() - days * 86400000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
    type Row = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };
    const query = (dimensions: string[], rowLimit: number) =>
      googleFetch<{ rows?: Row[] }>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), dimensions, rowLimit }),
      });
    const [byDate, byQuery, byPage] = await Promise.all([query(['date'], 500), query(['query'], 50), query(['page'], 50)]);
    const rows = byDate.rows || [];
    const totals = rows.reduce(
      (a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }),
      { clicks: 0, impressions: 0 }
    );
    await updateSnapshot((snap) => {
      snap.google.lastSyncAt = new Date().toISOString();
    });
    res.json({
      range: { start: fmt(start), end: fmt(end) },
      totals: {
        ...totals,
        ctr: totals.impressions ? totals.clicks / totals.impressions : 0,
        position: rows.length ? rows.reduce((a, r) => a + r.position, 0) / rows.length : 0,
      },
      timeseries: rows.map((r) => ({ date: r.keys![0], clicks: r.clicks, impressions: r.impressions })),
      queries: (byQuery.rows || []).map((r) => ({ query: r.keys![0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
      pages: (byPage.rows || []).map((r) => ({ page: r.keys![0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    });
  });

  router.post('/disconnect', superOnly, async (_req, res) => {
    accessCache = null;
    await updateSnapshot((s) => {
      s.google = { connected: false, searchConsoleProperty: s.google.searchConsoleProperty };
    });
    res.json({ ok: true });
  });

  return router;
}
