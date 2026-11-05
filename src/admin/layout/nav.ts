import {
  BarChart3,
  Bot,
  FileText,
  Gauge,
  Globe2,
  Image,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  Mail,
  Menu,
  MessageCircle,
  Newspaper,
  Palette,
  Search,
  Settings,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '../../../server/cms/permissions';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Au moins une de ces permissions ; absent = toute personne connectée. */
  perms?: Permission[];
  keywords?: string;
}

export const NAV: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, keywords: 'accueil dashboard' },
      { to: '/analytics', label: 'Statistiques', icon: BarChart3, perms: ['analytics.view'], keywords: 'visites audience pays trafic' },
    ],
  },
  {
    title: 'Contenu',
    items: [
      { to: '/pages', label: 'Pages', icon: FileText, keywords: 'contenu hero éditeur' },
      { to: '/posts', label: 'Articles', icon: Newspaper, keywords: 'blog actualités' },
      { to: '/media', label: 'Médiathèque', icon: Image, keywords: 'images vidéos fichiers upload' },
      { to: '/menus', label: 'Menus', icon: Menu, perms: ['menus.edit'], keywords: 'navigation mobile footer' },
    ],
  },
  {
    title: 'Contacts',
    items: [
      { to: '/forms', label: 'Formulaires', icon: Inbox, perms: ['forms.view', 'forms.manage'], keywords: 'messages demandes contact' },
      { to: '/newsletter', label: 'Newsletter', icon: Mail, perms: ['newsletter.manage'], keywords: 'abonnés inscrits' },
      { to: '/engagement', label: 'WhatsApp & boutons', icon: MessageCircle, perms: ['engagement.edit'], keywords: 'whatsapp cta flottant' },
      { to: '/ai', label: 'Assistant IA', icon: Bot, perms: ['settings.manage'], keywords: 'gemini chatbot limites' },
    ],
  },
  {
    title: 'Référencement',
    items: [
      { to: '/seo', label: 'SEO', icon: Search, perms: ['seo.edit'], keywords: 'google search console redirections sitemap robots yoast' },
      {
        to: '/performance',
        label: 'Performance',
        icon: Gauge,
        perms: ['seo.edit', 'analytics.view'],
        keywords: 'pagespeed lighthouse vitesse core web vitals score',
      },
    ],
  },
  {
    title: 'Site',
    items: [
      { to: '/themes', label: 'Thèmes', icon: LayoutTemplate, perms: ['appearance.themes', 'appearance.customize'], keywords: 'theme ultra bizen multipage installer activer' },
      { to: '/branding', label: 'Identité visuelle', icon: Palette, perms: ['appearance.customize'], keywords: 'logo couleurs polices favicon' },
      { to: '/general', label: 'Informations', icon: Globe2, perms: ['site.general'], keywords: 'téléphone adresse email société' },
      { to: '/maintenance', label: 'Maintenance', icon: ShieldAlert, perms: ['site.maintenance', 'settings.manage'], keywords: 'mode maintenance hors ligne' },
      { to: '/settings', label: 'Paramètres', icon: Settings, perms: ['settings.manage'], keywords: 'cookies url analytics smtp e-mail sécurité limites quotas rétention 2fa' },
      { to: '/users', label: 'Utilisateurs', icon: Users, perms: ['users.view', 'audit.view'], keywords: 'comptes rôles accès permissions invitations journal activité' },
    ],
  },
];

export const ALL_NAV = NAV.flatMap((g) => g.items);
