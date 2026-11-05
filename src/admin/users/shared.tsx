/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Copy, LogOut, Monitor, Smartphone, Sparkles, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { AuditEntry, LinkDelivery, Paged, PasswordPolicy, PublicUser, RoleRow, SessionRow } from '../lib/api';
import { auditDetail, auditLabel } from '../lib/audit';
import { fmtDateTime, timeAgo } from '../lib/format';
import { Modal } from '../ui/overlays';
import { Alert, Badge, Button, cx, Input, Spinner } from '../ui/primitives';
import { policyChecks } from '../account/SecurityForms';
import { Pagination, usePagination } from '../ui/Pagination';

const AVATAR_TONES = ['bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-800', 'bg-rose-100 text-rose-700', 'bg-brand-100 text-brand-700'];

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join('') || '?'
  );
}

const AVATAR_SIZES = { sm: 'h-7 w-7 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-14 w-14 text-lg', xl: 'h-20 w-20 text-2xl' };

export function Avatar({ name, email, src, size = 'md' }: { name: string; email: string; src?: string; size?: keyof typeof AVATAR_SIZES }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (src && !broken) {
    return <img src={src} alt="" onError={() => setBroken(true)} className={cx('shrink-0 rounded-full object-cover ring-1 ring-slate-200', AVATAR_SIZES[size])} />;
  }
  const tone = AVATAR_TONES[[...email].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return <span className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', tone, AVATAR_SIZES[size])}>{initials(name)}</span>;
}

export function RoleBadge({ roleId, roles, fallback }: { roleId: string; roles?: RoleRow[] | null; fallback?: string }) {
  const role = roles?.find((r) => r.id === roleId);
  return <Badge tone={role?.tone ?? 'neutral'}>{role?.name ?? fallback ?? roleId}</Badge>;
}

export function UserStatusBadge({ user, inviteExpiresAt }: { user: Pick<PublicUser, 'status'>; inviteExpiresAt?: string }) {
  if (user.status === 'suspended')
    return (
      <Badge tone="danger" dot>
        Suspendu
      </Badge>
    );
  if (user.status === 'invited') {
    const expired = !inviteExpiresAt;
    return (
      <span title={inviteExpiresAt ? `Lien valable jusqu’au ${fmtDateTime(inviteExpiresAt)}` : 'Le lien d’invitation a expiré : renvoyez-le'}>
        <Badge tone="warning" dot>
          {expired ? 'Invitation expirée' : 'Invitation envoyée'}
        </Badge>
      </span>
    );
  }
  return (
    <Badge tone="success" dot>
      Actif
    </Badge>
  );
}

/** Mot de passe aléatoire respectant la politique (caractères ambigus exclus). */
export function generatePassword(policy: PasswordPolicy): string {
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const symbols = '!@#$%&*?-_+=';
  const all = lower + upper + digits + symbols;
  const length = Math.max(16, policy.passwordMinLength);
  const pick = (set: string) => set[crypto.getRandomValues(new Uint32Array(1))[0]! % set.length];
  for (;;) {
    const chars = [pick(lower), pick(upper), pick(digits), pick(symbols)];
    while (chars.length < length) chars.push(pick(all));
    for (let i = chars.length - 1; i > 0; i--) {
      const j = crypto.getRandomValues(new Uint32Array(1))[0]! % (i + 1);
      [chars[i], chars[j]] = [chars[j]!, chars[i]!];
    }
    const pw = chars.join('');
    if (policyChecks(pw, policy).every((c) => c.ok)) return pw;
  }
}

export function GeneratePasswordButton({ policy, onGenerate }: { policy: PasswordPolicy; onGenerate: (pw: string) => void }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      icon={Sparkles}
      onClick={() => {
        const pw = generatePassword(policy);
        onGenerate(pw);
        void navigator.clipboard?.writeText(pw).then(() => toast.success('Mot de passe généré et copié'));
      }}
    >
      Générer
    </Button>
  );
}

export function CopyField({ value }: { value: string }) {
  return (
    <div className="flex gap-2">
      <Input readOnly value={value} onFocus={(e) => e.target.select()} className="font-mono text-xs" />
      <Button
        icon={Copy}
        onClick={() => {
          void navigator.clipboard.writeText(value);
          toast.success('Lien copié');
        }}
      >
        Copier
      </Button>
    </div>
  );
}

