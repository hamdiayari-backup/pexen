/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
/** Liens à usage unique (invitation, réinitialisation du mot de passe). Seule l'empreinte est stockée. */
import { and, eq, gt, isNull, lt, or } from 'drizzle-orm';
import { db } from '../db/client';
import { authTokens } from '../db/schema';
import { randomToken, sha256 } from './secrets';

export type AuthTokenKind = 'invite' | 'reset';

export const TOKEN_TTL: Record<AuthTokenKind, number> = {
  invite: 7 * 86400_000,
  reset: 60 * 60_000,
};

/** Crée un lien et invalide les précédents du même type pour ce compte. */
export async function issueAuthToken(userId: string, kind: AuthTokenKind, createdBy?: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + TOKEN_TTL[kind]);
  await db.transaction(async (tx) => {
    await tx
      .update(authTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(authTokens.userId, userId), eq(authTokens.kind, kind), isNull(authTokens.usedAt)));
    await tx.insert(authTokens).values({ id: sha256(token), userId, kind, expiresAt, createdBy });
  });
  return { token, expiresAt };
}

export async function findAuthToken(token: string) {
  if (!token || token.length > 200) return null;
  const [row] = await db
    .select()
    .from(authTokens)
    .where(and(eq(authTokens.id, sha256(token)), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

/** Marque le jeton comme utilisé ; `false` s'il l'était déjà (deux onglets simultanés). */
export async function consumeAuthToken(token: string): Promise<boolean> {
  const rows = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.id, sha256(token)), isNull(authTokens.usedAt)))
    .returning({ id: authTokens.id });
  return rows.length > 0;
}

export async function revokeAuthTokens(userId: string) {
  await db.update(authTokens).set({ usedAt: new Date() }).where(and(eq(authTokens.userId, userId), isNull(authTokens.usedAt)));
}

export async function pendingInvite(userId: string) {
  const [row] = await db
    .select({ expiresAt: authTokens.expiresAt })
    .from(authTokens)
    .where(and(eq(authTokens.userId, userId), eq(authTokens.kind, 'invite'), isNull(authTokens.usedAt)))
    .limit(1);
  return row ?? null;
}

export async function purgeAuthTokens(): Promise<number> {
  const limit = new Date(Date.now() - 30 * 86400_000);
  const rows = await db
    .delete(authTokens)
    .where(or(lt(authTokens.expiresAt, limit), lt(authTokens.usedAt, limit)))
    .returning({ id: authTokens.id });
  return rows.length;
}
