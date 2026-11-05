/**
 * Active pexen-maquette via l'API du process PM2 (évite le cache mémoire hors-process).
 */
import 'dotenv/config';

const BASE = process.env.PEXEN_LOCAL_URL || 'http://127.0.0.1:3010';
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

async function main() {
  if (!email || !password) throw new Error('ADMIN_EMAIL / ADMIN_PASSWORD manquants');

  const login = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginBody = await login.json().catch(() => ({}));
  if (!login.ok) throw new Error(`Login failed: ${login.status} ${JSON.stringify(loginBody)}`);
  const token = loginBody.token || loginBody.accessToken || loginBody.sessionToken;
  const cookie = login.headers.get('set-cookie') || '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie.split(';')[0];

  const install = await fetch(`${BASE}/api/admin/themes/pexen-maquette/install`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ withContent: false }),
  });
  console.log('install', install.status, await install.text());

  const act = await fetch(`${BASE}/api/admin/themes/pexen-maquette/activate`, {
    method: 'POST',
    headers,
    body: '{}',
  });
  console.log('activate', act.status, await act.text());

  const cfg = await fetch(`${BASE}/api/public/site-config`);
  const body = await cfg.json();
  console.log('appearance', body.appearance);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
