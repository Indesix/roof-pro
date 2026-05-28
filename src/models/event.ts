// src/models/event.ts
// Types de domaine du module Agenda.
// La table en base s'appelle `appointments` (schéma du prof, lib/db.ts).
// On garde le mot "Event" côté code TS pour la lisibilité.

/**
 * Un rendez-vous tel qu'il est stocké dans la table `appointments`.
 *
 * - starts_at / ends_at : ISO 8601 (TEXT en SQLite, tri lexicographique
 *   = tri chronologique)
 * - client_id : NOT NULL (un RDV est toujours rattaché à un client)
 * - quote_id : optionnel, ON DELETE SET NULL (le RDV survit à la
 *   suppression du devis)
 * - google_event_id : prévu par le prof pour une future synchro
 *   Google Calendar — on ne s'en sert pas dans la v1 du module
 */
export interface Event {
  id: number;
  client_id: number;
  quote_id: number | null;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  notes: string | null;
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Vue enrichie renvoyée par les requêtes avec LEFT JOIN sur clients
 * et quotes. Les champs client_* sont toujours remplis (client_id est
 * NOT NULL côté schéma) ; les champs quote_* peuvent être NULL si
 * aucun devis n'est lié.
 */
export interface EventWithRelations extends Event {
  client_first_name: string;
  client_last_name: string;
  client_phone: string | null;
  client_address: string | null;
  client_city: string | null;
  client_postal_code: string | null;
  quote_number: string | null;
  quote_title: string | null;
}

/** Helper d'affichage : "Prénom Nom" du client lié. */
export function getClientFullName(e: EventWithRelations): string {
  return `${e.client_first_name} ${e.client_last_name}`.trim();
}

/** Durée du RDV en minutes, calculée à partir de starts_at et ends_at. */
export function getDurationMinutes(e: Pick<Event, 'starts_at' | 'ends_at'>): number {
  const start = new Date(e.starts_at).getTime();
  const end = new Date(e.ends_at).getTime();
  return Math.max(0, Math.round((end - start) / 60_000));
}
