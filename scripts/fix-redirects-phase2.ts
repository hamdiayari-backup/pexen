/**
 * Nettoie les redirections inversées et pose les 301 Phase 2.
 */
import 'dotenv/config';
import { updateSnapshot } from '../server/cms/store';
import { pool } from '../server/db/client';

const WANT: [string, string][] = [
  ['/etudes-ingenierie-energetique/', '/expertises/bureau-etudes-fluides/'],
  ['/accompagnement-travaux/', '/expertises/assistance-maitrise-ouvrage/'],
  ['/contrat-de-performance-energetique/', '/expertises/contrat-performance-energetique/'],
  ['/decret-tertiaire-decret-bacs/', '/expertises/financement-cee-reglementation/'],
  ['/estimation-financement/', '/simulateur-prime-cee/'],
  ['/simulateur-cee/', '/simulateur-prime-cee/'],
  ['/solutions/pilotage-gtb-decret-bacs/', '/solutions/gtb-tertiaire-gtc/'],
  ['/secteurs/batiments-collectifs/', '/secteurs/renovation-energetique-copropriete/'],
  ['/expertises/froid-commercial-industriel/', '/solutions/froid-commercial-industriel/'],
  ['/expertises/recuperation-de-chaleur/', '/solutions/recuperation-de-chaleur/'],
  ['/expertises/pompe-a-chaleur-tertiaire/', '/solutions/pompe-a-chaleur-tertiaire/'],
  ['/expertises/gtb-tertiaire-gtc/', '/solutions/gtb-tertiaire-gtc/'],
  ['/expertises/isolation-technique/', '/solutions/isolation-technique/'],
  ['/partenaires/', '/notre-approche/#partenaires'],
];

/** Anciennes URLs « expertises = hub solutions » → ne plus rediriger /expertises/ vers /solutions/ */
const DROP_FROM = new Set([
  '/expertises/',
  '/expertises/financement-cee-reglementation/',
  '/expertises/assistance-maitrise-ouvrage/',
  '/expertises/contrat-performance-energetique/',
  '/expertises/bureau-etudes-fluides/',
  '/solutions/gtb-tertiaire-gtc/',
  '/secteurs/renovation-energetique-copropriete/',
  '/simulateur-prime-cee/',
]);

const snap = await updateSnapshot((s) => {
  s.redirects = s.redirects.filter((r) => {
    if (DROP_FROM.has(r.from)) return false;
    /* drop reverse of WANT */
    for (const [from, to] of WANT) {
      if (r.from === to && r.to === from) return false;
      if (r.from === to && !to.includes('#')) return false; /* never redirect away from canonical */
    }
    return true;
  });

  for (const [from, to] of WANT) {
    const i = s.redirects.findIndex((r) => r.from === from);
    if (i >= 0) s.redirects[i] = { from, to, permanent: true };
    else s.redirects.push({ from, to, permanent: true });
  }
});

console.log('redirects count', snap.redirects.length);
for (const r of snap.redirects.sort((a, b) => a.from.localeCompare(b.from))) {
  if (
    WANT.some(([f]) => f === r.from) ||
    r.from.includes('expertises') ||
    r.from.includes('gtb') ||
    r.from.includes('batiments') ||
    r.from.includes('renovation') ||
    r.from.includes('partenaires') ||
    r.from.includes('estimation') ||
    r.from.includes('simulateur') ||
    r.from.includes('etudes') ||
    r.from.includes('accompagnement') ||
    r.from.includes('contrat') ||
    r.from.includes('decret')
  ) {
    console.log(`${r.from} → ${r.to}`);
  }
}
await pool.end();
