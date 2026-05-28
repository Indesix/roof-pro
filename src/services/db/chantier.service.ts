// src/services/db/chantier.service.ts
// Couche d'accès aux données pour le module Chantiers.
// Mêmes conventions que les autres services :
//   - `db` injecté en paramètre
//   - paramètres `?` systématiques (slides 15, 21)
//   - lastInsertRowId au CREATE, changes au UPDATE/DELETE (slide 24)

import { type SQLiteDatabase } from 'expo-sqlite';
import {
  type Chantier,
  type ChantierWithRelations,
  type ChantierPhoto,
  type ChantierStatus,
} from '../../models/chantier';
import {
  type ChantierUpdateData,
  type PhotoCreateData,
} from '../../validations/chantier.schema';

// SELECT commun avec JOINs et count des photos en sous-requête.
const SELECT_WITH_RELATIONS = `
  SELECT
    ch.*,
    c.first_name  AS client_first_name,
    c.last_name   AS client_last_name,
    c.phone       AS client_phone,
    c.address     AS client_address,
    c.city        AS client_city,
    c.postal_code AS client_postal_code,
    q.quote_number AS quote_number,
    q.title        AS quote_title,
    q.total        AS quote_total,
    (SELECT COUNT(*) FROM chantier_photos p WHERE p.chantier_id = ch.id)
      AS photo_count
  FROM chantiers ch
  INNER JOIN clients c ON c.id = ch.client_id
  INNER JOIN quotes  q ON q.id = ch.quote_id
`;

// ═══════════════════════════════════════════════════════════════════════
// READ
// ═══════════════════════════════════════════════════════════════════════

export interface GetChantiersOptions {
  status?: ChantierStatus;
}

export async function getAllChantiers(
  db: SQLiteDatabase,
  options: GetChantiersOptions = {}
): Promise<ChantierWithRelations[]> {
  if (options.status) {
    return db.getAllAsync<ChantierWithRelations>(
      `${SELECT_WITH_RELATIONS} WHERE ch.status = ? ORDER BY ch.created_at DESC`,
      [options.status]
    );
  }
  return db.getAllAsync<ChantierWithRelations>(
    `${SELECT_WITH_RELATIONS} ORDER BY ch.created_at DESC`
  );
}

export async function getChantierById(
  db: SQLiteDatabase,
  id: number
): Promise<ChantierWithRelations | null> {
  return db.getFirstAsync<ChantierWithRelations>(
    `${SELECT_WITH_RELATIONS} WHERE ch.id = ?`,
    [id]
  );
}

/**
 * Récupère le chantier d'un devis (s'il existe).
 * Utile pour la fiche devis : afficher « voir le chantier » plutôt que
 * « créer un chantier » si le devis a déjà été transformé.
 */
