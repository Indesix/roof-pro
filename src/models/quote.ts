// src/models/quote.ts
// Types des tables `quotes` (en-tête du devis) et `quote_lines` (les lignes),
// ALIGNÉS sur le schéma SQL réel défini dans src/lib/db.ts (Jour 1).
// Colonnes en snake_case pour que getAllAsync<Quote> mappe directement.
//
// Un devis = 1 en-tête (client, numéro, statut, totaux) + N lignes.
// On a donc DEUX types dans ce fichier, comme deux tables liées.
//
// CHOIX MÉTIER (cf. rapport) : la main d'œuvre et le déplacement sont saisis
// comme des LIGNES normales (le catalogue a déjà les unités `h` et `forfait`),
// exactement comme dans les vrais logiciels de devis. Les colonnes labor_cost
// et travel_cost de la table restent donc à 0 au MVP (écart assumé, comme
// category/image_uri au Jour 4 : la colonne existe, prête pour plus tard).

import { formatPrice } from './product';

// On ré-exporte formatPrice pour que les écrans Devis puissent l'importer
// depuis ce modèle sans connaître product.ts. Source unique, pas de doublon.
export { formatPrice };

// --- En-tête du devis : table `quotes` -------------------------------------

export interface Quote {
  id: number;
  client_id: number;          // FK vers clients (RESTRICT : on ne supprime pas un client qui a des devis)
  quote_number: string;       // ex: "DEV-2026-001" (UNIQUE)
  title: string | null;
  status: QuoteStatus;        // draft | sent | accepted | refused
  labor_cost: number;         // 0 au MVP (main d'œuvre gérée en lignes)
  travel_cost: number;        // 0 au MVP (déplacement géré en lignes)
  subtotal: number;           // total HT = somme des lignes
  vat_rate: number;           // taux TVA : 0.06 ou 0.21
  vat_amount: number;         // montant de TVA = subtotal × vat_rate
  total: number;              // TTC = subtotal + vat_amount
  notes: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- Lignes du devis : table `quote_lines` ---------------------------------

export interface QuoteLine {
  id: number;
  quote_id: number;           // FK vers quotes (CASCADE : supprimer le devis supprime ses lignes)
  product_id: number | null;  // FK vers products (SET NULL : si le produit est supprimé, la ligne reste)
  description: string;        // recopiée depuis le produit, mais éditable
  quantity: number;
  unit: string;               // m² / ml / pièce / h / forfait
  unit_price: number;
  line_total: number;         // quantity × unit_price
  position: number;           // ordre d'affichage de la ligne
}

// --- Statuts ----------------------------------------------------------------
// Mêmes valeurs que le CHECK SQL. `as const` → TypeScript en fait des
// littéraux réutilisables (comme PRODUCT_UNITS au Jour 4).

export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'refused'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

// Libellés lisibles pour l'affichage (le StatusBadge / les écrans).
export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  refused: 'Refusé',
};

// --- Taux de TVA ------------------------------------------------------------
// Choix dans une liste : 6 % (rénovation) ou 21 % (neuf), cas réels en Belgique.
// La valeur stockée en base est un REAL (0.06 / 0.21). Le label est l'affichage.

export const VAT_RATES = [
  { value: 0.06, label: '6 % (rénovation)' },
  { value: 0.21, label: '21 % (neuf)' },
] as const;

export const DEFAULT_VAT_RATE = 0.21;

// --- Numéro de devis --------------------------------------------------------
// Format "DEV-AAAA-NNN" (ex: DEV-2026-001). Fonction PURE : elle reçoit le
// dernier numéro connu (que le service ira chercher en base) et calcule le
// suivant. Pas de SQL ici → facile à comprendre et à tester.
//
//  - aucun devis encore cette année → on démarre à 001
//  - sinon → on incrémente le compteur du dernier numéro

export function buildNextQuoteNumber(
  lastNumber: string | null,
  year: number = new Date().getFullYear()
): string {
  const prefix = `DEV-${year}-`;

  // Pas de devis cette année (null, ou numéro d'une autre année) → on repart à 1.
  let counter = 1;
  if (lastNumber && lastNumber.startsWith(prefix)) {
    const lastCounter = parseInt(lastNumber.slice(prefix.length), 10);
    if (!Number.isNaN(lastCounter)) {
      counter = lastCounter + 1;
    }
  }

  // padStart(3, '0') → 1 devient "001", 42 devient "042", 123 reste "123".
  return `${prefix}${String(counter).padStart(3, '0')}`;
}
