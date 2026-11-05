/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
/** Catalogue des permissions et rôles : partagé par le serveur et l'administration (aucune dépendance Node). */

export const PERMISSION_GROUPS = [
  {
    id: 'content',
    label: 'Contenu',
    permissions: [
      { key: 'pages.edit', label: 'Créer et modifier les pages', description: 'Brouillons, blocs, médias et métadonnées des pages.' },
      { key: 'pages.publish', label: 'Publier les pages', description: 'Mettre en ligne, planifier, dépublier et modifier une page déjà en ligne.' },
      { key: 'pages.delete', label: 'Supprimer des pages' },
      { key: 'posts.edit', label: 'Rédiger des articles' },
      { key: 'posts.publish', label: 'Publier les articles', description: 'Mettre en ligne, planifier et modifier un article déjà publié.' },
      { key: 'posts.delete', label: 'Supprimer des articles' },
      { key: 'media.upload', label: 'Importer et modifier des médias' },
      { key: 'media.delete', label: 'Supprimer des médias' },
      { key: 'menus.edit', label: 'Modifier les menus' },
    ],
  },
  {
    id: 'contacts',
    label: 'Contacts',
    permissions: [
      { key: 'forms.view', label: 'Lire les messages reçus', description: 'Accès aux données personnelles envoyées par les formulaires.' },
      { key: 'forms.manage', label: 'Configurer les formulaires et supprimer des messages' },
      { key: 'newsletter.manage', label: 'Gérer la newsletter et ses abonnés' },
      { key: 'engagement.edit', label: 'Modifier les boutons flottants' },
    ],
  },
  {
    id: 'appearance',
    label: 'Apparence',
    permissions: [
      { key: 'appearance.customize', label: 'Personnaliser l’identité visuelle' },
      { key: 'appearance.themes', label: 'Installer et activer les thèmes du site' },
    ],
  },
  {
    id: 'seo',
    label: 'Référencement et audience',
    permissions: [
      { key: 'seo.edit', label: 'Modifier le référencement', description: 'Métadonnées, redirections, réglages SEO et Google Search Console.' },
      { key: 'analytics.view', label: 'Consulter les statistiques de visite' },
    ],
  },
  {
    id: 'site',
    label: 'Site',
    permissions: [
      { key: 'site.general', label: 'Modifier les informations de l’entreprise' },
      { key: 'site.maintenance', label: 'Activer le mode maintenance' },
      { key: 'settings.manage', label: 'Modifier les paramètres avancés', description: 'E-mails, sécurité, limites, médias, rétention des données.' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    permissions: [
      { key: 'users.view', label: 'Voir les utilisateurs' },
      { key: 'users.manage', label: 'Gérer les utilisateurs', description: 'Inviter, modifier, suspendre et supprimer des comptes, dans la limite de ses propres droits.' },
      { key: 'audit.view', label: 'Consulter le journal d’activité' },
    ],
  },
] as const;

type Group = (typeof PERMISSION_GROUPS)[number];
export type Permission = Group['permissions'][number]['key'];

export const ALL_PERMISSIONS: Permission[] = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key as Permission));

export const isPermission = (v: unknown): v is Permission => typeof v === 'string' && (ALL_PERMISSIONS as string[]).includes(v);

export type RoleTone = 'brand' | 'info' | 'warning' | 'success' | 'danger' | 'neutral';

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  tone: RoleTone;
  permissions: Permission[];
  /** Rôles fournis par Pexen : non supprimables. */
  builtin?: boolean;
}

/** Le super administrateur a tous les droits, y compris la gestion des rôles ; il n'est pas modifiable. */
export const SUPERADMIN_ROLE = 'superadmin';

export function createDefaultRoles(): RoleDefinition[] {
  return [
    {
      id: SUPERADMIN_ROLE,
      name: 'Super administrateur',
      description: 'Accès complet, y compris les rôles, les paramètres avancés et la sécurité.',
      tone: 'brand',
      permissions: [...ALL_PERMISSIONS],
      builtin: true,
    },
    {
      id: 'editor',
      name: 'Éditeur',
      description: 'Gère le contenu, les menus, les médias, les contacts et l’apparence.',
      tone: 'info',
      builtin: true,
      permissions: [
        'pages.edit', 'pages.publish', 'posts.edit', 'posts.publish', 'posts.delete', 'media.upload', 'media.delete', 'menus.edit',
        'forms.view', 'forms.manage', 'newsletter.manage', 'engagement.edit', 'appearance.customize',
        'seo.edit', 'analytics.view', 'site.general',
      ],
    },
    {
      id: 'contributor',
      name: 'Contributeur',
      description: 'Rédige pages et articles en brouillon ; un éditeur les relit et les publie.',
      tone: 'success',
      permissions: ['pages.edit', 'posts.edit', 'media.upload'],
    },
    {
      id: 'seo',
      name: 'Référenceur SEO',
      description: 'Modifie le référencement des pages et articles et suit l’audience.',
      tone: 'warning',
      builtin: true,
      permissions: ['seo.edit', 'analytics.view'],
    },
    {
      id: 'viewer',
      name: 'Lecteur',
      description: 'Consultation seule du contenu, des statistiques et des messages.',
      tone: 'neutral',
      builtin: true,
      permissions: ['analytics.view', 'forms.view'],
    },
  ];
}

export function rolePermissions(roles: RoleDefinition[], roleId: string): Permission[] {
  if (roleId === SUPERADMIN_ROLE) return [...ALL_PERMISSIONS];
  return roles.find((r) => r.id === roleId)?.permissions ?? [];
}
