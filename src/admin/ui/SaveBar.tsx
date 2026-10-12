import React from 'react';
import type { Blocker } from 'react-router-dom';
import { Button, Kbd } from './primitives';
import { Modal } from './overlays';

/** Barre flottante affichée dès qu'il y a des modifications non enregistrées. */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onReset,
  blocker,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => Promise<boolean> | void;
  onReset: () => void;
  blocker?: Blocker;
}) {
  return (
    <>
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4 transition-all duration-200 lg:pl-64 ${
          dirty ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-4 rounded-2xl bg-navy-900 py-2 pl-5 pr-2 text-white shadow-2xl ring-1 ring-white/10">
          <span className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            Modifications non enregistrées
            <span className="hidden text-slate-400 sm:inline">
              · <Kbd>Ctrl</Kbd> + <Kbd>S</Kbd>
            </span>
          </span>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={onReset} disabled={saving}>
            Annuler
          </Button>
          <Button variant="secondary" size="sm" loading={saving} onClick={() => void onSave()}>
            Enregistrer
          </Button>
        </div>
      </div>

      {blocker ? (
        <Modal
          open={blocker.state === 'blocked'}
          onClose={() => blocker.reset?.()}
          size="sm"
          title="Quitter sans enregistrer ?"
          footer={
            <>
              <Button onClick={() => blocker.proceed?.()}>Quitter sans enregistrer</Button>
              <Button
                variant="primary"
                loading={saving}
                onClick={async () => {
                  const ok = await onSave();
                  if (ok !== false) blocker.proceed?.();
                }}
              >
                Enregistrer et quitter
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">Vos modifications sur cette page seront perdues si vous la quittez maintenant.</p>
        </Modal>
      ) : null}
    </>
  );
}
