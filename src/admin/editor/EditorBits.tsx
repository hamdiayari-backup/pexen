import React, { useState } from 'react';
import { toast } from 'sonner';
import { History, RotateCcw } from 'lucide-react';
import type { Revision } from '../lib/api';
import { errorMessage, useAsync } from '../lib/hooks';
import { fmtDateTime, timeAgo } from '../lib/format';
import { Button, Card, EmptyState, Spinner } from '../ui/primitives';
import { Drawer, useConfirm } from '../ui/overlays';

export const toLocalInput = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : undefined);

export function SideCard({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <Card padded={false}>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-[13px] font-semibold text-slate-900">{title}</h3>
        {actions}
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </Card>
  );
}

export function RevisionsDrawer({
  open,
  onClose,
  load,
  restore,
  onRestored,
}: {
  open: boolean;
  onClose: () => void;
  load: () => Promise<Revision[]>;
  restore: (revId: string) => Promise<unknown>;
  onRestored: () => void;
}) {
  const confirm = useConfirm();
  const { data, loading } = useAsync(() => (open ? load() : Promise.resolve([])), [open]);
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <Drawer open={open} onClose={onClose} title="Historique des versions">
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : !data?.length ? (
        <EmptyState icon={History} title="Aucune version antérieure" description="Une version est conservée automatiquement à chaque enregistrement." />
      ) : (
        <ol className="relative space-y-1 border-l border-slate-200 pl-5">
          {data.map((r) => (
            <li key={r.id} className="relative rounded-lg p-3 transition hover:bg-slate-50">
              <span className="absolute -left-[25px] top-4 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-300 ring-1 ring-slate-200" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{r.title}</p>
                  <p className="text-xs text-slate-500">
                    {fmtDateTime(r.createdAt)} · {timeAgo(r.createdAt)}
                    {r.authorEmail ? ` · ${r.authorEmail}` : ''}
                  </p>
                </div>
                <Button
                  size="sm"
                  icon={RotateCcw}
                  loading={busy === r.id}
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Restaurer cette version ?',
                      message: 'Le contenu actuel sera remplacé. Il reste récupérable dans l’historique.',
                      confirmLabel: 'Restaurer',
                    });
                    if (!ok) return;
                    setBusy(r.id);
                    try {
                      await restore(r.id);
                      toast.success('Version restaurée');
                      onRestored();
                      onClose();
                    } catch (e) {
                      toast.error(errorMessage(e));
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  Restaurer
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Drawer>
  );
}
