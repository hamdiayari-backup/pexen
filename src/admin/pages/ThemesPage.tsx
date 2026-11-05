import React, { useState } from 'react';
import { CheckCircle2, Download, ExternalLink, LayoutTemplate, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { errorMessage, useAsync } from '../lib/hooks';
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, PageSkeleton } from '../ui/primitives';

type ThemeRow = {
  id: string;
  name: string;
  description: string;
  version: string;
  screenshot?: string;
  multipage: boolean;
  installed: boolean;
  active: boolean;
  contentVersion: number;
};

export default function ThemesPage() {
  const { can } = useAuth();
  const canManage = can('appearance.themes');
  const list = useAsync(() => api.themes.list(), []);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = () => list.reload();

  const install = async (t: ThemeRow) => {
    setBusy(`install-${t.id}`);
    try {
      await api.themes.install(t.id, true);
      toast.success(`${t.name} installé avec le contenu multipage`);
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const activate = async (t: ThemeRow) => {
    setBusy(`act-${t.id}`);
    try {
      await api.themes.activate(t.id);
      toast.success(`${t.name} est le thème actif du site`);
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  if (list.loading) return <PageSkeleton />;
  if (list.error) return <ErrorState message={errorMessage(list.error)} onRetry={reload} />;

  const themes = (list.data?.themes ?? []) as ThemeRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thèmes"
        description="Thèmes React du site public (multipage, blocs CMS). Les démos HTML dans /themes/ restent des maquettes statiques."
      />

      {!themes.length ? (
        <EmptyState icon={LayoutTemplate} title="Aucun thème" description="Catalogue indisponible." />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {themes.map((t) => (
            <Card key={t.id} padded={false} className={t.active ? 'ring-2 ring-px-primary' : undefined}>
              <div className="relative aspect-[16/10] overflow-hidden rounded-t-xl border-b border-slate-100 bg-px-surface">
                {t.screenshot ? (
                  <img src={t.screenshot} alt={t.name} className="h-full w-full object-cover object-top" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <LayoutTemplate className="h-14 w-14" />
                  </div>
                )}
                {t.active ? (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Actif
                  </span>
                ) : null}
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[15px] font-semibold text-slate-900">{t.name}</h2>
                    <p className="text-xs text-slate-500">
                      v{t.version} · {t.multipage ? 'Multipage' : 'One page'}
                    </p>
                  </div>
                  {t.installed ? <Badge tone="success">Installé</Badge> : <Badge tone="neutral">Non installé</Badge>}
                </div>
                <p className="text-sm text-slate-600">{t.description}</p>
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  {t.id === 'pexen-ultra' && !t.installed ? (
                    <Button size="sm" variant="primary" icon={Download} loading={busy === `install-${t.id}`} onClick={() => install(t)}>
                      Installer + contenu
                    </Button>
                  ) : null}
                  {t.installed && !t.active && canManage ? (
                    <Button size="sm" variant="primary" icon={Sparkles} loading={busy === `act-${t.id}`} onClick={() => activate(t)}>
                      Activer
                    </Button>
                  ) : null}
                  {t.id === 'pexen-ultra' && t.installed && canManage ? (
                    <Button size="sm" icon={Download} loading={busy === `install-${t.id}`} onClick={() => install(t)}>
                      Réimporter le contenu
                    </Button>
                  ) : null}
                  <a
                    href={`/?preview_theme=${t.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Prévisualiser
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