/** Résultat d'une invitation ou d'un lien de réinitialisation : état de l'e-mail et lien à transmettre. */
export function LinkResultModal({
  result,
  onClose,
}: {
  /** `manual` : lien demandé sans envoi d'e-mail. */
  result: { title: string; email: string; delivery: LinkDelivery; manual?: boolean } | null;
  onClose: () => void;
}) {
  const d = result?.delivery;
  return (
    <Modal open={!!result} onClose={onClose} title={result?.title ?? ''} size="md" footer={<Button variant="primary" onClick={onClose}>Terminé</Button>}>
      {result && d ? (
        <div className="space-y-4">
          {result.manual ? (
            <Alert tone="info">Transmettez ce lien à {result.email} par un canal sûr : il donne accès au compte.</Alert>
          ) : d.emailSent ? (
            <Alert tone="success" icon={CheckCircle2} title={`E-mail envoyé à ${result.email}`}>
              Vous pouvez aussi transmettre le lien ci-dessous par un autre moyen.
            </Alert>
          ) : (
            <Alert tone="warning" icon={XCircle} title="Aucun e-mail n’a été envoyé">
              {d.emailError ? <span className="block break-words">{d.emailError}</span> : null}
              Transmettez ce lien à {result.email} par un canal sûr. Configurez l’envoi d’e-mails dans Paramètres › E-mails.
            </Alert>
          )}
          <CopyField value={d.url} />
          <p className="text-xs text-slate-500">
            Lien personnel à usage unique, valable jusqu’au {fmtDateTime(d.expiresAt)}. Un nouveau lien annule le précédent.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}

export function SessionList({
  sessions,
  onRevoke,
  revoking,
  emptyLabel = 'Aucune session ouverte.',
}: {
  sessions: SessionRow[] | null;
  onRevoke?: (s: SessionRow) => void;
  revoking?: string | null;
  emptyLabel?: string;
}) {
  const pg = usePagination(sessions ?? [], 'sessions', { defaultSize: 10 });
  if (!sessions) return <Spinner className="mx-auto my-6 block" />;
  if (!sessions.length) return <p className="py-6 text-center text-sm text-slate-500">{emptyLabel}</p>;
  return (
    <div>
    <ul className="divide-y divide-slate-100">
      {pg.pageItems.map((s) => {
        const Icon = /iOS|Android/.test(s.device) ? Smartphone : Monitor;
        return (
          <li key={s.id} className="flex items-start gap-3 py-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-800">
                {s.device}
                {s.current ? <Badge tone="success">Cette session</Badge> : null}
                {s.remember ? <Badge>Rester connecté</Badge> : null}
              </p>
              <p className="mt-0.5 text-xs text-slate-500" title={s.userAgent}>
                {s.ip ?? 'IP inconnue'} · active {timeAgo(s.lastSeenAt)} · ouverte le {fmtDateTime(s.createdAt)}
              </p>
              <p className="text-xs text-slate-400">Expire le {fmtDateTime(s.expiresAt)}</p>
            </div>
            {onRevoke && !s.current ? (
              <Button size="sm" variant="ghost" icon={LogOut} loading={revoking === s.id} onClick={() => onRevoke(s)}>
                Fermer
              </Button>
            ) : null}
          </li>
        );
      })}
    </ul>
    <Pagination {...pg.props} noun="sessions" flush />
    </div>
  );
}

export function ActivityFeed({
  data,
  page,
  onPage,
  onPageSize,
  roleName,
  showUser,
}: {
  data: Paged<AuditEntry> | null;
  page: number;
  onPage: (p: number) => void;
  onPageSize?: (n: number) => void;
  roleName?: (id: string) => string;
  showUser?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);
  if (!data) return <Spinner className="mx-auto my-6 block" />;
  if (!data.items.length) return <p className="py-6 text-center text-sm text-slate-500">Aucune activité enregistrée.</p>;
  return (
    <div>
      <ul className="divide-y divide-slate-100">
        {data.items.map((e) => {
          const { label, tone } = auditLabel(e.action);
          const detail = auditDetail(e, roleName);
          return (
            <li key={e.id} className="py-2.5">
              <button type="button" className="flex w-full items-start gap-3 text-left" onClick={() => setOpen(open === e.id ? null : e.id)}>
                <span
                  className={cx(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    { neutral: 'bg-slate-300', success: 'bg-emerald-500', warning: 'bg-amber-500', danger: 'bg-rose-500', info: 'bg-sky-500', brand: 'bg-brand-500' }[tone]
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-slate-800">
                    {label}
                    {e.target ? <span className="text-slate-500"> — {e.target}</span> : null}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {showUser && e.userEmail ? `${e.userEmail} · ` : ''}
                    {fmtDateTime(e.ts)}
                    {e.ip ? ` · ${e.ip}` : ''}
                    {detail ? ` · ${detail}` : ''}
                  </span>
                </span>
              </button>
              {open === e.id ? (
                <div className="ml-5 mt-2 space-y-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  <p>
                    <span className="text-slate-400">Action :</span> <code className="font-mono">{e.action}</code>
                  </p>
                  {e.userAgent ? (
                    <p className="break-all">
                      <span className="text-slate-400">Navigateur :</span> {e.userAgent}
                    </p>
                  ) : null}
                  {e.detail && Object.keys(e.detail).length ? <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px]">{JSON.stringify(e.detail, null, 2)}</pre> : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <Pagination page={page} pageSize={data.pageSize} total={data.total} onPage={onPage} onPageSize={onPageSize} noun="entrées" flush />
    </div>
  );
}
