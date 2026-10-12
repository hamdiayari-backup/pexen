import type { AiAssistantConfig } from './cms/types';

interface IpDay {
  sessions: number;
  messages: number;
}

let day = todayKey();
let perIp = new Map<string, IpDay>();
let usage = { requests: 0, sessions: 0, tokens: 0, blocked: 0 };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Les compteurs sont journaliers : on repart de zéro à chaque changement de date. */
function rollDay() {
  const today = todayKey();
  if (today !== day) {
    day = today;
    perIp = new Map();
    usage = { requests: 0, sessions: 0, tokens: 0, blocked: 0 };
  }
}

/**
 * Une conversation (session) commence lorsque l'historique est vide.
 * Le nombre de messages par IP est plafonné à sessions × messages par session.
 */
export function checkAiRateLimit(ip: string, config: AiAssistantConfig, isNewSession: boolean): { ok: true } | { ok: false; reason: string } {
  rollDay();
  if (config.maxTokensPerDayGlobal > 0 && usage.tokens >= config.maxTokensPerDayGlobal) {
    usage.blocked++;
    return { ok: false, reason: 'L’assistant a atteint son quota du jour. Contactez-nous directement, nous vous répondrons rapidement.' };
  }
  const row = perIp.get(ip) || { sessions: 0, messages: 0 };
  if (isNewSession && row.sessions >= config.maxSessionsPerDayPerIp) {
    usage.blocked++;
    return { ok: false, reason: 'Nombre maximal de conversations atteint pour aujourd’hui.' };
  }
  if (row.messages >= config.maxSessionsPerDayPerIp * config.maxMessagesPerSession) {
    usage.blocked++;
    return { ok: false, reason: 'Limite quotidienne de messages atteinte.' };
  }
  if (isNewSession || row.sessions === 0) {
    row.sessions++;
    usage.sessions++;
  }
  row.messages++;
  usage.requests++;
  perIp.set(ip, row);
  return { ok: true };
}

export function recordAiUsage(tokens: number) {
  rollDay();
  usage.tokens += Math.max(0, tokens || 0);
}

export function aiUsageToday() {
  rollDay();
  return { date: day, ...usage, uniqueIps: perIp.size };
}
