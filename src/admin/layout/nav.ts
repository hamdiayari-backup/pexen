import {
  BarChart3,
  Bot,
  FileText,
  Globe2,
  Image,
  Inbox,
  LayoutDashboard,
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
import type { AdminUser } from '../../../server/cms/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: AdminUser['role'][];
  keywords?: string;
}

export const NAV: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, keywords: 'accueil dashboard' },
      { to: '/analytics', label: 'Statistiques', icon: BarChart3, keywords: 'visites audience pays trafic' },
    ],
  },
  {
    title: 'Contenu',
    items: [
      { to: '/pages', label: 'Pages', icon: FileText, keywords: 'contenu hero éditeur' },
      { to: '/posts', label: 'Articles', icon: Newspaper, keywords: 'blog actualités' },
      { to: '/media', label: 'Médiathèque', icon: Image, keywords: 'images vidéos fichiers upload' },
      { to: '/menus', label: 'Menus', icon: Menu, roles: ['editor'], keywords: 'navigation mobile footer' },
    ],
  },
  {
    title: 'Contacts',
    items: [
      { to: '/forms', label: 'Formulaires', icon: Inbox, keywords: 'messages demandes contact' },
      { to: '/newsletter', label: 'Newsletter', icon: Mail, roles: ['editor'], keywords: 'abonnés inscrits' },
      { to: '/engagement', label: 'WhatsApp & boutons', icon: MessageCircle, roles: ['editor'], keywords: 'whatsapp cta flottant' },
      { to: '/ai', label: 'Assistant IA', icon: Bot, roles: [], keywords: 'gemini chatbot limites' },
    ],
  },
  {
    title: 'Référencement',
    items: [{ to: '/seo', label: 'SEO', icon: Search, roles: ['editor', 'seo'], keywords: 'google search console redirections sitemap robots yoast' }],
  },
  {
    title: 'Site',
    items: [
      { to: '/branding', label: 'Identité visuelle', icon: Palette, roles: ['editor'], keywords: 'logo couleurs polices favicon' },
      { to: '/general', label: 'Informations', icon: Globe2, roles: ['editor'], keywords: 'téléphone adresse email société' },
      { to: '/maintenance', label: 'Maintenance', icon: ShieldAlert, roles: [], keywords: 'mode maintenance hors ligne' },
      { to: '/settings', label: 'Paramètres', icon: Settings, roles: [], keywords: 'cookies url analytics' },
      { to: '/users', label: 'Utilisateurs', icon: Users, roles: [], keywords: 'comptes rôles accès' },
    ],
  },
];

export const ALL_NAV = NAV.flatMap((g) => g.items);
