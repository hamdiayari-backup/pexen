const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const numFmt = new Intl.NumberFormat('fr-FR');

export const fmtDate = (iso?: string) => (iso ? dateFmt.format(new Date(iso)) : '—');
export const fmtDateTime = (iso?: string) => (iso ? dateTimeFmt.format(new Date(iso)) : '—');
export const fmtNumber = (n: number) => numFmt.format(n);
export const fmtPercent = (n: number, digits = 1) => `${(n * 100).toFixed(digits).replace('.', ',')} %`;

export function fmtDuration(sec: number): string {
  if (!sec) return '0 s';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m} min ${s.toString().padStart(2, '0')} s` : `${s} s`;
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`;
  return `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}

export function timeAgo(iso?: string): string {
  if (!iso) return 'jamais';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return fmtDate(iso);
}

const regionNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['fr'], { type: 'region' }) : null;

export function countryName(code: string): string {
  if (!code || code === '??') return 'Inconnu';
  try {
    return regionNames?.of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
}

export function countryFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '🌐';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function downloadCsv(filename: string, rows: (string | number | undefined)[][]) {
  const esc = (v: string | number | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '\ufeff' + rows.map((r) => r.map(esc).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function submissionTitle(payload: Record<string, unknown>): string {
  const p = payload as Record<string, string | undefined>;
  return p.nomPrenom || p.name || p.nom || p.entreprise || p.email || 'Sans nom';
}

export function submissionExcerpt(payload: Record<string, unknown>): string {
  const p = payload as Record<string, string | undefined>;
  return [p.entreprise, p.message || p.subject].filter(Boolean).join(' — ') || p.email || '';
}

export const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super administrateur',
  editor: 'Éditeur',
  seo: 'Référenceur SEO',
  viewer: 'Lecteur',
};
