// src/services/db/dashboard.service.ts
// Couche d'accès aux données pour le tableau de bord. NOUVEAUTÉ du jour :
// l'AGRÉGATION SQL. Au lieu de charger toutes les lignes et de compter en JS,
// on demande à SQLite de calculer directement les totaux avec COUNT / SUM.
//
// On regroupe tous les compteurs de devis dans UNE seule requête grâce à
// l'agrégation conditionnelle SUM(CASE WHEN ... THEN 1 ELSE 0 END) : plus
// efficace que plusieurs requêtes séparées.

import { type SQLiteDatabase } from 'expo-sqlite';
import { type QuoteStatus } from '../../models/quote';

// Les indicateurs renvoyés au hook.
export interface DashboardStats {
  revenue: number;          // CA = somme des totaux des devis acceptés
  pendingQuotes: number;    // devis envoyés en attente de réponse
  acceptedCount: number;    // devis acceptés
  refusedCount: number;     // devis refusés
  conversionRate: number;   // acceptés / (acceptés + refusés), en % (0 si aucun tranché)
  activeClients: number;    // clients au statut 'active'
  // Répartition de TOUS les devis par statut, pour le graphique en anneau.
  byStatus: Record<QuoteStatus, number>;
}

export async function getDashboardStats(db: SQLiteDatabase): Promise<DashboardStats> {
  // 1. Agrégats sur les devis, en UNE requête.
  //    - COALESCE(..., 0) : si aucun devis accepté, SUM renvoie NULL → on force 0.
  //    - SUM(CASE WHEN ...) : compte conditionnel par statut.
  const quoteRow = await db.getFirstAsync<{
    revenue: number;
    draft: number;
    sent: number;
    accepted: number;
    refused: number;
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'accepted' THEN total ELSE 0 END), 0) AS revenue,
       SUM(CASE WHEN status = 'draft'    THEN 1 ELSE 0 END) AS draft,
       SUM(CASE WHEN status = 'sent'     THEN 1 ELSE 0 END) AS sent,
       SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
       SUM(CASE WHEN status = 'refused'  THEN 1 ELSE 0 END) AS refused
     FROM quotes`
  );

  // 2. Compte des clients actifs (autre table → requête séparée).
  const clientRow = await db.getFirstAsync<{ activeClients: number }>(
    `SELECT COUNT(*) AS activeClients FROM clients WHERE status = 'active'`
  );

  // Valeurs sûres (la table peut être vide → row peut contenir des null/0).
  const draft = quoteRow?.draft ?? 0;
  const sent = quoteRow?.sent ?? 0;
  const accepted = quoteRow?.accepted ?? 0;
  const refused = quoteRow?.refused ?? 0;
  const revenue = quoteRow?.revenue ?? 0;

  // 3. Taux de conversion : acceptés / (acceptés + refusés).
  //    On ne compte que les devis TRANCHÉS (un brouillon ou un envoyé n'est
  //    pas encore décidé). Si rien n'est tranché → 0 (évite la division par 0).
  const decided = accepted + refused;
  const conversionRate = decided > 0 ? Math.round((accepted / decided) * 100) : 0;

  return {
    revenue,
    pendingQuotes: sent,
    acceptedCount: accepted,
    refusedCount: refused,
    conversionRate,
    activeClients: clientRow?.activeClients ?? 0,
    byStatus: { draft, sent, accepted, refused },
  };
}
