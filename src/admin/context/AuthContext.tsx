import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { AdminUser } from '../../../server/cms/types';
import { api, tokenStore, type PublicUser } from '../lib/api';

type Role = AdminUser['role'];

interface AuthState {
  user: PublicUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
  /** Le super administrateur a tous les droits. */
  can: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    api
      .me()
      .then((r) => setUser(r.user))
      .catch(() => tokenStore.set(null))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setUser((u) => {
        if (u) toast.error('Votre session a expiré, veuillez vous reconnecter.');
        return null;
      });
    };
    window.addEventListener('admin:session-expired', onExpired);
    return () => window.removeEventListener('admin:session-expired', onExpired);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.login(email, password);
    tokenStore.set(r.token);
    setUser(r.user);
  }, []);

  const logout = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      login,
      logout,
      setToken: (t) => tokenStore.set(t),
      can: (...roles) => !!user && (user.role === 'superadmin' || roles.includes(user.role)),
    }),
    [user, ready, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth hors AuthProvider');
  return ctx;
}
