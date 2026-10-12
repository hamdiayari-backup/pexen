import React, { useEffect } from 'react';
import type { CmsPage } from '../../server/cms/types';
import { BlockRenderer } from '../components/cms/BlockRenderer';

export function CmsPageView({
  page,
  onNavigate,
  selectedBlockId,
  scrollToBlockId,
  scrollNonce,
}: {
  page: CmsPage;
  onNavigate: (path: string) => void;
  selectedBlockId?: string | null;
  scrollToBlockId?: string | null;
  scrollNonce?: number;
}) {
  useEffect(() => {
    if (!scrollToBlockId) return;
    const el = document.getElementById(`px-block-${scrollToBlockId}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  }, [scrollToBlockId, scrollNonce]);

  return (
    <div className="bg-white">
      <BlockRenderer blocks={page.blocks} onNavigate={onNavigate} selectedId={selectedBlockId} />
    </div>
  );
}
