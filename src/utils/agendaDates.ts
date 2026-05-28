// src/utils/agendaDates.ts
// Helpers de formatage et regroupement de dates pour l'agenda.
// Repose sur Intl.DateTimeFormat (natif JS, pas de lib externe).

const LOCALE = 'fr-FR';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function diffDays(a: Date, b: Date): number {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Catégorise une date par rapport à maintenant pour les sections
 * de la liste : "Aujourd'hui", "Demain", "Cette semaine", "Plus tard".
 */
export function bucketFor(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const days = diffDays(d, now);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  if (days < 7) return 'Cette semaine';
  return 'Plus tard';
}

/** Formate une heure : "14:30" */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** Formate une date complète : "vendredi 30 mai" */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));
}

/** Formate date + heure : "vendredi 30 mai à 14:30" */
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} à ${formatTime(iso)}`;
}

/** Formate une durée en minutes : "1 h 30" ou "45 min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m.toString().padStart(2, '0')}`;
}

/**
 * Groupe les événements en sections pour le SectionList.
 * Ordre fixe : Aujourd'hui → Demain → Cette semaine → Plus tard.
 */
export function groupBySection<T extends { starts_at: string }>(
  events: T[]
): Array<{ title: string; data: T[] }> {
  const order = ["Aujourd'hui", 'Demain', 'Cette semaine', 'Plus tard'];
  const map = new Map<string, T[]>();
  for (const ev of events) {
    const key = bucketFor(ev.starts_at);
    const arr = map.get(key) ?? [];
    arr.push(ev);
    map.set(key, arr);
  }
  return order
    .filter(k => map.has(k))
    .map(title => ({ title, data: map.get(title)! }));
}

/** Ajoute N minutes à un ISO datetime. Retourne un ISO. */
export function addMinutesIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}
