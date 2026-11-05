/**
 * Snapify
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import type { AuditEntry } from './api';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

const LABELS: Record<string, [string, Tone?]> = {
  'auth.login': ['Connexion', 'success'],
  'auth.logout': ['Déconnexion'],
  'auth.login_failed': ['Échec de connexion', 'danger'],
  'auth.login_blocked': ['Connexion refusée (compte suspendu)', 'danger'],
  'auth.2fa_failed': ['Code 2FA erroné', 'danger'],
  'auth.reset_requested': ['Mot de passe oublié demandé', 'warning'],
  'auth.password_reset': ['Mot de passe réinitialisé', 'warning'],
  'auth.invite_accepted': ['Invitation acceptée', 'success'],
  'profile.update': ['Profil modifié'],
  'profile.password': ['Mot de passe changé', 'warning'],
  'profile.2fa_enabled': ['Double authentification activée', 'success'],
  'profile.2fa_disabled': ['Double authentification désactivée', 'danger'],
  'profile.recovery_codes': ['Codes de secours régénérés', 'warning'],
  'profile.session_revoked': ['Session fermée'],
  'profile.sessions_revoked': ['Autres sessions fermées'],
  'user.create': ['Compte créé', 'info'],
  'user.invite': ['Utilisateur invité', 'info'],
  'user.invite_resent': ['Invitation renvoyée', 'info'],
  'user.update': ['Compte modifié'],
  'user.role': ['Rôle modifié', 'warning'],
  'user.password': ['Mot de passe défini par un administrateur', 'warning'],
  'user.reset_link': ['Lien de réinitialisation envoyé', 'warning'],
  'user.2fa_reset': ['2FA réinitialisée', 'danger'],
  'user.suspend': ['Compte suspendu', 'danger'],
  'user.reactivate': ['Compte réactivé', 'success'],
  'user.sessions_revoked': ['Sessions fermées par un administrateur', 'warning'],
  'user.delete': ['Compte supprimé', 'danger'],
  'role.create': ['Rôle créé', 'info'],
  'role.update': ['Rôle modifié', 'warning'],
  'role.reset': ['Rôle réinitialisé', 'warning'],
  'role.delete': ['Rôle supprimé', 'danger'],
  'settings.system': ['Paramètres avancés modifiés', 'warning'],
  'settings.smtp_test': ['Test d’envoi d’e-mail'],
  'settings.retention_run': ['Purge des données', 'warning'],
  'settings.site': ['Paramètres du site modifiés'],
  'settings.general': ['Informations de l’entreprise modifiées'],
  'site.maintenance': ['Mode maintenance modifié', 'warning'],
  'appearance.branding': ['Identité visuelle modifiée'],
  'page.create': ['Page créée', 'info'],
  'page.update': ['Page modifiée'],
  'page.delete': ['Page supprimée', 'danger'],
  'page.restore': ['Révision de page restaurée', 'warning'],
  'post.create': ['Article créé', 'info'],
  'post.update': ['Article modifié'],
  'post.delete': ['Article supprimé', 'danger'],
  'post.restore': ['Révision d’article restaurée', 'warning'],
  'media.upload': ['Média importé', 'info'],
  'media.update': ['Média modifié'],
  'media.delete': ['Média supprimé', 'danger'],
  'menu.update': ['Menu modifié'],
  'form.update': ['Formulaire modifié'],
  'submission.delete': ['Message supprimé', 'danger'],
  'subscriber.update': ['Abonné modifié'],
  'subscriber.delete': ['Abonné supprimé', 'danger'],
  'newsletter.settings': ['Newsletter configurée'],
  'engagement.update': ['Boutons flottants modifiés'],
  'seo.settings': ['Réglages SEO modifiés'],
  'seo.redirects': ['Redirections modifiées'],
  'seo.google': ['Google Search Console configurée'],
  'seo.google_disconnect': ['Google déconnecté', 'warning'],
  'seo.google_connect': ['Compte Google connecté', 'success'],
  'seo.google_credentials': ['Identifiants OAuth Google enregistrés'],
  'seo.google_credentials_delete': ['Identifiants OAuth Google supprimés', 'warning'],
  'performance.run': ['Analyse PageSpeed lancée', 'info'],
  'module.upload': ['Paquet de module envoyé', 'info'],
  'module.install': ['Extension installée', 'info'],
  'module.settings': ['Réglages de module modifiés'],
  'module.data': ['Données de module modifiées (produits, commandes…)'],
  'module.toggle': ['Module activé / désactivé', 'warning'],
  'module.license': ['Licence de module modifiée'],
  'module.delete': ['Module supprimé', 'danger'],
  'marketplace.download': ['Téléchargement depuis la marketplace', 'info'],
  'theme.install': ['Thème installé', 'info'],
  'theme.activate': ['Thème activé', 'warning'],
  'theme.customize': ['Thème personnalisé'],
  'theme.delete': ['Thème supprimé', 'danger'],
};

export const AUDIT_CATEGORIES: { value: string; label: string }[] = [
  { value: '', label: 'Toutes les actions' },
  { value: 'auth.', label: 'Connexions' },
  { value: 'auth.login_failed', label: 'Échecs de connexion' },
  { value: 'profile.', label: 'Profils et sécurité' },
  { value: 'user.', label: 'Gestion des utilisateurs' },
  { value: 'role.', label: 'Rôles' },
  { value: 'settings.', label: 'Paramètres' },
  { value: 'page.', label: 'Pages' },
  { value: 'post.', label: 'Articles' },
  { value: 'media.', label: 'Médias' },
  { value: 'module.', label: 'Modules' },
  { value: 'theme.', label: 'Thèmes' },
  { value: 'seo.', label: 'Référencement' },
  { value: 'performance.', label: 'Performance' },
];

export function auditLabel(action: string): { label: string; tone: Tone } {
  const [label, tone] = LABELS[action] ?? [action, 'neutral'];
  return { label, tone: tone ?? 'neutral' };
}

const SECTION_LABELS: Record<string, string> = {
  smtp: 'e-mails',
  notifications: 'notifications',
  security: 'sécurité',
  limits: 'limites',
  uploads: 'médias',
  privacy: 'données',
  performance: 'performance',
};

/** Résumé lisible des détails d'une entrée (rôles traduits via `roleName`). */
export function auditDetail(e: AuditEntry, roleName: (id: string) => string = (id) => id): string {
  const d = e.detail ?? {};
  const parts: string[] = [];
  const role = d.role as { from?: string; to?: string } | string | undefined;
  if (role && typeof role === 'object') parts.push(`${roleName(role.from ?? '')} → ${roleName(role.to ?? '')}`);
  else if (typeof role === 'string') parts.push(`rôle : ${roleName(role)}`);
  const email = d.email as { from?: string; to?: string } | undefined;
  if (email && typeof email === 'object') parts.push(`${email.from} → ${email.to}`);
  if (Array.isArray(d.sections)) parts.push((d.sections as string[]).map((s) => SECTION_LABELS[s] ?? s).join(', '));
  if (Array.isArray(d.added) && d.added.length) parts.push(`+${d.added.length} droit(s)`);
  if (Array.isArray(d.removed) && d.removed.length) parts.push(`−${d.removed.length} droit(s)`);
  if (typeof d.closedSessions === 'number' && d.closedSessions) parts.push(`${d.closedSessions} session(s) fermée(s)`);
  if (typeof d.count === 'number') parts.push(`${d.count} session(s)`);
  if (typeof d.reassigned === 'number' && d.reassigned) parts.push(`${d.reassigned} compte(s) réaffecté(s)`);
  if (d.twoFactor) parts.push('avec 2FA');
  if (d.recoveryCode) parts.push('code de secours');
  if (d.remember) parts.push('rester connecté');
  if (d.emailSent === false) parts.push('e-mail non envoyé');
  if (d.ok === false) parts.push('échec');
  return parts.join(' · ');
}
