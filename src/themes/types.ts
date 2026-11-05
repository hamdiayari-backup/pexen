import type { ComponentType } from 'react';
import type { BlockKind } from '../../server/cms/blocks';
import type { ThemeId } from '../../server/cms/types';

export interface ThemeShellProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenCookies: () => void;
  children: React.ReactNode;
}

export interface ThemePageSkeletonProps {
  path: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  Shell: ComponentType<ThemeShellProps>;
  /** Skeleton de chargement des pages internes (hors accueil). */
  PageSkeleton?: ComponentType<ThemePageSkeletonProps>;
  blockOverrides?: Partial<Record<BlockKind, ComponentType<{ d: unknown; style: unknown }>>>;
}
