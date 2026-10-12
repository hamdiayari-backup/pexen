import React, { useState } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { errorMessage } from '../lib/hooks';
import { ROLE_LABELS, timeAgo } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card, Field, Input, PageHeader, Section } from '../ui/primitives';

function strength(p: string): { score: number; label: string; color: string } {
  let s = 0;
  if (p.length >= 10) s++;
  if (p.length >= 14) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^a-zA-Z0-9]/.test(p)) s++;
  const levels = [
    { label: 'Très faible', color: 'bg-rose-500' },
    { label: 'Faible', color: 'bg-rose-400' },
    { label: 'Moyen', color: 'bg-amber-400' },
    { label: 'Bon', color: 'bg-emerald-400' },
    { label: 'Excellent', color: 'bg-emerald-500' },
    { label: 'Excellent', color: 'bg-emerald-600' },
  ];
  return { score: s, ...levels[s] };
}

export default function ProfilePage() {
  const { user, setToken } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [saving, setSaving] = useState(false);
  const st = strength(next);
  const valid = next.length >= 10 && /[a-zA-Z]/.test(next) && /\d/.test(next) && next === confirmPwd && current;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Mon profil" />
      <Card className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">{(user?.name || user?.email || '?').slice(0, 2).toUpperCase()}</span>
        <div>
          <p className="text-base font-semibold text-slate-900">{user?.name}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone="brand">{ROLE_LABELS[user?.role || '']}</Badge>
            <span className="text-xs text-slate-400">Dernière connexion {timeAgo(user?.lastLoginAt)}</span>
          </div>
        </div>
      </Card>

      <Section title="Changer de mot de passe" description="Vos autres sessions ouvertes seront déconnectées.">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!valid) return;
            setSaving(true);
            try {
              const r = await api.changePassword(current, next);
              setToken(r.token);
              setCurrent('');
              setNext('');
              setConfirmPwd('');
              toast.success('Mot de passe modifié');
            } catch (err) {
              toast.error(errorMessage(err));
            } finally {
              setSaving(false);
            }
          }}
        >
          <Field label="Mot de passe actuel">
            <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
          <Field label="Nouveau mot de passe" hint="10 caractères minimum, avec au moins une lettre et un chiffre.">
            <Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
          {next ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i < st.score ? st.color : 'bg-slate-200'}`} />
                ))}
              </div>
              <span className="w-20 text-right text-xs text-slate-500">{st.label}</span>
            </div>
          ) : null}
          <Field label="Confirmer le nouveau mot de passe" error={confirmPwd && confirmPwd !== next ? 'Les mots de passe ne correspondent pas' : undefined}>
            <Input type="password" autoComplete="new-password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
          </Field>
          <Button type="submit" variant="primary" loading={saving} disabled={!valid}>
            Mettre à jour le mot de passe
          </Button>
        </form>
      </Section>
    </div>
  );
}
