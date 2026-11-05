import React from 'react';
import type { BlockDataMap, BlockKind, BlockStyle } from '../../../server/cms/blocks';
import { resolveStyle } from '../../../server/cms/blocks';
import { BLOCK_CATALOG, isBlockKind, withDefaults } from '../../../server/cms/blockCatalog';
import type { CmsBlock } from '../../../server/cms/types';
import { IS_PREVIEW, notifyEditor } from '../../preview';
import { useTheme } from '../../themes/ThemeProvider';
import {
  UltraCmsCards,
  UltraCmsChecklist,
  UltraCmsContact,
  UltraCmsFaq,
  UltraCmsGallery,
  UltraCmsHero,
  UltraCmsMarquee,
  UltraCmsPageHeader,
  UltraCmsPanels,
  UltraCmsProjects,
  UltraCmsRichText,
  UltraCmsSimulator,
  UltraCmsStats,
  UltraCmsSteps,
  UltraCmsTextMedia,
} from '../../themes/pexen-ultra/UltraCmsBlocks';
import {
  MaquetteCmsCards,
  MaquetteCmsChecklist,
  MaquetteCmsContact,
  MaquetteCmsFaq,
  MaquetteCmsGallery,
  MaquetteCmsHero,
  MaquetteCmsMarquee,
  MaquetteCmsPageHeader,
  MaquetteCmsPanels,
  MaquetteCmsProjects,
  MaquetteCmsSimulator,
  MaquetteCmsStats,
  MaquetteCmsSteps,
  MaquetteCmsTextMedia,
} from '../../themes/pexen-maquette/MaquetteCmsBlocks';
import { CmsProvider, isDarkStyle } from './kit';
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

/** Habillage Ultra branché sur les données CMS (éditeur de page / aperçu). */
const ULTRA_RENDERERS: Partial<{ [K in BlockKind]: Renderer<K> }> = {
  hero: UltraCmsHero as Renderer<'hero'>,
  pageHeader: UltraCmsPageHeader as Renderer<'pageHeader'>,
  richText: UltraCmsRichText as Renderer<'richText'>,
  textMedia: UltraCmsTextMedia as Renderer<'textMedia'>,
  cards: UltraCmsCards as Renderer<'cards'>,
  steps: UltraCmsSteps as Renderer<'steps'>,
  projects: UltraCmsProjects as Renderer<'projects'>,
  faq: UltraCmsFaq as Renderer<'faq'>,
  contactForm: UltraCmsContact as Renderer<'contactForm'>,
  simulator: UltraCmsSimulator as Renderer<'simulator'>,
  marquee: UltraCmsMarquee as Renderer<'marquee'>,
  gallery: UltraCmsGallery as Renderer<'gallery'>,
  stats: UltraCmsStats as Renderer<'stats'>,
  checklist: UltraCmsChecklist as Renderer<'checklist'>,
  panels: UltraCmsPanels as Renderer<'panels'>,
};

/** Habillage Maquette Amina — mêmes blocs CMS, UI fidèle à la proposition. */
const MAQUETTE_RENDERERS: Partial<{ [K in BlockKind]: Renderer<K> }> = {
  hero: MaquetteCmsHero as Renderer<'hero'>,
  pageHeader: MaquetteCmsPageHeader as Renderer<'pageHeader'>,
  textMedia: MaquetteCmsTextMedia as Renderer<'textMedia'>,
  cards: MaquetteCmsCards as Renderer<'cards'>,
  steps: MaquetteCmsSteps as Renderer<'steps'>,
  projects: MaquetteCmsProjects as Renderer<'projects'>,
  faq: MaquetteCmsFaq as Renderer<'faq'>,
  contactForm: MaquetteCmsContact as Renderer<'contactForm'>,
  simulator: MaquetteCmsSimulator as Renderer<'simulator'>,
  marquee: MaquetteCmsMarquee as Renderer<'marquee'>,
  gallery: MaquetteCmsGallery as Renderer<'gallery'>,
  stats: MaquetteCmsStats as Renderer<'stats'>,
  checklist: MaquetteCmsChecklist as Renderer<'checklist'>,
  panels: MaquetteCmsPanels as Renderer<'panels'>,
};

