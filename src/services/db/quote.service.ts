// src/services/db/quote.service.ts
// Couche d'accès aux données pour les devis, ALIGNÉE sur le schéma réel.
// Même pattern que product.service.ts : `db` reçu en paramètre, requêtes
// paramétrées `?` partout (jamais d'interpolation de saisie utilisateur).
//
// SPÉCIFICITÉ DU JOUR 5 — LA TRANSACTION ATOMIQUE (slide 27).
// Créer un devis = insérer 1 en-tête (table quotes) PUIS N lignes (quote_lines).
// Si l'app plantait entre les deux, on aurait un devis sans lignes (incohérent).
// db.withExclusiveTransactionAsync(...) garantit le "tout ou rien" :
//   - la fonction se termine normalement  → SQLite valide tout (commit) ;
//   - une erreur est levée à l'intérieur  → SQLite annule tout (rollback).
// On n'écrit donc PAS de BEGIN/COMMIT à la main.

import { type SQLiteDatabase } from 'expo-sqlite';
import { type Quote, type QuoteLine, buildNextQuoteNumber } from '../../models/quote';
import { type QuoteFormData } from '../../validations/quote.schema';
import { computeQuoteTotals, computeLineTotal } from '../../features/quotes/quote.calculator';

// Type de la liste : le devis + le nom du client (joint pour l'affichage).
export interface QuoteListItem extends Quote {
  client_name: string;
}

// READ — liste des devis, du plus récent au plus ancien.
// Jointure avec clients pour afficher le nom directement dans la liste.
export async function getAllQuotes(db: SQLiteDatabase): Promise<QuoteListItem[]> {
  return db.getAllAsync<QuoteListItem>(
    `SELECT q.*, (c.first_name || ' ' || c.last_name) AS client_name
       FROM quotes q
       JOIN clients c ON c.id = q.client_id
       ORDER BY q.created_at DESC`
  );
}

// READ — un seul devis (l'en-tête), null si introuvable.
export async function getQuoteById(
  db: SQLiteDatabase,
  id: number
): Promise<Quote | null> {
  return db.getFirstAsync<Quote>('SELECT * FROM quotes WHERE id = ?', [id]);
}

// READ — les lignes d'un devis, dans l'ordre d'affichage (position).
export async function getQuoteLines(
  db: SQLiteDatabase,
  quoteId: number
): Promise<QuoteLine[]> {
  return db.getAllAsync<QuoteLine>(
    'SELECT * FROM quote_lines WHERE quote_id = ? ORDER BY position ASC',
    [quoteId]
  );
}

// READ — dernier numéro de devis émis (le plus grand), null si aucun.
// Sert à buildNextQuoteNumber pour calculer le numéro suivant.
export async function getLastQuoteNumber(
  db: SQLiteDatabase
): Promise<string | null> {
  const row = await db.getFirstAsync<{ quote_number: string }>(
    'SELECT quote_number FROM quotes ORDER BY quote_number DESC LIMIT 1'
  );
  return row?.quote_number ?? null;
}

// CREATE — devis + ses lignes EN UNE SEULE TRANSACTION (tout ou rien).
// Étapes :
//   1. calculer les totaux (calculateur pur) ;
//   2. générer le numéro de devis (dernier numéro + 1) ;
//   3. dans la transaction : insérer l'en-tête, récupérer son id,
//      puis insérer chaque ligne rattachée à cet id.
// Renvoie l'id du devis créé.
export async function createQuoteWithLines(
  db: SQLiteDatabase,
  data: QuoteFormData
): Promise<number> {
  // 1. Totaux calculés AVANT (logique pure, hors base).
  const totals = computeQuoteTotals(data.lines, data.vat_rate);

  // 2. Numéro de devis : on lit le dernier, le modèle calcule le suivant.
  const lastNumber = await getLastQuoteNumber(db);
  const quoteNumber = buildNextQuoteNumber(lastNumber);

  // On déclare l'id ici pour pouvoir le renvoyer après la transaction.
  let newQuoteId = 0;

  // 3. TRANSACTION : en-tête + lignes ensemble. Si une insertion échoue,
  //    SQLite annule TOUT (y compris l'en-tête déjà inséré).
  await db.withExclusiveTransactionAsync(async (txn) => {
    // 3a. Insérer l'en-tête. status 'draft' par défaut à la création.
    //     labor_cost / travel_cost restent à 0 (gérés en lignes au MVP).
    const headerResult = await txn.runAsync(
      `INSERT INTO quotes
         (client_id, quote_number, title, status,
          subtotal, vat_rate, vat_amount, total, notes)
       VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?)`,
      [
        data.client_id,
        quoteNumber,
        data.title ?? null,
        totals.subtotal,
        data.vat_rate,
        totals.vat_amount,
        totals.total,
        data.notes ?? null,
      ]
    );

    // On récupère l'id de l'en-tête pour rattacher les lignes.
    newQuoteId = headerResult.lastInsertRowId;

    // 3b. Insérer chaque ligne. `position` = ordre dans le devis (0, 1, 2...).
    for (let i = 0; i < data.lines.length; i++) {
      const line = data.lines[i];
      const lineTotal = computeLineTotal(line.quantity, line.unit_price);

      await txn.runAsync(
        `INSERT INTO quote_lines
           (quote_id, product_id, description, quantity, unit, unit_price,
            line_total, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newQuoteId,
          line.product_id,
          line.description,
          line.quantity,
          line.unit,
          line.unit_price,
          lineTotal,
          i,
        ]
      );
    }
    // Fin de la fonction sans erreur → SQLite valide tout automatiquement.
  });

  return newQuoteId;
}

// UPDATE — changer le statut d'un devis (draft → sent → accepted → refused).
// Met à jour sent_at / accepted_at selon le nouveau statut, et updated_at.
export async function updateQuoteStatus(
  db: SQLiteDatabase,
  id: number,
  status: Quote['status']
): Promise<number> {
  const result = await db.runAsync(
    `UPDATE quotes SET
       status = ?,
       sent_at = CASE WHEN ? = 'sent' THEN datetime('now') ELSE sent_at END,
       accepted_at = CASE WHEN ? = 'accepted' THEN datetime('now') ELSE accepted_at END,
       updated_at = datetime('now')
     WHERE id = ?`,
    [status, status, status, id]
  );
  return result.changes;
}

// DELETE — supprime un devis. Ses lignes partent automatiquement (FK CASCADE).
export async function deleteQuote(
  db: SQLiteDatabase,
  id: number
): Promise<number> {
  const result = await db.runAsync('DELETE FROM quotes WHERE id = ?', [id]);
  return result.changes;
}
