// src/services/db/event.service.ts
// Couche d'accès aux données pour les rendez-vous (table `appointments`).
// Conventions identiques aux autres services :
//   - `db` injecté en paramètre (récupéré via useSQLiteContext côté hook)
//   - paramètres `?` systématiques (slides 15, 21)
//   - created_at/updated_at via DEFAULT à l'INSERT, MAJ manuelle à l'UPDATE
//   - lastInsertRowId au CREATE, changes au UPDATE/DELETE (slide 24)

import { type SQLiteDatabase } from 'expo-sqlite';
import { type EventWithRelations } from '../../models/event';
import { type EventFormData } from '../../validations/event.schema';

export interface GetEventsOptions {
  /** Filtre temporel : RDV à partir de cette date (ISO). */
  fromIso?: string;
  /** Filtre temporel : RDV avant cette date (ISO). */
  beforeIso?: string;
  /** RDV d'un client précis (utile pour la fiche client). */
  clientId?: number;
}

// SELECT commun : on factorise les colonnes JOIN pour éviter de
// dupliquer la requête entre getAllEvents et getEventById.
const SELECT_WITH_RELATIONS = `
  SELECT
    a.*,
    c.first_name  AS client_first_name,
    c.last_name   AS client_last_name,
    c.phone       AS client_phone,
    c.address     AS client_address,
    c.city        AS client_city,
    c.postal_code AS client_postal_code,
    q.quote_number AS quote_number,
    q.title        AS quote_title
  FROM appointments a
  INNER JOIN clients c ON c.id = a.client_id
  LEFT  JOIN quotes  q ON q.id = a.quote_id
`;

// READ — liste avec JOIN clients (INNER, le client est obligatoire)
// et quotes (LEFT, le devis est optionnel).
export async function getAllEvents(
  db: SQLiteDatabase,
  options: GetEventsOptions = {}
): Promise<EventWithRelations[]> {
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (options.fromIso) {
    where.push('a.starts_at >= ?');
    params.push(options.fromIso);
  }
  if (options.beforeIso) {
    where.push('a.starts_at < ?');
    params.push(options.beforeIso);
  }
  if (options.clientId != null) {
    where.push('a.client_id = ?');
    params.push(options.clientId);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  return db.getAllAsync<EventWithRelations>(
    `${SELECT_WITH_RELATIONS} ${whereSql} ORDER BY a.starts_at ASC`,
    params
  );
}

// READ — un seul RDV (null si introuvable, slide 16).
export async function getEventById(
  db: SQLiteDatabase,
  id: number
): Promise<EventWithRelations | null> {
  return db.getFirstAsync<EventWithRelations>(
    `${SELECT_WITH_RELATIONS} WHERE a.id = ?`,
    [id]
  );
}

// CREATE — created_at/updated_at gérés par DEFAULT.
// Renvoie l'id généré (slide 24 : lastInsertRowId).
export async function createEvent(
  db: SQLiteDatabase,
  data: EventFormData
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO appointments
       (client_id, quote_id, title, starts_at, ends_at, location, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.client_id,
      data.quote_id ?? null,
      data.title,
      data.starts_at,
      data.ends_at,
      data.location ?? null,
      data.notes ?? null,
    ]
  );
  return result.lastInsertRowId;
}

// UPDATE — on met à jour updated_at à la main.
// Renvoie le nombre de lignes affectées (slide 24 : changes).
export async function updateEvent(
  db: SQLiteDatabase,
  id: number,
  data: EventFormData
): Promise<number> {
  const result = await db.runAsync(
    `UPDATE appointments SET
       client_id  = ?, quote_id   = ?, title    = ?,
       starts_at  = ?, ends_at    = ?,
       location   = ?, notes      = ?,
       updated_at = datetime('now')
     WHERE id = ?`,
    [
      data.client_id,
      data.quote_id ?? null,
      data.title,
      data.starts_at,
      data.ends_at,
      data.location ?? null,
      data.notes ?? null,
      id,
    ]
  );
  return result.changes;
}

// DELETE — renvoie le nombre de lignes supprimées.
export async function deleteEvent(
  db: SQLiteDatabase,
  id: number
): Promise<number> {
  const result = await db.runAsync(
    'DELETE FROM appointments WHERE id = ?',
    [id]
  );
  return result.changes;
}

// COUNT — utile pour un futur KPI "RDV à venir" sur le Dashboard.
// Pattern d'agrégation SQL identique au Jour 6.
export async function countUpcomingEvents(
  db: SQLiteDatabase,
  fromIso: string = new Date().toISOString()
): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM appointments WHERE starts_at >= ?',
    [fromIso]
  );
  return row?.n ?? 0;
}
