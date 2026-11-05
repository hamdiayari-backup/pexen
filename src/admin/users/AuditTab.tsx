/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React, { useState } from 'react';
import { Download, RefreshCw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { api, type RoleRow } from '../lib/api';
import { AUDIT_CATEGORIES } from '../lib/audit';
import { errorMessage, useAsync, useDebounced } from '../lib/hooks';
import { Button, Card, ErrorState, Input, Select } from '../ui/primitives';
import { usePaging } from '../ui/Pagination';
import { ActivityFeed } from './shared';

export function AuditTab({ roles }: { roles: RoleRow[] | null }) {
  const { can } = useAuth();
  const [q, setQ] = useState('');
  const term = useDebounced(q, 300).trim();
  const [action, setAction] = useState('');
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const users = useAsync(() => (can('users.view') ? api.users() : Promise.resolve([])), []);

  const filters = { q: term, action, userId, from, to };
  const key = JSON.stringify(filters);
  const { page, setPage, pageSize, setPageSize } = usePaging('audit', { defaultSize: 50, resetKey: key });
  const log = useAsync(() => api.audit({ ...filters, page, pageSize }), [key, page, pageSize]);
  const active = !!(q || action || userId || from || to);
  const roleName = (id: string) => roles?.find((r) => r.id === id)?.name ?? id;

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await api.auditExport(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journal-activite-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card padded={false}>
      <div className="flex flex-col gap-2 border-b border-slate-100 p-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="E-mail, cible, adresse IP…" className="pl-9" />
        </div>
        <Select value={action} onChange={setAction} className="lg:w-52" options={AUDIT_CATEGORIES} />
        {users.data && users.data.length ? (
          <Select
            value={userId}
            onChange={setUserId}
            className="lg:w-48"
            options={[{ value: '', label: 'Tous les utilisateurs' }, ...users.data.map((u) => ({ value: u.id, label: u.name }))]}
          />
        ) : null}
        <div className="flex items-center gap-1.5">
          <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="w-[140px]" aria-label="Du" />
          <span className="text-slate-400">→</span>
          <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="w-[140px]" aria-label="Au" />
        </div>
        <div className="flex gap-1.5">
          {active ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Effacer les filtres"
              onClick={() => {
                setQ('');
                setAction('');
                setUserId('');
                setFrom('');
                setTo('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" aria-label="Actualiser" onClick={() => void log.reload()}>
            <RefreshCw className={log.loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          </Button>
          <Button icon={Download} loading={exporting} onClick={() => void exportCsv()}>
            CSV
          </Button>
        </div>
      </div>
      <div className="px-5 pb-4 pt-1">
        {log.error ? <ErrorState message={log.error} onRetry={() => void log.reload()} /> : <ActivityFeed data={log.data} page={page} onPage={setPage} onPageSize={setPageSize} roleName={roleName} showUser />}
      </div>
    </Card>
  );
}
