// src/models/chantier.ts
// Types de domaine du module Chantiers (table `chantiers` + `chantier_photos`).

export type ChantierStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/** Libellés français pour l'UI — alignés sur les valeurs CHECK de la base. */
export const CHANTIER_STATUS_LABEL: Record<ChantierStatus, string> = {
  planned: 'Planifié',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

/** Couleurs cohérentes avec le Design System des autres modules. */
export const CHANTIER_STATUS_COLOR: Record<ChantierStatus, string> = {
  planned: '#6B7280',     // gris
  in_progress: '#2563EB', // bleu
  completed: '#16A34A',   // vert
  cancelled: '#B91C1C',   // rouge
};

/**
 * Un chantier tel qu'il est stocké en base.
 * - quote_id NOT NULL UNIQUE : un chantier est toujours issu d'un devis,
 *   et un devis ne peut donner qu'un seul chantier
 * - status : 4 valeurs autorisées par contrainte CHECK
 */
export interface Chantier {
  id: number;
  quote_id: number;
  client_id: number;
  status: ChantierStatus;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  client_signature: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Vue enrichie : un chantier + les infos du client et du devis liés.
 * Les deux JOINs sont des INNER JOIN car les FK sont NOT NULL.
 */
export interface ChantierWithRelations extends Chantier {
  client_first_name: string;
  client_last_name: string;
  client_phone: string | null;
  client_address: string | null;
  client_city: string | null;
  client_postal_code: string | null;
  quote_number: string;
  quote_title: string;
  quote_total: number;
  photo_count: number;
}

/** Une photo de chantier, stockée en base avec son URI local. */
export interface ChantierPhoto {
  id: number;
  chantier_id: number;
  uri: string;
  caption: string | null;
  created_at: string;
}

/** Helper d'affichage : "Prénom Nom" du client lié. */
export function getClientFullName(c: ChantierWithRelations): string {
  return `${c.client_first_name} ${c.client_last_name}`.trim();
}
