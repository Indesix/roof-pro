// src/models/client.ts
// Type d'une ligne de la table `clients`, ALIGNÉ sur le schéma SQL réel
// défini dans src/lib/db.ts (Jour 1). On colle aux colonnes (snake_case)
// pour que getAllAsync<Client> mappe directement.

// Statuts autorisés — DOIVENT correspondre au CHECK de la table :
//   CHECK (status IN ('lead', 'active', 'archived'))
//   'lead'     → prospect pas encore converti (onglet Leads)
//   'active'   → client avec activité
//   'archived' → ancien client
export type ClientStatus = 'lead' | 'active' | 'archived';

export const CLIENT_STATUSES: ClientStatus[] = ['lead', 'active', 'archived'];

// Libellés affichés (séparation donnée / affichage).
export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  lead: 'Lead',
  active: 'Client actif',
  archived: 'Archivé',
};

// Une ligne de la table `clients` (résultat de getAllAsync / getFirstAsync).
export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string; // rempli par DEFAULT (datetime('now')) côté SQLite
  updated_at: string;
}

// Petit helper d'affichage : nom complet "Prénom Nom".
export function clientFullName(c: Client): string {
  return `${c.first_name} ${c.last_name}`.trim();
}
