import React from 'react';
import type { ThemeDefinition } from '../types';
import { UltraAmbient } from './UltraAmbient';
import { UltraFooter } from './UltraFooter';
import { UltraHeader } from './UltraHeader';
import { UltraPageSkeleton } from './UltraPageSkeleton';
import { useUltraEffects } from './useUltraEffects';
import './ultra.css';

export const pexenUltraTheme: ThemeDefinition = {
  id: 'pexen-ultra',
  PageSkeleton: UltraPageSkeleton,
  Shell: ({ currentPath, onNavigate, onOpenCookies, children }) => {
    useUltraEffects(currentPath);
    const isHome = currentPath === '/';

    return (
      <div className="px-ultra-root min-h-screen d-flex flex-column">
        <UltraAmbient />
        <UltraHeader currentPath={currentPath} onNavigate={onNavigate} />
        <main className={`flex-grow-1 ${isHome ? '' : 'px-ultra-main--sub'}`}>{children}</main>
        <UltraFooter onNavigate={onNavigate} onOpenCookies={onOpenCookies} />
      </div>
    );
  },
};
