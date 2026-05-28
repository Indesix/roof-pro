// src/features/quotes/quote.calculator.ts
// CŒUR MÉTIER du module Devis : le calcul des totaux.
//
// Ce sont des fonctions PURES : elles prennent des données en entrée et
// rendent un résultat, SANS toucher à SQLite, au state React ou à l'écran.
// Avantages :
//   - testables sans lancer l'app (entrée connue → sortie connue) ;
//   - réutilisables : le FORMULAIRE les appelle pour afficher le total en
//     direct pendant la saisie, et le SERVICE les appelle avant d'enregistrer.
//     → un seul calcul, donc l'affichage et la base ne peuvent pas diverger.
//
// CHOIX MÉTIER : le sous-total (HT) = somme des lignes. La main d'œuvre et le
// déplacement sont des lignes comme les autres (unités `h` / `forfait`).
// La TVA s'applique sur ce sous-total. total TTC = sous-total + TVA.

// --- Arrondi monétaire ------------------------------------------------------
// En JS, les nombres à virgule peuvent "déraper" (0.1 + 0.2 ≠ 0.3 exactement).
// Pour de l'argent, on arrondit donc systématiquement à 2 décimales (centimes),
// sinon on risque d'enregistrer 241.99999998 au lieu de 242.00.
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// --- Total d'une ligne ------------------------------------------------------
// quantité × prix unitaire. On le nomme pour ne jamais retaper la
// multiplication ailleurs (et arrondir au passage).
export function computeLineTotal(quantity: number, unitPrice: number): number {
  return round2(quantity * unitPrice);
}

// --- Forme minimale d'une ligne pour le calcul ------------------------------
// On n'a besoin que de la quantité et du prix unitaire pour calculer.
// (On ne demande pas un QuoteLine complet : ça rend la fonction utilisable
//  même pendant la saisie, quand la ligne n'a pas encore d'id.)
export interface CalculableLine {
  quantity: number;
  unit_price: number;
}

// --- Résultat du calcul -----------------------------------------------------
// Mêmes noms que les colonnes SQL → le service n'a qu'à les recopier.
export interface QuoteTotals {
  subtotal: number;    // HT : somme des lignes
  vat_amount: number;  // montant de TVA
  total: number;       // TTC : HT + TVA
}

// --- Calcul complet d'un devis ----------------------------------------------
export function computeQuoteTotals(
  lines: CalculableLine[],
  vatRate: number
): QuoteTotals {
  // 1. Sous-total HT = somme des (quantité × prix unitaire) de chaque ligne.
  const subtotal = round2(
    lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0)
  );

  // 2. Montant de TVA = sous-total × taux (ex: 242 × 0.21).
  const vat_amount = round2(subtotal * vatRate);

  // 3. Total TTC = HT + TVA.
  const total = round2(subtotal + vat_amount);

  return { subtotal, vat_amount, total };
}
