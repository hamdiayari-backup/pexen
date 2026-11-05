/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
/** Purge quotidienne selon les durées de conservation des paramètres « Données ». */
import { pruneAnalytics } from '../cms/analyticsStore';
import { loadSnapshot, updateSnapshot } from '../cms/store';
import { purgeMailLog } from '../mail';
import { purgeAudit } from './audit';
import { purgeAuthTokens } from './authTokens';
import { purgeSessions } from './sessions';

export interface RetentionReport {
  analytics: number;
  submissions: number;
  audit: number;
  mailLog: number;
  sessions: number;
  tokens: number;
}

export async function runRetention(): Promise<RetentionReport> {
  const { privacy } = (await loadSnapshot()).system;
  let submissions = 0;
  if (privacy.submissionsRetentionDays > 0) {
    const limit = Date.now() - privacy.submissionsRetentionDays * 86400_000;
    const s = await loadSnapshot();
    if (s.formSubmissions.some((x) => new Date(x.createdAt).getTime() < limit)) {
      await updateSnapshot((snap) => {
        const before = snap.formSubmissions.length;
        snap.formSubmissions = snap.formSubmissions.filter((x) => new Date(x.createdAt).getTime() >= limit);
        submissions = before - snap.formSubmissions.length;
      });
    }
  }
  const [analytics, audit, mailLog, sessions, tokens] = await Promise.all([
    pruneAnalytics(),
    purgeAudit(privacy.auditRetentionDays),
    purgeMailLog(privacy.mailLogRetentionDays),
    purgeSessions(),
    purgeAuthTokens(),
  ]);
  return { analytics, submissions, audit, mailLog, sessions, tokens };
}
