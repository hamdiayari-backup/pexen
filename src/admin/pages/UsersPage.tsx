/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { Button, PageHeader, Tabs } from '../ui/primitives';
import { AuditTab } from '../users/AuditTab';
import { RolesTab } from '../users/RolesTab';
import { UsersTab } from '../users/UsersTab';

type TabId = 'users' | 'roles' | 'audit';

export default function UsersPage() {
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const roles = useAsync(() => api.roles(), []);
  const [inviteOpen, setInviteOpen] = useState(false);

  const tabs = [
    ...(can('users.view') ? [{ value: 'users' as const, label: 'Utilisateurs', icon: Users }, { value: 'roles' as const, label: 'Rôles et droits', icon: ShieldCheck }] : []),
    ...(can('audit.view') ? [{ value: 'audit' as const, label: 'Journal d’activité', icon: History }] : []),
  ];
  const requested = params.get('tab') as TabId | null;
  const tab: TabId = tabs.some((t) => t.value === requested) ? requested! : (tabs[0]?.value ?? 'users');
  const setTab = (t: TabId) => setParams(t === tabs[0]?.value ? {} : { tab: t }, { replace: true });
  useEffect(() => {
    if (tab === 'roles') void roles.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div>
      <PageHeader
        title="Utilisateurs et accès"
        description="Comptes de l’équipe, rôles et droits, historique des actions sensibles."
        actions={
          tab === 'users' && can('users.manage') ? (
            <Button variant="primary" icon={UserPlus} onClick={() => setInviteOpen(true)}>
              Ajouter un utilisateur
            </Button>
          ) : null
        }
      />
      <Tabs<TabId> value={tab} onChange={setTab} tabs={tabs} />
      {tab === 'users' ? <UsersTab roles={roles.data} inviteOpen={inviteOpen} setInviteOpen={setInviteOpen} /> : null}
      {tab === 'roles' ? <RolesTab roles={roles.data} loading={roles.loading} reload={() => void roles.reload()} /> : null}
      {tab === 'audit' ? <AuditTab roles={roles.data} /> : null}
    </div>
  );
}
