import React from 'react';
import type { BlockDataMap, BlockKind, BlockStyle } from '../../../server/cms/blocks';
import { resolveStyle } from '../../../server/cms/blocks';
import { BLOCK_CATALOG, isBlockKind, withDefaults } from '../../../server/cms/blockCatalog';
import type { CmsBlock } from '../../../server/cms/types';
import { IS_PREVIEW, notifyEditor } from '../../preview';
import { CmsProvider } from './kit';
import { HeroBlock, MarqueeBlock, PageHeaderBlock } from './blocks/HeaderBlocks';
import { DetailsBlock, HtmlBlock, ImageBlock, RichTextBlock, SlidesBlock, SpacerBlock, TableBlock, TextMediaBlock, VideoBlock } from './blocks/ContentBlocks';
import { CardsBlock, ChecklistBlock, FaqBlock, GalleryBlock, PanelsBlock, ShowcaseBlock, StatsBlock, StepsBlock, TestimonialsBlock } from './blocks/CollectionBlocks';
import { ContactFormBlock, CtaBlock, ProjectsBlock, SimulatorBlock } from './blocks/ConversionBlocks';

type Renderer<K extends BlockKind> = React.ComponentType<{ d: BlockDataMap[K]; style: BlockStyle }>;

const RENDERERS: { [K in BlockKind]: Renderer<K> } = {
  hero: HeroBlock,
  pageHeader: PageHeaderBlock,
  richText: RichTextBlock,
  textMedia: TextMediaBlock,
  image: ImageBlock,
  video: VideoBlock,
  slides: SlidesBlock,
  cards: CardsBlock,
  showcase: ShowcaseBlock,
  steps: StepsBlock,
  stats: StatsBlock,
  cta: CtaBlock,
  panels: PanelsBlock,
  gallery: GalleryBlock,
  checklist: ChecklistBlock,
  faq: FaqBlock,
  marquee: MarqueeBlock,
  projects: ProjectsBlock,
  table: TableBlock,
  simulator: SimulatorBlock,
  contactForm: ContactFormBlock,
  details: DetailsBlock,
  testimonials: TestimonialsBlock,
  spacer: SpacerBlock,
  html: HtmlBlock,
};

class BlockBoundary extends React.Component<{ label: string; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error(`[cms] bloc « ${this.props.label} » :`, error);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return IS_PREVIEW ? <div className="mx-auto my-6 max-w-3xl rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Le bloc « {this.props.label} » ne peut pas s'afficher : vérifiez ses champs.</div> : null;
  }
}

function Block({ block }: { block: CmsBlock }) {
  if (!isBlockKind(block.type)) return null;
  const meta = BLOCK_CATALOG[block.type];
  const Comp = RENDERERS[block.type] as Renderer<BlockKind>;
  let style = resolveStyle(block.style, meta.style);
  if (style.hideOnMobile && style.hideOnDesktop) {
    // Bloc masqué partout : absent du site, mais visible (atténué) dans l'aperçu pour rester sélectionnable.
    if (!IS_PREVIEW) return null;
    style = { ...style, hideOnMobile: false, hideOnDesktop: false };
  }
  return (
    <BlockBoundary label={meta.label}>
      <Comp d={withDefaults(block.type, block.data)} style={style} />
    </BlockBoundary>
  );
}

export function BlockRenderer({ blocks, onNavigate, selectedId }: { blocks: CmsBlock[]; onNavigate: (path: string) => void; selectedId?: string | null }) {
  return (
    <CmsProvider onNavigate={onNavigate}>
      <div className="cms-blocks">
        {blocks.map((block) =>
          IS_PREVIEW ? (
            <div
              key={block.id}
              id={`px-block-${block.id}`}
              className="px-preview-block"
              data-selected={selectedId === block.id}
              data-hidden={!!(block.style?.hideOnMobile && block.style?.hideOnDesktop)}
              onClickCapture={(e) => {
                e.preventDefault();
                notifyEditor({ type: 'pexen:block-click', id: block.id });
              }}
            >
              <span className="px-preview-label">
                {isBlockKind(block.type) ? BLOCK_CATALOG[block.type].label : block.type}
                {block.style?.hideOnMobile && block.style?.hideOnDesktop ? ' · masqué' : ''}
              </span>
              <Block block={block} />
            </div>
          ) : (
            <Block key={block.id} block={block} />
          )
        )}
      </div>
    </CmsProvider>
  );
}
