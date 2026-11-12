import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarClock, CheckCircle2, ChevronRight, Clock, Phone, ShieldCheck } from 'lucide-react';
import type { BlockStyle, ContactFormData, CtaData, ProjectMeta, ProjectsData, SimulatorData } from '../../../../server/cms/blocks';
import type { ContactFormConfig } from '../../../../server/cms/types';
import { CeeSimulator } from '../../CeeSimulator';
import { IS_PREVIEW } from '../../../preview';
import { ButtonRow, cx, Highlighted, Placeholder, Reveal, Section, SectionHeading, useCms, useGo } from '../kit';

/* ------------------------------------------------------------------ Appel à l'action */

export function CtaBlock({ d, style }: { d: CtaData; style: BlockStyle }) {
  const { t } = useCms();
  const box = {
    gradient: 'bg-gradient-to-r from-px-primary-dark via-px-accent-mid to-px-accent px-gradient-pan text-white',
    dark: 'bg-px-navy text-white shadow-[0_40px_80px_-40px_rgba(11,21,40,0.6)]',
    image: 'bg-px-navy text-white',
    light: 'border border-px-border bg-white text-px-navy',
  }[d.variant];
  const onDark = d.variant !== 'light';
  const centered = d.layout === 'centered';

  return (
    <Section style={style}>
      <Reveal>
        <div className={cx('relative overflow-hidden rounded-[1.75rem] p-8 sm:p-10 lg:px-14', centered && 'px-6 py-14 text-center sm:p-16 lg:p-20', box)}>
          {d.variant === 'gradient' ? (
            <>
              <div className="absolute -right-10 -top-16 h-72 w-72 rounded-full border-[28px] border-white/10 px-spin-slow" />
              <div className="absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-white/10 blur-2xl px-drift" />
              <div className="absolute inset-0 px-beam opacity-70" />
              <div className="absolute inset-0 px-noise opacity-[0.08]" />
            </>
          ) : null}
          {d.variant === 'dark' || d.variant === 'image' ? (
            <>
              {d.backgroundImage ? (
                <img
                  src={d.backgroundImage}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-25 px-kenburns"
                />
              ) : null}
              {d.backgroundImage ? <div className="absolute inset-0 bg-gradient-to-r from-px-navy via-px-navy/85 to-px-navy/60" /> : null}
              {centered ? <div className="absolute inset-0 px-grid-bg px-grid-drift opacity-40 [filter:invert(1)]" /> : null}
              <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-px-primary/30 blur-[90px] px-drift" />
              <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-px-accent/25 blur-[100px] px-drift [animation-delay:-8s]" />
              <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 px-pulse-ring" />
              <div className="absolute inset-0 px-aurora opacity-40 mix-blend-soft-light" />
            </>
          ) : null}
          {d.variant === 'light' ? (
            <>
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-px-primary/12 blur-3xl px-blob" />
              <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-px-accent/10 blur-3xl px-drift" />
              <div className="absolute inset-0 px-mesh-soft opacity-80" />
            </>
          ) : null}

          {centered ? (
            <div className="relative mx-auto max-w-3xl space-y-6">
              {d.badge ? (
                <div className={cx('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium', onDark ? 'border-white/15 bg-white/10 text-white/80' : 'border-px-border bg-px-surface text-slate-600')}>
                  <Clock className="h-3.5 w-3.5 text-px-primary-light" />
                  {t(d.badge)}
                </div>
              ) : null}
              {(() => {
                const title = t(d.title || '').trim();
                const btn = t(d.buttons?.[0]?.label || '').trim();
                const sameAsBtn = Boolean(title && btn && title.toLowerCase() === btn.toLowerCase());
                if (sameAsBtn) return null;
                return (
                  <h2 className={cx('text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl', onDark ? 'text-white' : 'text-px-navy')}>
                    {title}
                    {d.highlight ? (
                      <>
                        {' '}
                        <span className="bg-gradient-to-r from-px-primary-light to-px-accent-light bg-clip-text text-transparent">{t(d.highlight)}</span>
                      </>
                    ) : null}
                  </h2>
                );
              })()}
              {d.text ? <p className={cx('text-base leading-relaxed sm:text-lg', onDark ? 'text-slate-300' : 'text-slate-600')}>{t(d.text)}</p> : null}
              <ButtonRow buttons={d.buttons} center size="lg" className="pt-2" />
            </div>
          ) : d.bigNumber ? (
            <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="flex items-end gap-4 lg:col-span-5">
                <div className="bg-gradient-to-br from-px-primary-light to-px-accent bg-clip-text text-[5.5rem] font-bold leading-none text-transparent sm:text-[7rem]">{t(d.bigNumber)}</div>
                <div className="pb-4 text-sm leading-snug text-white/70">
                  {t(d.bigNumberLabel)}
                  {d.bigNumberStrong ? (
                    <>
                      <br />
                      <span className="font-semibold text-white">{t(d.bigNumberStrong)}</span>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="space-y-3 text-white lg:col-span-4">
                {d.badge ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold text-px-primary-light">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {t(d.badge)}
                  </div>
                ) : null}
                <h3 className="text-xl font-semibold leading-snug sm:text-2xl">
                  <Highlighted title={d.title} highlight={d.highlight} />
                </h3>
                {d.text ? <p className="text-sm leading-relaxed text-white/65">{t(d.text)}</p> : null}
              </div>
              <div className="flex lg:col-span-3 lg:justify-end">
                <ButtonRow buttons={d.buttons} />
              </div>
            </div>
          ) : (
            <div className={cx('relative grid grid-cols-1 items-center gap-8', d.image && 'lg:grid-cols-[1fr_auto]')}>
              <div className="max-w-2xl space-y-6">
                <div>
                  {d.eyebrow ? <div className={cx('mb-2 text-[11px] font-semibold uppercase tracking-[0.18em]', onDark ? 'text-white/80' : 'text-px-accent')}>{t(d.eyebrow)}</div> : null}
                  <h3 className={cx('text-2xl font-semibold leading-tight sm:text-3xl', onDark ? 'text-white' : 'text-px-navy')}>
                    {t(d.title)}
                    {d.highlight ? (
                      <>
                        {' '}
                        <span className={d.variant === 'gradient' ? 'text-px-navy' : onDark ? 'text-px-primary-light' : 'text-px-primary-dark'}>{t(d.highlight)}</span>
                      </>
                    ) : null}
                  </h3>
                  {d.text ? <p className={cx('mt-3 text-sm leading-relaxed', onDark ? 'text-white/75' : 'text-slate-600')}>{t(d.text)}</p> : null}
                </div>
                <ButtonRow buttons={d.buttons} />
              </div>
              {d.image ? (
                <div className="relative mx-auto w-52 shrink-0 rotate-2 rounded-md bg-white p-2 pb-0 shadow-2xl lg:mx-0 lg:w-60">
                  <span className="px-tape" aria-hidden="true" />
                  <img src={d.image} alt={d.imageAlt || ''} loading="lazy" className="aspect-[4/3] w-full rounded-sm object-cover object-right" />
                  <div className="py-2 text-center">
                    <span className="font-hand text-xl leading-tight text-px-navy">{t(d.imageCaption)}</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ Réalisations */

export type ProjectCard = ProjectMeta & { id: string; path: string; title: string };

let projectsCache: Promise<ProjectCard[]> | null = null;
function loadProjects() {
  projectsCache ??= fetch('/api/public/projects')
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
  return projectsCache;
}

function useProjects() {
  const [list, setList] = useState<ProjectCard[] | null>(null);
  useEffect(() => {
    let alive = true;
    void loadProjects().then((p) => alive && setList(p));
    return () => {
      alive = false;
    };
  }, []);
  return list;
}

export function ProjectsBlock({ d, style }: { d: ProjectsData; style: BlockStyle }) {
  const all = useProjects();
  const go = useGo();
  const { t } = useCms();
  const [filter, setFilter] = useState('all');

  const projects = useMemo(() => {
    let list = all || [];
    if (d.filter === 'sector' && d.sector) list = list.filter((p) => p.sector.toLowerCase().includes(d.sector!.toLowerCase()));
    if (filter !== 'all') list = list.filter((p) => p.sector === filter);
    return d.limit > 0 ? list.slice(0, d.limit) : list;
  }, [all, d.filter, d.sector, d.limit, filter]);
  const sectors = useMemo(() => [...new Set((all || []).map((p) => p.sector))], [all]);

  if (all && !projects.length && filter === 'all') {
    return IS_PREVIEW ? (
      <Section style={style}>
        <Placeholder label="Aucune réalisation publiée pour ce filtre" className="h-40 rounded-2xl" />
      </Section>
    ) : null;
  }

  const body = !all ? (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-72 animate-pulse rounded-[1.25rem] bg-px-surface" />
      ))}
    </div>
  ) : d.layout === 'cards' ? (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((p, i) => (
        <Reveal key={p.id} delay={i * 70}>
          <button type="button" onClick={() => go(p.path)} className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-px-border bg-white text-left shadow-sm transition hover:border-px-primary/40 hover:shadow-lg">
            <div className="aspect-[16/10] overflow-hidden bg-px-surface">
              <img src={p.image} alt={p.solution} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-px-primary">{p.client}</div>
              <h3 className="mt-2 text-lg font-semibold leading-snug text-px-navy">{p.solution}</h3>
              <ul className="mt-3 flex-1 space-y-1.5 text-xs text-slate-600">
                {p.results.slice(0, 3).map((r) => (
                  <li key={r} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-px-primary" />
                    {t(r)}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-end justify-between border-t border-px-border pt-3">
                <span className="text-xs text-slate-500">Prime CEE</span>
                <span className="font-mono text-sm font-bold text-px-navy">{p.ceeSheet || 'Sur devis'}</span>
              </div>
            </div>
          </button>
        </Reveal>
      ))}
    </div>
  ) : d.layout === 'featured' ? (
    <FeaturedProjects projects={projects} go={go} t={t} />
  ) : d.layout === 'compact' ? (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {projects.map((p, i) => (
        <Reveal key={p.id} delay={i * 80}>
          <button type="button" onClick={() => go(p.path)} className="card-pexen group w-full overflow-hidden text-left">
            <div className="aspect-16/10 overflow-hidden bg-slate-100">
              <img src={p.image} alt={p.solution} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="space-y-1 p-4">
              <div className="text-xs font-semibold text-px-primary-dark">
                {p.client} — {p.location}
              </div>
              <div className="line-clamp-1 text-sm font-semibold text-px-navy">{p.solution}</div>
            </div>
          </button>
        </Reveal>
      ))}
    </div>
  ) : (
    <>
      {d.showFilters && sectors.length > 1 ? (
        <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
          <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Filtrer par secteur :</span>
          {['all', ...sectors].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cx('rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all', filter === s ? 'bg-px-navy text-white shadow-xs' : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300')}
            >
              {s === 'all' ? 'Tous les chantiers' : s}
            </button>
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {projects.map((p, i) => (
          <Reveal key={p.id} delay={(i % 2) * 80}>
            <button type="button" onClick={() => go(p.path)} className="card-pexen group flex h-full w-full flex-col justify-between overflow-hidden text-left">
              <div>
                <div className="relative aspect-16/10 overflow-hidden bg-px-navy">
                  <img src={p.image} alt={`${p.solution} chez ${p.client}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute left-4 top-4 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-semibold text-px-navy">{p.sector}</div>
                  <div className="absolute right-4 top-4 rounded-full bg-px-navy/80 px-2.5 py-1 font-mono text-[11px] text-white">
                    {p.location}
                    {p.department ? ` (${p.department})` : ''}
                  </div>
                </div>
                <div className="space-y-3 p-6">
                  <div className="text-xs font-semibold text-px-primary-dark">{p.client}</div>
                  <h3 className="text-lg font-semibold text-px-navy transition-colors group-hover:text-px-primary-dark">{p.solution}</h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-sm">{p.summary}</p>
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                    <div>
                      <span className="block text-[10px] uppercase text-slate-400">Fiche CEE :</span>
                      <span className="font-mono font-medium text-slate-800">{p.ceeSheet || 'Standard'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-slate-400">Contrôle :</span>
                      <span className="font-medium text-emerald-700">Organisme COFRAC</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-6 pb-6 pt-4 text-xs font-semibold text-px-navy group-hover:text-px-primary-dark">
                <span>Consulter la fiche détaillée</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </Reveal>
        ))}
      </div>
    </>
  );

  return (
    <Section style={style}>
      <SectionHeading h={d} />
      {body}
    </Section>
  );
}

function FeaturedProjects({ projects, go, t }: { projects: ProjectCard[]; go: (l?: string) => void; t: (s?: string) => string }) {
  const [featured, ...others] = [...projects].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  if (!featured) return null;
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <Reveal className="lg:col-span-7">
        <button type="button" onClick={() => go(featured.path)} className="group relative h-full min-h-[420px] w-full overflow-hidden rounded-[1.75rem] text-left lg:min-h-[540px]">
          <img src={featured.image} alt={`${featured.solution} — ${featured.client}`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-px-navy via-px-navy/40 to-transparent" />
          <div className="absolute left-5 top-5 flex gap-2">
            <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-px-navy">{featured.sector}</span>
            {featured.ceeSheet ? <span className="rounded-full bg-px-primary px-3 py-1 text-[11px] font-semibold text-px-navy">{featured.ceeSheet}</span> : null}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
            <div className="mb-2 text-xs font-semibold text-px-primary-light">
              {featured.client} — {featured.location}
              {featured.department ? ` (${featured.department})` : ''}
            </div>
            <h3 className="max-w-lg text-2xl font-semibold leading-tight sm:text-3xl">{featured.solution}</h3>
            <div className="grid grid-rows-[0fr] transition-all duration-500 group-hover:grid-rows-[1fr]">
              <ul className="space-y-1.5 overflow-hidden text-sm text-white/80">
                {featured.results.map((r) => (
                  <li key={r} className="flex items-start gap-2 pt-2 first:pt-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-px-primary-light" />
                    {t(r)}
                  </li>
                ))}
              </ul>
            </div>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
              Voir le chantier
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-px-navy transition-colors group-hover:bg-px-primary">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </span>
          </div>
        </button>
      </Reveal>
      <div className="grid grid-cols-1 gap-5 lg:col-span-5">
        {others.slice(0, 3).map((item, idx) => (
          <Reveal key={item.id} delay={100 + idx * 90} className="h-full">
            <button
              type="button"
              onClick={() => go(item.path)}
              className="group flex h-full w-full items-stretch gap-4 rounded-[1.25rem] border border-px-border bg-white p-3 text-left transition-all hover:border-px-primary/60 hover:shadow-[0_20px_40px_-20px_rgba(0,112,243,0.25)]"
            >
              <div className="relative w-28 shrink-0 overflow-hidden rounded-xl sm:w-36">
                <img src={item.image} alt={`${item.solution} — ${item.client}`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between py-1.5 pr-2">
                <div>
                  <div className="text-[11px] font-semibold text-px-primary-dark">
                    {item.client} · {item.sector}
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-px-navy sm:text-base">{item.solution}</h3>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="truncate font-mono text-[10px] text-slate-400">{item.ceeSheet}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-px-accent" />
                </div>
              </div>
            </button>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Simulateur */

export function SimulatorBlock({ d, style }: { d: SimulatorData; style: BlockStyle }) {
  const go = useGo();
  return (
    <Section style={style}>
      <SectionHeading h={{ ...d, align: d.align ?? 'center' }} className="mb-10" />
      <Reveal delay={100}>
        <CeeSimulator config={d} onNavigate={go} />
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ Formulaire de contact */

type PublicForm = Omit<ContactFormConfig, 'recipientEmails'>;

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-px-primary focus:outline-hidden sm:text-sm';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactFormBlock({ d, style }: { d: ContactFormData; style: BlockStyle }) {
  const { t, tokens } = useCms();
  const go = useGo();
  const [form, setForm] = useState<PublicForm | null>(null);
  const [failed, setFailed] = useState(false);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [progressStep, setProgressStep] = useState(1);
  const progressive = d.variant === 'progressive';
  const privacyPath = d.privacyPath || '/politique-de-confidentialite/';
  const step1Names = new Set(['vousEtes', 'entreprise', 'nomPrenom', 'email', 'telephone']);

  useEffect(() => {
    fetch(`/api/public/forms/${encodeURIComponent(d.formId || 'contact-main')}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setForm)
      .catch(() => setFailed(true));
  }, [d.formId]);

  const validate = () => {
    const errs: Record<string, string> = {};
    for (const f of form?.fields || []) {
      const v = values[f.name];
      const empty = v === undefined || v === '' || v === false;
      if (f.required && empty) errs[f.name] = f.type === 'checkbox' ? 'Cette case doit être cochée.' : `Merci de renseigner : ${f.label.toLowerCase()}.`;
      else if (!empty && f.type === 'email' && !EMAIL_RE.test(String(v))) errs[f.name] = 'Veuillez saisir un e-mail valide.';
      else if (!empty && f.type === 'tel' && String(v).replace(/\D/g, '').length < 8) errs[f.name] = 'Numéro de téléphone incomplet.';
    }
    return errs;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || honeypot || IS_PREVIEW) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    setSubmitError('');
    fetch(`/api/public/forms/${encodeURIComponent(form.id)}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, ...(form.honeypotField ? { [form.honeypotField]: honeypot } : {}) }),
    })
      .then(async (r) => {
        const res = await r.json().catch(() => ({}));
        setSubmitting(false);
        if (r.ok) return go(res.redirect || form.successPath || '/contact/merci/');
        if (res.fields) setErrors(res.fields);
        setSubmitError(r.status === 429 ? 'Trop de demandes envoyées. Merci de patienter quelques minutes ou de nous appeler directement.' : res.error || "L'envoi a échoué. Merci de réessayer ou de nous appeler directement.");
      })
      .catch(() => {
        setSubmitting(false);
        setSubmitError('Connexion impossible. Vérifiez votre réseau puis réessayez.');
      });
  };

  const set = (name: string, v: string | boolean) => setValues((s) => ({ ...s, [name]: v }));

  return (
    <Section style={style}>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <Reveal className="space-y-6 lg:col-span-5">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-px-navy sm:text-4xl lg:text-5xl">{t(d.title)}</h1>
            {d.intro ? <p className="text-base leading-relaxed text-slate-600">{t(d.intro)}</p> : null}
          </div>
          <div className="space-y-4 rounded-2xl border border-px-border bg-white p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-px-primary-dark">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">{t(d.phoneLabel) || 'Ligne directe'}</div>
                <a href={`tel:${tokens.phoneClean}`} className="px-phone text-base font-bold text-px-navy transition-colors hover:text-px-primary-dark sm:text-lg">
                  {tokens.phone}
                </a>
              </div>
            </div>
            {d.phoneHint ? (
              <div className="flex items-center gap-2 border-t border-slate-100 pt-2 text-xs text-slate-600">
                <Clock className="h-4 w-4 shrink-0 text-px-primary-dark" />
                <span>{t(d.phoneHint)}</span>
              </div>
            ) : null}
          </div>
          {d.listItems.length ? (
            <div className="card-pexen space-y-3 bg-white p-6">
              {d.listTitle ? <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t(d.listTitle)}</div> : null}
              <ul className="space-y-2 text-xs text-slate-600">
                {d.listItems.map((it) => (
                  <li key={it} className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-px-primary-dark" />
                    <span>{t(it)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Reveal>

        <Reveal delay={120} className="lg:col-span-7">
          <form onSubmit={submit} noValidate className="card-pexen space-y-6 border border-px-border bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="hidden" aria-hidden="true">
              <input type="text" name="user_extra_check" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
            </div>
            {failed ? (
              <p className="text-sm text-slate-500">Le formulaire est momentanément indisponible. Appelez-nous au {tokens.phone}.</p>
            ) : !form ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-px-surface" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {form.fields
                  .filter((f) => {
                    if (!progressive) return true;
                    if (progressStep === 1) return step1Names.has(f.name);
                    return !step1Names.has(f.name);
                  })
                  .map((f) => {
                  const full = f.width === 'full' || f.type === 'textarea' || f.type === 'checkbox';
                  const err = errors[f.name];
                  if (f.type === 'checkbox') {
                    const parts = f.label.split(/(politique de confidentialité)/i);
                    return (
                      <div key={f.id} className="pt-2 sm:col-span-2">
                        <label className="flex cursor-pointer select-none items-start gap-3">
                          <input type="checkbox" checked={!!values[f.name]} onChange={(e) => set(f.name, e.target.checked)} className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-px-primary focus:ring-px-primary" />
                          <span className={cx('leading-relaxed text-slate-600', progressive ? 'text-[11px] italic' : 'text-xs')}>
                            {parts.map((p, i) =>
                              /politique de confidentialité/i.test(p) ? (
                                <button key={i} type="button" onClick={() => go(privacyPath)} className="font-medium not-italic text-px-primary-dark underline hover:text-px-navy">
                                  {p}
                                </button>
                              ) : (
                                <React.Fragment key={i}>{p}</React.Fragment>
                              )
                            )}
                            {f.required ? ' *' : ''}
                          </span>
                        </label>
                        {err ? <p className="mt-1 text-[11px] text-rose-600">{err}</p> : null}
                      </div>
                    );
                  }
                  return (
                    <div key={f.id} className={full ? 'sm:col-span-2' : ''}>
                      <label htmlFor={`f-${f.id}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                        {f.label}
                        {f.required ? ' *' : ''}
                      </label>
                      {f.type === 'select' ? (
                        <select id={`f-${f.id}`} value={String(values[f.name] ?? '')} onChange={(e) => set(f.name, e.target.value)} className={inputCls}>
                          <option value="">{f.placeholder || 'Sélectionnez…'}</option>
                          {(f.options || []).map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea id={`f-${f.id}`} rows={4} placeholder={f.placeholder} value={String(values[f.name] ?? '')} onChange={(e) => set(f.name, e.target.value)} className={cx(inputCls, 'leading-relaxed')} />
                      ) : (
                        <input id={`f-${f.id}`} type={f.type} placeholder={f.placeholder} value={String(values[f.name] ?? '')} onChange={(e) => set(f.name, e.target.value)} className={inputCls} />
                      )}
                      {err ? <p className="mt-1 text-[11px] text-rose-600">{err}</p> : null}
                    </div>
                  );
                })}
              </div>
            )}

            {submitError ? (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {submitError}
              </div>
            ) : null}

            <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
              <span className="order-2 text-[11px] text-slate-400 sm:order-1">
                {progressive && progressStep === 1 ? 'Étape 1 sur 2 — l’essentiel' : '* Champs obligatoires'}
              </span>
              {progressive && progressStep === 1 ? (
                <button
                  type="button"
                  disabled={!form}
                  className="btn-primary-pexen order-1 w-full! justify-center sm:order-2 sm:w-auto!"
                  onClick={() => {
                    const errs = validate();
                    const stepErrs = Object.fromEntries(Object.entries(errs).filter(([k]) => step1Names.has(k)));
                    setErrors(stepErrs);
                    if (Object.keys(stepErrs).length === 0) setProgressStep(2);
                  }}
                >
                  <span>Continuer</span>
                  <ArrowRight className="btn-arrow h-4 w-4" />
                </button>
              ) : (
                <button type="submit" disabled={submitting || !form} className="btn-primary-pexen order-1 w-full! justify-center sm:order-2 sm:w-auto!">
                  <span>{submitting ? 'Transmission en cours…' : t(d.submitLabel) || 'Envoyer ma demande'}</span>
                  <ArrowRight className="btn-arrow h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </Reveal>
      </div>
    </Section>
  );
}