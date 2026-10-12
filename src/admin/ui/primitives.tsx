import React, { forwardRef, useId } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ Button */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variantCls: Record<ButtonVariant, string> = {
  primary: 'bg-navy-900 text-white hover:bg-navy-800 shadow-sm',
  secondary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  outline: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
};
const sizeCls: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  icon: 'h-8 w-8 justify-center',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'outline', size = 'md', loading, icon: Icon, className, children, disabled, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cx(
        'inline-flex shrink-0 items-center rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        variantCls[variant],
        sizeCls[size],
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
});

/* ------------------------------------------------------------------ Form controls */

const controlCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 disabled:bg-slate-50 disabled:text-slate-500';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { prefix?: string; invalid?: boolean }>(
  function Input({ className, prefix, invalid, ...rest }, ref) {
    if (prefix) {
      return (
        <div className={cx('flex items-stretch rounded-lg shadow-xs', className)}>
          <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">{prefix}</span>
          <input ref={ref} className={cx(controlCls, 'h-9 rounded-l-none shadow-none', invalid && 'border-rose-400')} {...rest} />
        </div>
      );
    }
    return <input ref={ref} className={cx(controlCls, 'h-9', invalid && 'border-rose-400 focus:ring-rose-500/15', className)} {...rest} />;
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, rows = 3, ...rest },
  ref
) {
  return <textarea ref={ref} rows={rows} className={cx(controlCls, 'py-2 leading-relaxed', className)} {...rest} />;
});

export function Select({
  value,
  onChange,
  options,
  className,
  disabled,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cx(controlCls, 'h-9 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 20 20%27 fill=%27%2394a3b8%27%3E%3Cpath d=%27M5.5 7.5l4.5 4.5 4.5-4.5%27/%3E%3C/svg%3E")] bg-[length:18px] bg-[right_8px_center] bg-no-repeat pr-8', className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  counter,
  className,
  htmlFor,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  counter?: { value: number; min?: number; max: number };
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  let counterCls = 'text-slate-400';
  if (counter) {
    if (counter.value > counter.max) counterCls = 'text-rose-600';
    else if (counter.min !== undefined && counter.value < counter.min) counterCls = 'text-amber-600';
    else counterCls = 'text-emerald-600';
  }
  return (
    <div className={cx('space-y-1.5', className)}>
      {(label || counter) && (
        <div className="flex items-baseline justify-between gap-2">
          {label ? (
            <label htmlFor={htmlFor} className="text-[13px] font-medium text-slate-700">
              {label}
            </label>
          ) : (
            <span />
          )}
          {counter ? (
            <span className={cx('text-xs tabular-nums', counterCls)}>
              {counter.value} / {counter.max}
            </span>
          ) : null}
        </div>
      )}
      {children}
      {error ? <p className="text-xs text-rose-600">{error}</p> : hint ? <p className="text-xs leading-relaxed text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  const toggle = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-brand-600' : 'bg-slate-300'
      )}
    >
      <span className={cx('inline-block h-4 w-4 transform rounded-full bg-white shadow transition', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
    </button>
  );
  if (!label) return toggle;
  return (
    <div className="flex items-start justify-between gap-6 py-1">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description ? <span className="mt-0.5 block text-[13px] leading-relaxed text-slate-500">{description}</span> : null}
      </label>
      {toggle}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; icon?: LucideIcon }[];
  size?: 'sm' | 'md';
}) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'inline-flex items-center gap-1.5 rounded-md font-medium transition',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]',
            value === o.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          )}
        >
          {o.icon ? <o.icon className="h-3.5 w-3.5" /> : null}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ColorField({ value, onChange, label, hint }: { value: string; onChange: (v: string) => void; label: string; hint?: string }) {
  const valid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
  return (
    <Field label={label} hint={hint} error={valid ? undefined : 'Couleur hexadécimale invalide'}>
      <div className="flex items-center gap-2">
        <label className="relative h-9 w-11 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 shadow-xs" style={{ background: valid ? value : '#fff' }}>
          <input type="color" value={valid ? value : '#000000'} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono uppercase" maxLength={7} />
      </div>
    </Field>
  );
}

/* ------------------------------------------------------------------ Layout */

