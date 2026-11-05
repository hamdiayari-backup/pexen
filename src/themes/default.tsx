import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import type { ThemeDefinition } from './types';

export const defaultTheme: ThemeDefinition = {
  id: 'default',
  Shell: ({ currentPath, onNavigate, onOpenCookies, children }) => (
    <div className="min-h-screen flex flex-col bg-px-surface text-px-navy">
      <Header currentPath={currentPath} onNavigate={onNavigate} />
      <main className="flex-1">{children}</main>
      <Footer onNavigate={onNavigate} onOpenCookies={onOpenCookies} />
    </div>
  ),
};
