/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React from 'react';
import { AlertTriangle, KeyRound, Plus, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TagInput } from '../ui/TagInput';
import { Alert, Button, Field, Section, Segmented, Switch } from '../ui/primitives';
import { NumberField, ipInList, isIpRule, type TabProps } from './controls';

const TWO_FACTOR: Record<'optional' | 'superadmins' | 'all', string> = {
  optional: 'Chaque utilisateur choisit d’activer ou non la double authentification depuis son profil.',
  superadmins: 'Les super administrateurs doivent configurer une application d’authentification à leur prochaine connexion.',
  all: 'Tous les comptes doivent configurer une application d’authentification à leur prochaine connexion.',
};

export function SecurityTab({ v, set, meta }: TabProps) {
  const { user, isSuper } = useAuth();
  const sec = v.security;
  const allowlist = sec.adminIpAllowlist;
  const selfBlocked = allowlist.length > 0 && !meta.ipBypass && !ipInList(meta.clientIp, allowlist);
  const twoFaAppliesToMe = sec.twoFactor === 'all' || (sec.twoFactor === 'superadmins' && isSuper);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <Section title="Politique de mots de passe" description="S’applique aux nouveaux mots de passe : création de compte, changement et réinitialisation.">
          <NumberField
            path="security.passwordMinLength"
            label="Longueur minimale"
            suffix="caractères"
            value={sec.passwordMinLength}
            onChange={(passwordMinLength) => set('security', { passwordMinLength })}
            hint="12 caractères ou plus sont recommandés."
          />
          <Switch checked={sec.requireUppercase} onChange={(requireUppercase) => set('security', { requireUppercase })} label="Au moins une majuscule" />
          <Switch checked={sec.requireNumber} onChange={(requireNumber) => set('security', { requireNumber })} label="Au moins un chiffre" />
          <Switch checked={sec.requireSymbol} onChange={(requireSymbol) => set('security', { requireSymbol })} label="Au moins un caractère spécial" />
          <NumberField
            path="security.passwordExpiryDays"
            label="Renouvellement obligatoire"
            suffix="jours"
            value={sec.passwordExpiryDays}
            onChange={(passwordExpiryDays) => set('security', { passwordExpiryDays })}
            hint="0 = jamais. Passé ce délai, l’utilisateur doit choisir un nouveau mot de passe à sa connexion."
          />
          <p className="text-xs leading-relaxed text-slate-500">
            Les mots de passe trop simples (suites courantes, partie de l’adresse e-mail) sont toujours refusés. Ils sont stockés hachés avec scrypt.
          </p>
        </Section>

        <Section title="Sessions" description="Durée de validité des connexions à l’administration.">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField path="security.sessionHours" label="Durée d’une session" suffix="heures" value={sec.sessionHours} onChange={(sessionHours) => set('security', { sessionHours })} />
            <NumberField
              path="security.rememberDays"
              label="Avec « Rester connecté »"
              suffix="jours"
              value={sec.rememberDays}
              onChange={(rememberDays) => set('security', { rememberDays })}
            />
          </div>
          <NumberField
            path="security.idleMinutes"
            label="Déconnexion après inactivité"
            suffix="minutes"
            value={sec.idleMinutes}
            onChange={(idleMinutes) => set('security', { idleMinutes })}
            hint="0 = désactivé. Contrôlé par le serveur : une session inactive est refusée même si l’onglet reste ouvert."
          />
        </Section>

        <Section title="Protection contre les attaques par force brute">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              path="security.maxLoginAttempts"
              label="Tentatives avant blocage"
              value={sec.maxLoginAttempts}
              onChange={(maxLoginAttempts) => set('security', { maxLoginAttempts })}
            />
            <NumberField path="security.lockoutMinutes" label="Durée du blocage" suffix="minutes" value={sec.lockoutMinutes} onChange={(lockoutMinutes) => set('security', { lockoutMinutes })} />
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Le compteur s’applique au couple adresse IP / e-mail ; une adresse IP est bloquée au bout de cinq fois plus d’échecs, tous comptes confondus. Les codes de double
            authentification sont limités de la même façon, par compte.
          </p>
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Double authentification (2FA)" description="Code à usage unique généré par une application (Google Authenticator, 1Password, Authy…).">
          <Segmented
            value={sec.twoFactor}
            onChange={(twoFactor) => set('security', { twoFactor })}
            options={[
              { value: 'optional', label: 'Facultative' },
              { value: 'superadmins', label: 'Super administrateurs' },
              { value: 'all', label: 'Tous les comptes' },
            ]}
          />
          <p className="text-[13px] leading-relaxed text-slate-600">{TWO_FACTOR[sec.twoFactor]}</p>
          {twoFaAppliesToMe && !user?.totpEnabled ? (
            <Alert
              tone="warning"
              icon={AlertTriangle}
              title="Activez d’abord la 2FA sur votre compte"
              action={
                <Link to="/profile?tab=security">
                  <Button size="sm" icon={KeyRound}>
                    Configurer
                  </Button>
                </Link>
              }
            >
              Cette règle vous concerne : l’enregistrement sera refusé tant que votre propre compte n’est pas protégé.
            </Alert>
          ) : null}
        </Section>

        <Section title="Accès à l’administration par adresse IP" description="Si la liste n’est pas vide, seules ces adresses (ou plages CIDR) peuvent se connecter et utiliser l’administration.">
          <Field label="Adresses autorisées" hint="Exemples : 196.203.12.4, 10.0.0.0/8, 2001:db8::/32. Liste vide = aucune restriction.">
            <TagInput value={allowlist} onChange={(adminIpAllowlist) => set('security', { adminIpAllowlist })} validate={isIpRule} placeholder="Adresse IP ou plage CIDR" />
          </Field>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-500">
            Votre adresse actuelle : <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{meta.clientIp}</code>
            {!allowlist.includes(meta.clientIp) ? (
              <Button size="sm" variant="ghost" icon={Plus} onClick={() => set('security', { adminIpAllowlist: [...allowlist, meta.clientIp] })}>
                Ajouter mon adresse
              </Button>
            ) : null}
          </div>
          {selfBlocked ? (
            <Alert tone="danger" icon={AlertTriangle} title="Vous perdriez l’accès">
              Votre adresse actuelle n’est pas couverte par la liste : l’enregistrement sera refusé.
            </Alert>
          ) : null}
          {meta.ipBypass ? (
            <Alert tone="info">
              Restriction suspendue par la variable <code className="font-mono text-xs">PEXEN_ADMIN_IP_BYPASS=true</code> (procédure de secours).
            </Alert>
          ) : (
            <p className="text-xs leading-relaxed text-slate-500">
              En cas de blocage, définissez <code className="font-mono">PEXEN_ADMIN_IP_BYPASS=true</code> dans le fichier .env du serveur puis redémarrez-le.
            </p>
          )}
        </Section>

        <Section title="En-têtes et chiffrement">
          <Switch
            checked={sec.hsts}
            onChange={(hsts) => set('security', { hsts })}
            label="HSTS (Strict-Transport-Security)"
            description="Impose HTTPS aux navigateurs pendant un an. N’activez qu’une fois le certificat HTTPS installé de manière durable."
          />
          {meta.dedicatedSecretKey === false ? (
            <Alert tone="warning" icon={ShieldCheck} title="Clé de chiffrement dédiée recommandée">
              Les secrets (mot de passe SMTP…) sont chiffrés avec la clé des sessions. Définissez <code className="font-mono text-xs">PEXEN_SECRET_KEY</code> dans le fichier .env pour les séparer.
            </Alert>
          ) : meta.dedicatedSecretKey ? (
            <Alert tone="success" icon={ShieldCheck}>
              Les secrets sont chiffrés avec une clé dédiée (PEXEN_SECRET_KEY).
            </Alert>
          ) : null}
        </Section>
      </div>
    </div>
  );
}