export async function getChantierByQuoteId(
  db: SQLiteDatabase,
  quoteId: number
): Promise<Chantier | null> {
  return db.getFirstAsync<Chantier>(
    'SELECT * FROM chantiers WHERE quote_id = ?',
    [quoteId]
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CREATE — transformation devis → chantier (fonctionnalité 4 du brief)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Transforme un devis accepté en chantier.
 * Récupère le client_id depuis le devis (cohérence garantie : le
 * chantier hérite du client du devis, pas de risque d'incohérence).
 *
 * Lève une erreur si :
 *  - le devis n'existe pas
 *  - le devis n'est pas au statut 'accepted'
 *  - un chantier existe déjà pour ce devis (UNIQUE constraint)
 */
export async function createChantierFromQuote(
  db: SQLiteDatabase,
  quoteId: number
): Promise<number> {
  // 1. Vérifications préalables — explicites pour des messages d'erreur clairs.
  const quote = await db.getFirstAsync<{
    id: number;
    client_id: number;
    status: string;
  }>('SELECT id, client_id, status FROM quotes WHERE id = ?', [quoteId]);

  if (!quote) {
    throw new Error('Devis introuvable.');
  }
  if (quote.status !== 'accepted') {
    throw new Error(
      'Seul un devis accepté peut être transformé en chantier.'
    );
  }

  const existing = await getChantierByQuoteId(db, quoteId);
  if (existing) {
    throw new Error('Un chantier existe déjà pour ce devis.');
  }

  // 2. Création du chantier au statut 'planned' (défaut).
  const result = await db.runAsync(
    `INSERT INTO chantiers (quote_id, client_id, status)
     VALUES (?, ?, 'planned')`,
    [quote.id, quote.client_id]
  );
  return result.lastInsertRowId;
}

// ═══════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════

/**
 * Met à jour le statut et les notes d'un chantier.
 * Met aussi à jour automatiquement started_at / completed_at selon
 * les transitions de statut — règle métier centralisée ici plutôt
 * que de la dupliquer dans chaque écran.
 */
export async function updateChantier(
  db: SQLiteDatabase,
  id: number,
  data: ChantierUpdateData
): Promise<number> {
  // Logique métier des dates : on les positionne au moment de la
  // première transition, et on n'écrase pas une valeur déjà présente.
  const current = await db.getFirstAsync<{
    started_at: string | null;
    completed_at: string | null;
  }>('SELECT started_at, completed_at FROM chantiers WHERE id = ?', [id]);

  if (!current) {
    throw new Error('Chantier introuvable.');
  }

  let startedAt = current.started_at;
  let completedAt = current.completed_at;

  if (data.status === 'in_progress' && !startedAt) {
    startedAt = new Date().toISOString();
  }
  if (data.status === 'completed' && !completedAt) {
    completedAt = new Date().toISOString();
    // Si on passe directement à 'completed' sans avoir été 'in_progress',
    // on positionne aussi started_at pour la cohérence.
    if (!startedAt) startedAt = completedAt;
  }

  const result = await db.runAsync(
    `UPDATE chantiers SET
       status       = ?,
       notes        = ?,
       started_at   = ?,
       completed_at = ?,
       updated_at   = datetime('now')
     WHERE id = ?`,
    [data.status, data.notes ?? null, startedAt, completedAt, id]
  );
  return result.changes;
}

// ═══════════════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════════════

export async function deleteChantier(
  db: SQLiteDatabase,
  id: number
): Promise<number> {
  // Les photos sont supprimées automatiquement via ON DELETE CASCADE.
  const result = await db.runAsync(
    'DELETE FROM chantiers WHERE id = ?',
    [id]
  );
  return result.changes;
}

// ═══════════════════════════════════════════════════════════════════════
// PHOTOS
// ═══════════════════════════════════════════════════════════════════════

export async function getPhotosByChantierId(
  db: SQLiteDatabase,
  chantierId: number
): Promise<ChantierPhoto[]> {
  return db.getAllAsync<ChantierPhoto>(
    `SELECT * FROM chantier_photos
      WHERE chantier_id = ?
      ORDER BY created_at ASC`,
    [chantierId]
  );
}

export async function addPhoto(
  db: SQLiteDatabase,
  chantierId: number,
  data: PhotoCreateData
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO chantier_photos (chantier_id, uri, caption)
     VALUES (?, ?, ?)`,
    [chantierId, data.uri, data.caption ?? null]
  );
  return result.lastInsertRowId;
}

export async function deletePhoto(
  db: SQLiteDatabase,
  id: number
): Promise<number> {
  const result = await db.runAsync(
    'DELETE FROM chantier_photos WHERE id = ?',
    [id]
  );
  return result.changes;
}

// ═══════════════════════════════════════════════════════════════════════
// AGRÉGATION — utile pour le Dashboard (CA réalisé, KPI à venir)
// ═══════════════════════════════════════════════════════════════════════

/**
 * CA réalisé = somme des totaux des devis liés aux chantiers terminés.
 * C'est exactement le KPI annoncé en écart MVP au Jour 6 et que tu
 * pourras intégrer au Dashboard.
 */
export async function getCompletedRevenue(
  db: SQLiteDatabase
): Promise<number> {
  const row = await db.getFirstAsync<{ revenue: number }>(
    `SELECT COALESCE(SUM(q.total), 0) AS revenue
       FROM chantiers ch
       INNER JOIN quotes q ON q.id = ch.quote_id
      WHERE ch.status = 'completed'`
  );
  return row?.revenue ?? 0;
}
