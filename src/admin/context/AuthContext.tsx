/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api, tokenStore, type MeUser, type Permission } from '../lib/api';

type LoginOutcome = { twoFactor: false } | { twoFactor: true; challenge: string };

interface AuthState {
  user: MeUser | null;
  ready: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<LoginOutcome>;
  verify2fa: (challenge: string, code: string) => Promise<void>;
  logout: (message?: string) => Promise<void>;
  /** Remplace le jeton (changement de mot de passe) et éventuellement l'utilisateur. */
  setSession: (token: string, user?: MeUser) => void;
  setUser: (user: MeUser) => void;
  refresh: () => Promise<void>;
  /** Vrai si l'utilisateur possède au moins une des permissions (le super administrateur les a toutes). */
  can: (...perms: Array<Permission | string>) => boolean;
  isSuper: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return;
    try {
      setUser((await api.me()).user);
    } catch {
      /* 401 : géré par l'événement admin:session-expired */
    }
  }, []);

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
    const onExpired = (e: Event) => {
      const reason = (e as CustomEvent<string | undefined>).detail;
      setUser((u) => {
        if (u) toast.error(reason && reason !== 'Session expirée' ? `${reason} : reconnectez-vous.` : 'Votre session a expiré, veuillez vous reconnecter.');
        return null;
      });
    };
    const onRequirements = () => void refresh();
    window.addEventListener('admin:session-expired', onExpired);
    window.addEventListener('admin:requirements', onRequirements);
    return () => {
      window.removeEventListener('admin:session-expired', onExpired);
      window.removeEventListener('admin:requirements', onRequirements);
    };
  }, [refresh]);

  const login = useCallback(async (email: string, password: string, remember: boolean): Promise<LoginOutcome> => {
    const r = await api.login(email, password, remember);
    if ('twoFactor' in r) return { twoFactor: true, challenge: r.challenge };
    tokenStore.set(r.token);
    setUser(r.user);
    return { twoFactor: false };
  }, []);

  const verify2fa = useCallback(async (challenge: string, code: string) => {
    const r = await api.login2fa(challenge, code);
    tokenStore.set(r.token);
    setUser(r.user);
  }, []);

  const logout = useCallback(async (message?: string) => {
    if (tokenStore.get()) await api.logout().catch(() => undefined);
    tokenStore.set(null);
    setUser(null);
    if (message) toast.info(message);
  }, []);

  /* Déconnexion après inactivité : l'activité locale prolonge aussi la session côté serveur. */
  const idleMinutes = user?.policy.idleMinutes ?? 0;
  const lastActivity = useRef(Date.now());
  const lastPing = useRef(Date.now());
  useEffect(() => {
    if (!user || idleMinutes <= 0) return;
    lastActivity.current = Date.now();
    const mark = () => {
      lastActivity.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, mark, { passive: true }));
    const timer = window.setInterval(() => {
      const now = Date.now();
      if (now - lastActivity.current > idleMinutes * 60_000) {
        void logout(`Déconnexion automatique après ${idleMinutes} min d’inactivité.`);
      } else if (now - lastActivity.current < 60_000 && now - lastPing.current > 60_000) {
        lastPing.current = now;
        void api.me().catch(() => undefined);
      }
    }, 15_000);
    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, mark));
      window.clearInterval(timer);
    };
  }, [user, idleMinutes, logout]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      login,
      verify2fa,
      logout,
      setSession: (t, u) => {
        tokenStore.set(t);
        if (u) setUser(u);
      },
      setUser,
      refresh,
      can: (...perms) => {
        if (!user) return false;
        if (user.isSuper) return true;
        if (perms.length === 0) return true;
        const legacy: Record<string, boolean> = {
          editor: user.permissions.some((p) =>
            ['pages.edit', 'posts.edit', 'media.upload', 'menus.edit', 'forms.manage', 'newsletter.manage', 'engagement.edit', 'appearance.customize', 'site.general'].includes(p)
          ),
          seo: user.permissions.includes('seo.edit'),
          viewer: true,
          superadmin: user.isSuper,
        };
        return perms.some((p) => user.permissions.includes(p as Permission) || !!legacy[p]);
      },
      isSuper: !!user?.isSuper,
    }),
    [user, ready, login, verify2fa, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth hors AuthProvider');
  return ctx;
}