/** Blocs qui ne reçoivent jamais de coupe en biais (hero géré à part, bandeaux fins). */
const NO_CUT = new Set<BlockKind>(['spacer', 'marquee', 'hero', 'html']);

function blockStyle(block: CmsBlock): BlockStyle {
  const meta = isBlockKind(block.type) ? BLOCK_CATALOG[block.type] : undefined;
  return resolveStyle(block.style, meta?.style);
}

/** Coupe en biais uniquement quand le ton change (clair ↔ sombre / photo). */
function cutBetween(prev: CmsBlock, next: CmsBlock): boolean {
  if (!isBlockKind(next.type) || NO_CUT.has(next.type)) return false;
  if (!isBlockKind(prev.type) || prev.type === 'spacer' || prev.type === 'marquee') return false;
  const a = blockStyle(prev);
  const b = blockStyle(next);
  if (isDarkStyle(a) !== isDarkStyle(b)) return true;
  const media = (s: BlockStyle) => s.background === 'image' || s.background === 'video';
  return (media(a) || media(b)) && a.background !== b.background;
}

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
    return IS_PREVIEW ? (
      <div className="mx-auto my-6 max-w-3xl rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Le bloc « {this.props.label} » ne peut pas s'afficher : vérifiez ses champs.
      </div>
    ) : null;
  }
}

function Block({ block }: { block: CmsBlock }) {
  const theme = useTheme();
  if (!isBlockKind(block.type)) return null;
  const meta = BLOCK_CATALOG[block.type];
  const themed =
    theme.id === 'pexen-ultra'
      ? ULTRA_RENDERERS[block.type]
      : theme.id === 'pexen-maquette'
        ? MAQUETTE_RENDERERS[block.type]
        : undefined;
  const Comp = (themed || RENDERERS[block.type]) as Renderer<BlockKind>;
  let style = resolveStyle(block.style, meta.style);
  if (style.hideOnMobile && style.hideOnDesktop) {
    if (!IS_PREVIEW) return null;
    style = { ...style, hideOnMobile: false, hideOnDesktop: false };
  }
  return (
    <BlockBoundary label={meta.label}>
      <div
        className="px-block-typo"
        data-text-align={style.textAlign || (block.type === 'hero' ? 'left' : 'center')}
        data-title-size={style.titleSize || 'md'}
        data-body-size={style.bodySize || 'md'}
      >
        <Comp d={withDefaults(block.type, block.data)} style={style} />
      </div>
    </BlockBoundary>
  );
}

function PreviewShell({ block, selectedId, children }: { block: CmsBlock; selectedId?: string | null; children: React.ReactNode }) {
  return (
    <div
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
      {children}
    </div>
  );
}

export function BlockRenderer({ blocks, onNavigate, selectedId }: { blocks: CmsBlock[]; onNavigate: (path: string) => void; selectedId?: string | null }) {
  return (
    <CmsProvider onNavigate={onNavigate}>
      <div className="cms-blocks">
        {blocks.map((block, i) => {
          const prev = i > 0 ? blocks[i - 1] : null;
          const content =
            prev && cutBetween(prev, block) ? (
              <div className="px-cut">
                <Block block={block} />
              </div>
            ) : (
              <Block block={block} />
            );
          return (
            <React.Fragment key={block.id}>
              {IS_PREVIEW ? (
                <PreviewShell block={block} selectedId={selectedId}>
                  {content}
                </PreviewShell>
              ) : (
                content
              )}
            </React.Fragment>
          );
        })}
      </div>
    </CmsProvider>
  );
}
