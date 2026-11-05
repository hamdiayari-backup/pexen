import React, { useEffect, useMemo, useState } from 'react';
import type { ContactFormConfig, ContactFormField } from '../../server/cms/types';
import type { SimulatorData } from '../../server/cms/blocks';
import { estimateCeeRange, formatEur, mergeSimulatorData } from '../../server/cms/ceeDefaults';
import { IS_PREVIEW } from '../preview';

const PHONE_FR_RE = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PublicForm = Omit<ContactFormConfig, 'recipientEmails'>;

interface SimulatorProps {
  config?: Partial<SimulatorData> | null;
  onNavigate?: (path: string) => void;
  onNavigateToContact?: () => void;
}

const STEPS = [
  { n: 1, label: 'Votre site' },
  { n: 2, label: 'Travaux' },
  { n: 3, label: 'Votre demande' },
];

function pickField(fields: ContactFormField[], tests: ((f: ContactFormField) => boolean)[]) {
  for (const test of tests) {
    const f = fields.find(test);
    if (f) return f;
  }
  return undefined;
}

function matchOption(options: string[] | undefined, needle: string): string {
  if (!options?.length) return needle;
  const n = needle.toLowerCase();
  const hit = options.find((o) => o.toLowerCase().includes(n) || n.includes(o.toLowerCase()));
  if (hit) return hit;
  if (/industriel|industrie/.test(n)) return options.find((o) => /industrie/i.test(o)) || options[0];
  if (/collectif|résidentiel|residentiel/.test(n)) return options.find((o) => /collectif/i.test(o)) || options[0];
  return options.find((o) => /tertiaire/i.test(o)) || options[0];
}

