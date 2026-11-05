import React, { useCallback, useRef, useState } from 'react';
import { Bot, Gauge, Loader2, MessageSquare, RotateCcw, Send, ShieldCheck, Users, Zap } from 'lucide-react';
import type { AiAssistantConfig } from '../../../server/cms/types';
import { api } from '../lib/api';
import { useAsync, useEditable } from '../lib/hooks';
import { fmtNumber } from '../lib/format';
import { useSite, useSiteData } from '../context/SiteContext';
import { Alert, Badge, Button, Card, cx, Field, Input, PageHeader, Section, Segmented, Select, StatCard, Switch, Textarea } from '../ui/primitives';
import { SaveBar } from '../ui/SaveBar';
import { TagInput } from '../ui/TagInput';

const MODELS = [
  { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash — rapide et précis (recommandé)' },
  { value: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite — le plus économique' },
  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (préversion) — réponses approfondies' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash — version stable' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro — version stable' },
];

function NumberField({ label, hint, value, onChange, min = 0, max, suffix }: { label: string; hint?: string; value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <Input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))} className="w-36 tabular-nums" />
        {suffix ? <span className="text-sm text-slate-500">{suffix}</span> : null}
      </div>
    </Field>
  );
}

interface Msg {
  role: 'user' | 'model';
  text: string;
}

