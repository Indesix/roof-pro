// src/models/product.ts
// Type d'une ligne de la table `products`, ALIGNÉ sur le schéma SQL réel
// défini dans src/lib/db.ts (Jour 1). Colonnes en snake_case pour que
// getAllAsync<Product> mappe directement.
//
// MVP : on ignore `category` et `image_uri` (colonnes laissées à null).

export interface Product {
  id: number;
  name: string;
  description: string | null;
  image_uri: string | null;   // non utilisé au MVP, laissé null
  unit_price: number;          // REAL en SQLite → number en TS
  unit: string;                // unité de vente (m², ml, pièce, h, forfait)
  category: string | null;     // non utilisé au MVP, laissé null
  created_at: string;
  updated_at: string;
}

// Unités de vente proposées dans le formulaire (AppSelect).
export const PRODUCT_UNITS = ['m²', 'ml', 'pièce', 'h', 'forfait'] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

// Helper d'affichage : prix formaté en euros.
export function formatPrice(value: number): string {
  return `${value.toFixed(2)} €`;
}