export const CeeSimulator: React.FC<SimulatorProps> = ({ config, onNavigate, onNavigateToContact }) => {
  const d = mergeSimulatorData(config);
  const [step, setStep] = useState(1);
  const [siteTypeId, setSiteTypeId] = useState(d.siteTypes[0]?.id || '');
  const [regionId, setRegionId] = useState(d.regions[0]?.id || '');
  const [surface, setSurface] = useState(2000);
  const [operationIds, setOperationIds] = useState<string[]>([]);
  const [energyId, setEnergyId] = useState(d.energies[0]?.id || '');
  const [powerKw, setPowerKw] = useState<string>('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rgpd, setRgpd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<PublicForm | null>(null);
  const startedRef = React.useRef(false);
  const completedRef = React.useRef(false);

  const formId = d.formId || 'contact-main';
  const privacyPath = d.privacyPath || '/politique-de-confidentialite/';

  const track = (name: string, extra?: Record<string, string>) => {
    try {
      const saved = localStorage.getItem('pexen_cookie_consent');
      if (!saved) return;
      const parsed = JSON.parse(saved) as { analytics?: boolean };
      if (!parsed.analytics) return;
      const w = window as Window & { gtag?: (...args: unknown[]) => void };
      w.gtag?.('event', name, { page: window.location.pathname, ...extra });
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    let alive = true;
    fetch(`/api/public/forms/${encodeURIComponent(formId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PublicForm | null) => {
        if (alive && data) setForm(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [formId]);

  const range = useMemo(
    () =>
      estimateCeeRange({
        siteTypes: d.siteTypes,
        regions: d.regions,
        operations: d.operations,
        energies: d.energies,
        siteTypeId,
        regionId,
        operationIds,
        energyId,
        surfaceM2: surface,
        powerKw: Number(powerKw) || 0,
      }),
    [d.siteTypes, d.regions, d.operations, d.energies, siteTypeId, regionId, operationIds, energyId, surface, powerKw]
  );

  const siteLabel = d.siteTypes.find((s) => s.id === siteTypeId)?.label || '';
  const regionLabel = d.regions.find((r) => r.id === regionId)?.label || '';
  const energyLabel = d.energies.find((e) => e.id === energyId)?.label || '';
  const opsLabel = d.operations.filter((o) => operationIds.includes(o.id)).map((o) => o.label).join(', ');

  const toggleOp = (id: string) => {
    setOperationIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  useEffect(() => {
    if (range && !completedRef.current) {
      completedRef.current = true;
      track('estimation_complete', { type_site: siteLabel });
    }
  }, [range, siteLabel]);

  const go = (path: string) => {
    if (onNavigate) onNavigate(path);
    else onNavigateToContact?.();
  };

  const canStep1 = !!siteTypeId && !!regionId && surface >= 50;
  const canStep2 = operationIds.length > 0 && !!energyId;

  const validateContact = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Indiquez votre nom et prénom.';
    if (!company.trim()) next.company = 'Indiquez le nom de votre société.';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Indiquez une adresse e-mail professionnelle valide.';
    if (!PHONE_FR_RE.test(phone.trim())) next.phone = 'Indiquez un numéro de téléphone valide.';
    if (!rgpd) next.rgpd = 'Votre accord est nécessaire pour traiter votre demande.';
    return next;
  };

  const buildPayload = (fields: ContactFormField[]) => {
    const estimateLine = range
      ? `${d.resultPrefix || 'Financement estimé'} : entre ${formatEur(range.min)} et ${formatEur(range.max)}`
      : 'Fourchette non calculée';
    const message = [
      'Demande depuis le calculateur de financement.',
      `Type de site : ${siteLabel}`,
      `Région : ${regionLabel}`,
      `Surface chauffée : ${surface.toLocaleString('fr-FR')} m²`,
      energyLabel ? `Énergie de chauffage actuelle : ${energyLabel}` : '',
      opsLabel ? `Travaux envisagés : ${opsLabel}` : '',
      powerKw ? `Puissance concernée : ${powerKw} kW` : '',
      estimateLine,
    ]
      .filter(Boolean)
      .join('\n');

    const profilFallback = /collectif/i.test(siteLabel)
      ? 'Bailleur, syndic ou gestionnaire de bâtiments collectifs'
      : 'Entreprise ou gestionnaire de site';
    const payload: Record<string, unknown> = {
      source: 'calculateur-financement',
      nomPrenom: name.trim(),
      societe: company.trim(),
      email: email.trim(),
      telephone: phone.trim(),
      rgpdAccepted: true,
      projet: message,
      typeSite: matchOption(['Industrie', 'Tertiaire', 'Bâtiment collectif'], siteLabel),
      vousEtes: profilFallback,
      type_de_site_libre: siteLabel,
      region: regionLabel,
      surface_m2: String(surface),
      travaux: opsLabel,
      energie_chauffage: energyLabel,
      puissance_kw: powerKw || '',
      estimation: estimateLine,
      message,
    };

    const nameF = pickField(fields, [(f) => /nom|prenom/i.test(f.name) || /nom/i.test(f.label), (f) => f.type === 'text' && f.required]);
    const companyF = pickField(fields, [(f) => /societe|entreprise/i.test(`${f.name} ${f.label}`)]);
    const emailF = pickField(fields, [(f) => f.type === 'email']);
    const telF = pickField(fields, [(f) => f.type === 'tel']);
    const rgpdF = pickField(fields, [(f) => f.type === 'checkbox' && f.required, (f) => f.type === 'checkbox']);
    const msgF = pickField(fields, [(f) => f.type === 'textarea']);
    const siteF = pickField(fields, [(f) => /type.*site|typologie/i.test(`${f.name} ${f.label}`)]);
    const profilF = pickField(fields, [(f) => /vous.?etes|profil/i.test(`${f.name} ${f.label}`)]);

    if (nameF) payload[nameF.name] = name.trim();
    if (companyF) payload[companyF.name] = company.trim();
    if (emailF) payload[emailF.name] = email.trim();
    if (telF) payload[telF.name] = phone.trim();
    if (rgpdF) payload[rgpdF.name] = true;
    if (msgF) payload[msgF.name] = message;
    if (siteF) payload[siteF.name] = matchOption(siteF.options, siteLabel);
    if (profilF) {
      const opts = profilF.options || [];
      payload[profilF.name] =
        /collectif/i.test(siteLabel) && opts.find((o) => /syndic|collectif/i.test(o))
          ? opts.find((o) => /syndic|collectif/i.test(o))!
          : opts[0] || profilFallback;
    }

    const honeypot = form?.honeypotField || 'website_url';
    payload[honeypot] = '';
    return payload;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validateContact();
    setErrors(next);
    setStatus(null);
    if (Object.keys(next).length) {
      setStatus({ kind: 'err', text: Object.values(next)[0] });
      return;
    }
    if (IS_PREVIEW) {
      setStatus({ kind: 'ok', text: 'Aperçu : la demande n’est pas envoyée depuis le backoffice.' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload(form?.fields || []);
      const res = await fetch(`/api/public/forms/${encodeURIComponent(formId)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { redirect?: string };
        track('generate_lead', { profil: String(payload.vousEtes || ''), type_site: siteLabel, source: 'estimation' });
        track('lead_envoye', { profil: String(payload.vousEtes || ''), type_site: siteLabel, source: 'estimation' });
        setStatus({
          kind: 'ok',
          text: 'Merci, votre demande a bien été envoyée. Elle sera traitée dans les meilleurs délais par un ingénieur PEXEN.',
        });
        window.setTimeout(() => go(data.redirect || form?.successPath || '/contact/merci/'), 1100);
      } else {
        const err = (await res.json().catch(() => null)) as { error?: string; fields?: Record<string, string> } | null;
        setStatus({
          kind: 'err',
          text:
            res.status === 429
              ? 'Trop de demandes envoyées. Merci de patienter quelques minutes ou de nous appeler.'
              : err?.error || 'L’envoi a échoué. Merci de réessayer ou de nous appeler.',
        });
      }
    } catch {
      setStatus({ kind: 'err', text: 'Connexion impossible. Vérifiez votre réseau puis réessayez.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-cee">
      <ol className="px-cee__steps" aria-label="Étapes de l’estimation">
        {STEPS.map((s) => (
          <li key={s.n} className={step === s.n ? 'is-active' : step > s.n ? 'is-done' : undefined} aria-current={step === s.n ? 'step' : undefined}>
            <span className="px-cee__step-n">{s.n}</span>
            <span className="px-cee__step-l">{s.label}</span>
          </li>
        ))}
      </ol>

      <div className="px-cee__grid">
        <form className="px-cee__form" onSubmit={submit} noValidate>
          {step === 1 ? (
            <fieldset className="px-cee__fieldset">
              <legend>Type de site, surface et région</legend>
              <div className="px-cee__chips" role="list">
                {d.siteTypes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="listitem"
                    className={siteTypeId === s.id ? 'is-on' : undefined}
                    onClick={() => setSiteTypeId(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="px-cee__row">
                <label className="px-cee__field">
                  <span>Surface chauffée (m²)</span>
                  <input
                    className="form-control"
                    type="number"
                    min={50}
                    max={200000}
                    step={50}
                    value={surface}
                    onChange={(e) => setSurface(Math.max(0, Number(e.target.value) || 0))}
                  />
                </label>
                <label className="px-cee__field">
                  <span>Région</span>
                  <select className="form-control" value={regionId} onChange={(e) => setRegionId(e.target.value)}>
                    {d.regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </fieldset>
          ) : null}

          {step === 2 ? (
            <fieldset className="px-cee__fieldset">
              <legend>Travaux envisagés et énergie actuelle</legend>
              <p className="px-cee__hint">Plusieurs choix possibles.</p>
              <div className="px-cee__chips px-cee__chips--ops" role="list">
                {d.operations.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    role="listitem"
                    aria-pressed={operationIds.includes(op.id)}
                    className={operationIds.includes(op.id) ? 'is-on' : undefined}
                    onClick={() => toggleOp(op.id)}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
              <label className="px-cee__field">
                <span>Énergie de chauffage actuelle</span>
                <div className="px-cee__chips" role="list">
                  {d.energies.map((en) => (
                    <button
                      key={en.id}
                      type="button"
                      role="listitem"
                      className={energyId === en.id ? 'is-on' : undefined}
                      onClick={() => setEnergyId(en.id)}
                    >
                      {en.label}
                    </button>
                  ))}
                </div>
              </label>
            </fieldset>
          ) : null}

          {step === 3 ? (
            <fieldset className="px-cee__fieldset">
              <legend>Puissance et coordonnées</legend>
              <label className="px-cee__field">
                <span>Puissance concernée (kW) — facultatif</span>
                <input
                  className="form-control"
                  type="number"
                  min={0}
                  max={50000}
                  step={10}
                  placeholder="Ex. 350"
                  value={powerKw}
                  onChange={(e) => setPowerKw(e.target.value)}
                />
              </label>
              <div className="px-cee__row">
                <label className="px-cee__field">
                  <span>Nom et prénom</span>
                  <input className={`form-control${errors.name ? ' is-invalid' : ''}`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                  {errors.name ? <em>{errors.name}</em> : null}
                </label>
                <label className="px-cee__field">
                  <span>Société</span>
                  <input className={`form-control${errors.company ? ' is-invalid' : ''}`} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
                  {errors.company ? <em>{errors.company}</em> : null}
                </label>
              </div>
              <div className="px-cee__row">
                <label className="px-cee__field">
                  <span>E-mail professionnel</span>
                  <input className={`form-control${errors.email ? ' is-invalid' : ''}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  {errors.email ? <em>{errors.email}</em> : null}
                </label>
                <label className="px-cee__field">
                  <span>Téléphone</span>
                  <input className={`form-control${errors.phone ? ' is-invalid' : ''}`} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                  {errors.phone ? <em>{errors.phone}</em> : null}
                </label>
              </div>
              <label className="px-ultra-rgpd px-cee__rgpd">
                <input type="checkbox" checked={rgpd} onChange={(e) => setRgpd(e.target.checked)} />
                <span>
                  J’accepte que PEXEN utilise ces informations pour répondre à ma demande, conformément à la{' '}
                  <a href={privacyPath} target="_blank" rel="noreferrer">
                    politique de confidentialité
                  </a>
                  .
                </span>
              </label>
              {errors.rgpd ? <em className="px-cee__err">{errors.rgpd}</em> : null}
            </fieldset>
          ) : null}

          {status ? (
            <div className={`px-form-msg ${status.kind === 'ok' ? 'px-form-msg--ok' : 'px-form-msg--err'}`} role={status.kind === 'ok' ? 'status' : 'alert'}>
              {status.text}
            </div>
          ) : null}

          <div className="px-cee__nav">
            {step > 1 ? (
              <button type="button" className="btn btn-outline" onClick={() => setStep((s) => s - 1)}>
                Retour
              </button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={step === 1 ? !canStep1 : !canStep2}
                onClick={() => {
                  if (step === 1 && !startedRef.current) {
                    startedRef.current = true;
                    track('estimation_start', { type_site: siteLabel });
                  }
                  setStep((s) => s + 1);
                }}
              >
                Continuer
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Envoi en cours…' : d.ctaLabel || 'Envoyer ma demande'}
              </button>
            )}
          </div>
          <p className="px-cee__legal">
            <a href="/mentions-legales/" target="_blank" rel="noreferrer">
              Mentions légales
            </a>
          </p>
        </form>

        <aside className="px-cee__result" aria-live="polite">
          <p className="px-cee__result-k">{d.resultPrefix || 'Financement estimé'}</p>
          {range ? (
            <p className="px-cee__result-v">
              entre
              <span className="px-cee__result-amt">
                {formatEur(range.min)} et {formatEur(range.max)}
                <sup>*</sup>
              </span>
            </p>
          ) : (
            <p className="px-cee__result-ph">Renseignez le site et les travaux pour obtenir une fourchette.</p>
          )}
          {d.resultNote ? <p className="px-cee__result-n">{d.resultNote}</p> : null}
          {d.disclaimer ? <p className="px-cee__disc">{d.disclaimer}</p> : null}
        </aside>
      </div>
    </div>
  );
};
