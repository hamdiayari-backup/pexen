import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Globe, Monitor, Search, Share2, Smartphone, SlidersHorizontal, Sparkles, XCircle } from 'lucide-react';
import type { CmsBlock, SeoMeta } from '../../../server/cms/types';
import { analyzeContent, type SeoCheck } from '../../../server/cms/seoAnalyzer';
import { useDebounced } from '../lib/hooks';
import { Badge, Card, cx, Field, Input, ScoreRing, Segmented, Select, Switch, Tabs, Textarea } from '../ui/primitives';
import { ImageField } from '../ui/media';

const TITLE_MAX_PX = 580;
let canvas: HTMLCanvasElement | null = null;
function textWidth(text: string, font = '20px Arial'): number {
  canvas ??= document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  return ctx.measureText(text).width;
}
function truncatePx(text: string, maxPx: number, font?: string): string {
  if (textWidth(text, font) <= maxPx) return text;
  let t = text;
  while (t.length && textWidth(`${t}…`, font) > maxPx) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

function highlight(text: string, kp: string) {
  if (!kp.trim()) return text;
  const words = kp.trim().split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${words.join('|')})`, 'gi');
  return text.split(re).map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

export function SerpPreview({ seo, url, siteName, device }: { seo: SeoMeta; url: string; siteName: string; device: 'desktop' | 'mobile' }) {
  const title = truncatePx(seo.seoTitle || 'Titre de la page', device === 'desktop' ? TITLE_MAX_PX : 360, device === 'desktop' ? '20px Arial' : '18px Arial');
  const desc = seo.metaDescription || 'Ajoutez une meta description pour contrôler le texte affiché par Google sous votre titre.';
  const maxDesc = device === 'desktop' ? 158 : 120;
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();
  const crumbs = (() => {
    try {
      return new URL(url).pathname.split('/').filter(Boolean).join(' › ');
    } catch {
      return '';
    }
  })();
  return (
    <div className={cx('rounded-xl border border-slate-200 bg-white p-4 font-[Arial,sans-serif]', device === 'mobile' && 'mx-auto max-w-[380px]')}>
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[10px] font-bold text-brand-700">
          {siteName.slice(0, 1)}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm text-[#202124]">{siteName}</p>
          <p className="truncate text-xs text-[#4d5156]">
            {host}
            {crumbs ? ` › ${crumbs}` : ''}
          </p>
        </div>
      </div>
      <p className={cx('mt-2 leading-snug text-[#1a0dab] hover:underline', device === 'desktop' ? 'text-xl' : 'text-lg')}>{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-[#4d5156]">
        {highlight(desc.length > maxDesc ? `${desc.slice(0, maxDesc).trimEnd()}…` : desc, seo.focusKeyphrase)}
      </p>
    </div>
  );
}

function SocialPreview({ seo, url, fallbackImage }: { seo: SeoMeta; url: string; fallbackImage?: string }) {
  const img = seo.ogImage || fallbackImage;
  const host = (() => {
    try {
      return new URL(url).hostname.toUpperCase();
    } catch {
      return '';
    }
  })();
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="aspect-[1.91/1] bg-slate-100">
        {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-slate-400">Aucune image de partage</div>}
      </div>
      <div className="border-t border-slate-200 bg-[#f0f2f5] px-3 py-2.5">
        <p className="text-[11px] text-slate-500">{host}</p>
        <p className="truncate text-[15px] font-semibold text-slate-900">{seo.ogTitle || seo.seoTitle}</p>
        <p className="line-clamp-1 text-sm text-slate-500">{seo.ogDescription || seo.metaDescription}</p>
      </div>
    </div>
  );
}

function CheckList({ checks }: { checks: SeoCheck[] }) {
  const groups: { key: SeoCheck['status']; label: string; icon: React.ElementType; cls: string }[] = [
    { key: 'fail', label: 'Problèmes', icon: XCircle, cls: 'text-rose-500' },
    { key: 'warn', label: 'Améliorations', icon: Circle, cls: 'text-amber-500' },
    { key: 'pass', label: 'Bons résultats', icon: CheckCircle2, cls: 'text-emerald-500' },
  ];
  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const items = checks.filter((c) => c.status === g.key);
        if (!items.length) return null;
        return (
          <div key={g.key}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {g.label} ({items.length})
            </p>
            <ul className="space-y-2">
              {items.map((c) => (
                <li key={c.id} className="flex gap-2.5 text-[13px] leading-snug">
                  <g.icon className={cx('mt-0.5 h-4 w-4 shrink-0', g.cls)} />
                  <span>
                    <span className="text-slate-800">{c.label}</span>
                    {c.hint ? <span className="block text-slate-500">{c.hint}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function SeoPanel({
  seo,
  onChange,
  blocks,
  kind,
  extraText,
  url,
  siteName,
  defaultOgImage,
  slugLocked,
}: {
  seo: SeoMeta;
  onChange: (s: SeoMeta) => void;
  blocks: CmsBlock[];
  kind: 'page' | 'post';
  extraText?: string;
  url: string;
  siteName: string;
  defaultOgImage?: string;
  slugLocked?: boolean;
}) {
  const [tab, setTab] = useState<'general' | 'social' | 'advanced'>('general');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [analysisTab, setAnalysisTab] = useState<'seo' | 'readability'>('seo');
  const set = (p: Partial<SeoMeta>) => onChange({ ...seo, ...p });

  const debounced = useDebounced({ seo, blocks, extraText }, 400);
  const analysis = useMemo(() => analyzeContent(debounced.seo, debounced.blocks, { kind, extraText: debounced.extraText }), [debounced, kind]);
  const titlePx = Math.round(textWidth(seo.seoTitle || ''));

  return (
    <Card padded={false}>
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600" />
          <h2 className="text-[15px] font-semibold text-slate-900">Référencement</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <ScoreRing score={analysis.score} size={36} /> SEO
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <ScoreRing score={analysis.readabilityScore} size={36} /> Lisibilité
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 border-slate-100 p-5 lg:border-r">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'general', label: 'Général', icon: Search },
              { value: 'social', label: 'Réseaux sociaux', icon: Share2 },
              { value: 'advanced', label: 'Avancé', icon: SlidersHorizontal },
            ]}
          />

          {tab === 'general' ? (
            <div className="space-y-5">
              <Field label="Expression clé principale" hint="La requête Google sur laquelle cette page doit se positionner.">
                <Input value={seo.focusKeyphrase} onChange={(e) => set({ focusKeyphrase: e.target.value })} placeholder="ex. haute pression flottante" />
              </Field>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-slate-700">Aperçu Google</span>
                  <Segmented
                    size="sm"
                    value={device}
                    onChange={setDevice}
                    options={[
                      { value: 'desktop', label: 'Ordinateur', icon: Monitor },
                      { value: 'mobile', label: 'Mobile', icon: Smartphone },
                    ]}
                  />
                </div>
                <SerpPreview seo={seo} url={url} siteName={siteName} device={device} />
              </div>

              <Field
                label="Titre SEO"
                counter={{ value: seo.seoTitle.length, min: 30, max: 60 }}
                hint={
                  <span>
                    Largeur affichée : <span className={titlePx > TITLE_MAX_PX ? 'font-medium text-rose-600' : ''}>{titlePx} px</span> / {TITLE_MAX_PX} px
                  </span>
                }
              >
                <Input value={seo.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} />
              </Field>
              <PixelBar value={titlePx} max={TITLE_MAX_PX} />

              <Field label="Meta description" counter={{ value: seo.metaDescription.length, min: 120, max: 160 }}>
                <Textarea value={seo.metaDescription} onChange={(e) => set({ metaDescription: e.target.value })} rows={3} />
              </Field>
              <PixelBar value={seo.metaDescription.length} max={160} min={120} />

              <Field label="Slug" hint={slugLocked ? 'Modifiez l’adresse de la page dans le panneau « Publication ».' : 'Utilisé dans l’URL. Lettres minuscules, chiffres et tirets.'}>
                <Input value={seo.slug} disabled={slugLocked} onChange={(e) => set({ slug: e.target.value })} />
              </Field>
            </div>
          ) : null}

          {tab === 'social' ? (
            <div className="space-y-5">
              <SocialPreview seo={seo} url={url} fallbackImage={defaultOgImage} />
              <Field label="Image de partage" hint="Format recommandé : 1200 × 630 px.">
                <ImageField value={seo.ogImage} onChange={(url) => set({ ogImage: url })} aspect="aspect-[1.91/1]" />
              </Field>
              <Field label="Titre de partage" hint="Laissez vide pour reprendre le titre SEO.">
                <Input value={seo.ogTitle || ''} onChange={(e) => set({ ogTitle: e.target.value })} placeholder={seo.seoTitle} />
              </Field>
              <Field label="Description de partage" hint="Laissez vide pour reprendre la meta description.">
                <Textarea value={seo.ogDescription || ''} onChange={(e) => set({ ogDescription: e.target.value })} rows={2} placeholder={seo.metaDescription} />
              </Field>
              <Field label="Format de carte X (Twitter)">
                <Select
                  value={seo.twitterCard}
                  onChange={(v) => set({ twitterCard: v as SeoMeta['twitterCard'] })}
                  options={[
                    { value: 'summary_large_image', label: 'Grande image' },
                    { value: 'summary', label: 'Résumé (petite image)' },
                  ]}
                />
              </Field>
            </div>
          ) : null}

          {tab === 'advanced' ? (
            <div className="space-y-5">
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
                <div className="py-3">
                  <Switch checked={!seo.noindex} onChange={(v) => set({ noindex: !v })} label="Autoriser l’indexation par Google" description="Désactivé : la page est exclue des résultats de recherche et du sitemap." />
                </div>
                <div className="py-3">
                  <Switch checked={!seo.nofollow} onChange={(v) => set({ nofollow: !v })} label="Suivre les liens de la page" description="Désactivé : les moteurs ne suivent pas les liens présents sur cette page." />
                </div>
              </div>
              <Field label="URL canonique" hint="À renseigner uniquement si ce contenu est dupliqué depuis une autre adresse.">
                <Input value={seo.canonicalUrl || ''} onChange={(e) => set({ canonicalUrl: e.target.value })} placeholder={url} />
              </Field>
              <Field label="Type de données structurées (schema.org)">
                <Select
                  value={seo.schemaType}
                  onChange={(v) => set({ schemaType: v as SeoMeta['schemaType'] })}
                  options={[
                    { value: 'WebPage', label: 'Page web' },
                    { value: 'Article', label: 'Article' },
                    { value: 'Organization', label: 'Organisation' },
                    { value: 'LocalBusiness', label: 'Entreprise locale' },
                  ]}
                />
              </Field>
              <Field label="Titre dans le fil d’Ariane">
                <Input value={seo.breadcrumbsTitle || ''} onChange={(e) => set({ breadcrumbsTitle: e.target.value })} />
              </Field>
            </div>
          ) : null}
        </div>

        <div className="bg-slate-50/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <Segmented
              size="sm"
              value={analysisTab}
              onChange={setAnalysisTab}
              options={[
                { value: 'seo', label: 'Analyse SEO' },
                { value: 'readability', label: 'Lisibilité' },
              ]}
            />
          </div>
          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="Mots" value={analysis.stats.words} />
            <Stat label="Densité" value={`${analysis.stats.density} %`} />
            <Stat label="Liens int." value={analysis.stats.internalLinks} />
          </div>
          {!seo.focusKeyphrase && analysisTab === 'seo' ? (
            <div className="mb-4">
              <Badge tone="warning">Définissez une expression clé pour une analyse complète</Badge>
            </div>
          ) : null}
          <CheckList checks={analysis.checks.filter((c) => c.group === analysisTab)} />
          <p className="mt-6 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Globe className="h-3 w-3" /> Analyse mise à jour en temps réel
          </p>
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2 py-2">
      <p className="text-sm font-semibold tabular-nums text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function PixelBar({ value, max, min }: { value: number; max: number; min?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value > max ? 'bg-rose-500' : min !== undefined && value < min ? 'bg-amber-400' : value === 0 ? 'bg-slate-200' : 'bg-emerald-500';
  return (
    <div className="-mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
      <div className={cx('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