function TestConsole({ enabled }: { enabled: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const send = async () => {
    const prompt = draft.trim();
    if (!prompt || busy) return;
    const history = msgs.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
    setMsgs((m) => [...m, { role: 'user', text: prompt }]);
    setDraft('');
    setBusy(true);
    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, history }) });
      const data = await res.json().catch(() => ({}));
      setMsgs((m) => [...m, { role: 'model', text: res.ok ? data.reply : `⚠ ${data.error || 'Erreur'}` }]);
    } catch {
      setMsgs((m) => [...m, { role: 'model', text: '⚠ Connexion impossible' }]);
    } finally {
      setBusy(false);
      setTimeout(() => end.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  return (
    <Card padded={false} className="flex h-[520px] flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Bot className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-slate-900">Tester l’assistant</p>
            <p className="text-[11px] text-slate-500">Utilise la configuration enregistrée</p>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={() => setMsgs([])} title="Nouvelle conversation">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4 scrollbar-thin">
        {!enabled ? <Alert tone="warning">L’assistant est désactivé : activez-le et enregistrez pour le tester.</Alert> : null}
        {msgs.length === 0 && enabled ? <p className="pt-16 text-center text-sm text-slate-400">Posez une question comme le ferait un visiteur.</p> : null}
        {msgs.map((m, i) => (
          <div key={i} className={cx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cx('max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed', m.role === 'user' ? 'bg-navy-900 text-white' : 'bg-white text-slate-800 ring-1 ring-slate-200')}>
              {m.text}
            </div>
          </div>
        ))}
        {busy ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> L’assistant rédige…
          </div>
        ) : null}
        <div ref={end} />
      </div>
      <form
        className="flex gap-2 border-t border-slate-100 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Votre message…" disabled={!enabled} />
        <Button type="submit" variant="primary" size="icon" className="h-9 w-9" disabled={!draft.trim() || busy || !enabled} aria-label="Envoyer">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}

export default function AiPage() {
  const site = useSiteData();
  const { patchSite } = useSite();
  const { data: info } = useAsync(() => api.aiInfo(), []);
  const save = useCallback(
    async (ai: AiAssistantConfig) => {
      await api.saveSection('ai', ai);
      patchSite('ai', ai);
    },
    [patchSite]
  );
  const ed = useEditable<AiAssistantConfig>(site.ai, save, { successMessage: 'Assistant IA mis à jour' });
  if (!ed.value) return null;
  const ai = ed.value;
  const custom = typeof ai.systemInstructionOverride === 'string' && ai.systemInstructionOverride.trim().length > 0;
  const tokenPct = info && ai.maxTokensPerDayGlobal ? Math.min(100, (info.usage.tokens / ai.maxTokensPerDayGlobal) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistant IA"
        description="Configurez l’assistant conversationnel du site, son comportement et ses limites d’utilisation."
        actions={ai.enabled ? <Badge tone="success" dot>Actif</Badge> : <Badge dot>Désactivé</Badge>}
      />

      {info && !info.configured ? (
        <Alert tone="danger" title="Clé API manquante">
          La variable GEMINI_API_KEY n’est pas définie sur le serveur : l’assistant ne peut pas répondre.
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Conversations aujourd’hui" value={fmtNumber(info?.usage.sessions || 0)} icon={MessageSquare} />
        <StatCard label="Messages aujourd’hui" value={fmtNumber(info?.usage.requests || 0)} icon={Zap} tone="violet" />
        <StatCard label="Visiteurs distincts" value={fmtNumber(info?.usage.uniqueIps || 0)} icon={Users} tone="sky" />
        <Card>
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium text-slate-500">Quota de tokens du jour</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Gauge className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-[26px] font-semibold tracking-tight text-slate-900 tabular-nums">{Math.round(tokenPct)} %</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={cx('h-full rounded-full', tokenPct > 85 ? 'bg-rose-500' : 'bg-amber-400')} style={{ width: `${tokenPct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {fmtNumber(info?.usage.tokens || 0)} / {fmtNumber(ai.maxTokensPerDayGlobal)}
            {info?.usage.blocked ? ` · ${info.usage.blocked} refus` : ''}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Section title="Activation et modèle">
            <Switch checked={ai.enabled} onChange={(enabled) => ed.patch({ enabled })} label="Assistant actif sur le site" description="Affiche la bulle de conversation pour les visiteurs." />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Libellé bouton" hint="Brief : Conseiller PEXEN">
                <Input value={ai.buttonLabel || ''} onChange={(e) => ed.patch({ buttonLabel: e.target.value })} placeholder="Conseiller PEXEN" />
              </Field>
              <Field label="Statut" hint="Sous le libellé">
                <Input value={ai.statusLabel || ''} onChange={(e) => ed.patch({ statusLabel: e.target.value })} placeholder="En ligne" />
              </Field>
              <Field label="Titre panneau">
                <Input value={ai.panelTitle || ''} onChange={(e) => ed.patch({ panelTitle: e.target.value })} placeholder="Conseiller PEXEN" />
              </Field>
            </div>
            <Field label="Modèle d’IA">
              <Select value={MODELS.some((m) => m.value === ai.model) ? ai.model : MODELS[0].value} onChange={(model) => ed.patch({ model })} options={MODELS} />
            </Field>
            <Field label={`Créativité : ${ai.temperature.toFixed(1)}`} hint="Plus la valeur est basse, plus les réponses sont factuelles et constantes. 0,2 à 0,4 recommandé pour un assistant technique.">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Précis</span>
                <input type="range" min={0} max={1} step={0.1} value={ai.temperature} onChange={(e) => ed.patch({ temperature: Number(e.target.value) })} className="flex-1 accent-brand-600" />
                <span className="text-xs text-slate-400">Créatif</span>
              </div>
            </Field>
          </Section>

          <Section title="Limites d’utilisation" description="Protègent votre budget et évitent les abus.">
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField label="Messages par conversation" min={1} max={200} value={ai.maxMessagesPerSession} onChange={(v) => ed.patch({ maxMessagesPerSession: v })} suffix="messages" />
              <NumberField label="Conversations par visiteur et par jour" min={1} max={500} value={ai.maxSessionsPerDayPerIp} onChange={(v) => ed.patch({ maxSessionsPerDayPerIp: v })} suffix="conversations" />
              <NumberField
                label="Quota global quotidien"
                hint="Au-delà, l’assistant invite le visiteur à vous contacter directement. 0 = illimité."
                value={ai.maxTokensPerDayGlobal}
                onChange={(v) => ed.patch({ maxTokensPerDayGlobal: v })}
                suffix="tokens / jour"
              />
            </div>
          </Section>

          <Section title="Pages où l’assistant apparaît">
            <Segmented
              value={ai.showOnPages === '*' ? 'all' : 'some'}
              onChange={(v) => ed.patch({ showOnPages: v === 'all' ? '*' : [] })}
              options={[
                { value: 'all', label: 'Toutes les pages' },
                { value: 'some', label: 'Pages choisies' },
              ]}
            />
            {ai.showOnPages !== '*' ? (
              <Field hint="Saisissez les adresses (ex. /contact/) puis Entrée. Une adresse se terminant par * inclut ses sous-pages (ex. /expertises/*).">
                <TagInput value={ai.showOnPages} onChange={(showOnPages) => ed.patch({ showOnPages })} placeholder="/contact/ puis Entrée" />
              </Field>
            ) : null}
          </Section>

          <Section
            title="Consignes de l’assistant"
            description="Définissent son périmètre, ses connaissances et son ton."
            actions={custom ? <Badge tone="brand">Personnalisées</Badge> : <Badge>Par défaut</Badge>}
          >
            <Alert tone="info" icon={ShieldCheck}>
              Par défaut, l’assistant ne répond qu’aux questions liées à PEXEN et à la performance énergétique, et propose systématiquement un rappel par un ingénieur.
            </Alert>
            <Textarea
              value={custom ? ai.systemInstructionOverride : info?.defaultSystemInstruction || ''}
              onChange={(e) => ed.patch({ systemInstructionOverride: e.target.value })}
              rows={16}
              className="font-mono text-xs leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{(custom ? ai.systemInstructionOverride! : info?.defaultSystemInstruction || '').length} caractères</span>
              {custom ? (
                <Button size="sm" icon={RotateCcw} onClick={() => ed.patch({ systemInstructionOverride: '' })}>
                  Revenir aux consignes par défaut
                </Button>
              ) : null}
            </div>
          </Section>
        </div>

        <div className="xl:sticky xl:top-20 xl:self-start">
          <TestConsole enabled={site.ai.enabled} />
        </div>
      </div>
      <SaveBar dirty={ed.dirty} saving={ed.saving} onSave={ed.commit} onReset={ed.reset} blocker={ed.blocker} />
    </div>
  );
}