export function Card({ children, className, padded = true }: { children: React.ReactNode; className?: string; padded?: boolean }) {
  return <div className={cx('rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]', padded && 'p-5', className)}>{children}</div>;
}

export function Section({
  title,
  description,
  children,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card padded={false} className={className}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{description}</p> : null}
        </div>
        {actions}
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </Card>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumb ? <div className="mb-1.5 text-[13px] text-slate-500">{breadcrumb}</div> : null}
        <h1 className="truncate text-[22px] font-semibold tracking-tight text-slate-900">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: React.ReactNode; icon?: LucideIcon; badge?: React.ReactNode }[];
}) {
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200 scrollbar-thin">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cx(
            '-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition',
            value === t.value ? 'border-brand-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          {t.icon ? <t.icon className="h-4 w-4" /> : null}
          {t.label}
          {t.badge}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Feedback */

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';
const toneCls: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
};

export function Badge({ tone = 'neutral', children, dot, className }: { tone?: Tone; children: React.ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', toneCls[tone], className)}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [Tone, string]> = {
    published: ['success', 'Publié'],
    draft: ['neutral', 'Brouillon'],
    scheduled: ['info', 'Planifié'],
    active: ['success', 'Actif'],
    pending: ['warning', 'En attente'],
    unsubscribed: ['neutral', 'Désinscrit'],
  };
  const [tone, label] = map[status] || ['neutral', status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}

export function Alert({ tone = 'info', title, children, icon: Icon, action }: { tone?: Tone; title?: React.ReactNode; children?: React.ReactNode; icon?: LucideIcon; action?: React.ReactNode }) {
  const bg: Record<Tone, string> = {
    neutral: 'bg-slate-50 border-slate-200 text-slate-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger: 'bg-rose-50 border-rose-200 text-rose-800',
    info: 'bg-sky-50 border-sky-200 text-sky-800',
    brand: 'bg-brand-50 border-brand-200 text-brand-700',
  };
  return (
    <div className={cx('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm', bg[tone])}>
      {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0" /> : null}
      <div className="min-w-0 flex-1">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={cx('leading-relaxed opacity-90', !!title && 'mt-0.5')}>{children}</div> : null}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx('h-5 w-5 animate-spin text-slate-400', className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-md bg-slate-200/70', className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-[15px] font-semibold text-slate-800">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="py-12 text-center">
      <p className="text-[15px] font-semibold text-slate-800">Chargement impossible</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      {onRetry ? (
        <Button className="mt-4" onClick={onRetry}>
          Réessayer
        </Button>
      ) : null}
    </Card>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  tone = 'brand',
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  hint?: React.ReactNode;
  trend?: { value: number; label?: string };
  tone?: 'brand' | 'sky' | 'violet' | 'amber' | 'rose';
}) {
  const iconTone = {
    brand: 'bg-brand-50 text-brand-700',
    sky: 'bg-sky-50 text-sky-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  }[tone];
  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg', iconTone)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-[26px] font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
        {trend ? (
          <span className={cx('font-medium', trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
            {trend.value >= 0 ? '+' : ''}
            {trend.value} %
          </span>
        ) : null}
        {hint}
      </div>
    </Card>
  );
}

export function ScoreRing({ score, size = 44, label }: { score: number; size?: number; label?: string }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} title={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={5} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * score) / 100} style={{ transition: 'stroke-dashoffset .4s' }} />
      </svg>
      <span className="absolute text-xs font-semibold tabular-nums text-slate-800">{score}</span>
    </div>
  );
}

export function ScoreDot({ score }: { score: number }) {
  const cls = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium tabular-nums text-slate-600">
      <span className={cx('h-2 w-2 rounded-full', cls)} />
      {score}
    </span>
  );
}

/* ------------------------------------------------------------------ Table */

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx('overflow-x-auto scrollbar-thin', className)}>
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}
export const Th = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <th className={cx('whitespace-nowrap border-b border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500', className)}>{children}</th>
);
export const Td = ({ children, className, colSpan }: { children?: React.ReactNode; className?: string; colSpan?: number }) => (
  <td colSpan={colSpan} className={cx('border-b border-slate-100 px-4 py-3 align-middle text-slate-700', className)}>
    {children}
  </td>
);

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[11px] font-medium text-slate-500">{children}</kbd>;
}
