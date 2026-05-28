// src/services/db/client.service.ts
// Couche d'accès aux données pour les clients, ALIGNÉE sur le schéma réel.
// Les fonctions reçoivent `db` en paramètre (le hook le récupère via
// useSQLiteContext). Toutes les requêtes utilisent des paramètres `?`
// (slides 15, 21) : jamais d'interpolation de chaîne avec de la saisie user.

import { type SQLiteDatabase } from 'expo-sqlite';
import { type Client, type ClientStatus } from '../../models/client';
import { type ClientFormData } from '../../validations/client.schema';

export interface GetClientsOptions {
  status?: ClientStatus;
}

// READ — liste, triée du plus récent au plus ancien.
export async function getAllClients(
  db: SQLiteDatabase,
  options: GetClientsOptions = {}
): Promise<Client[]> {
  if (options.status) {
    return db.getAllAsync<Client>(
      'SELECT * FROM clients WHERE status = ? ORDER BY created_at ASC',
      [options.status]
    );
  }
  return db.getAllAsync<Client>(
    'SELECT * FROM clients ORDER BY created_at ASC'
  );
}

// READ — un seul client (null si introuvable, slide 16).
export async function getClientById(
  db: SQLiteDatabase,
  id: number
): Promise<Client | null> {
  return db.getFirstAsync<Client>('SELECT * FROM clients WHERE id = ?', [id]);
}

// CREATE — on NE passe PAS created_at/updated_at : la table a
// DEFAULT (datetime('now')) sur ces colonnes, SQLite les remplit seule.
// Renvoie l'id généré (slide 24 : lastInsertRowId).
export async function createClient(
  db: SQLiteDatabase,
  data: ClientFormData
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO clients
       (first_name, last_name, email, phone, address, city, postal_code, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.first_name,
      data.last_name,
      data.email ?? null,
      data.phone ?? null,
      data.address ?? null,
      data.city ?? null,
      data.postal_code ?? null,
      data.status,
      data.notes ?? null,
    ]
  );
  return result.lastInsertRowId;
}

// UPDATE — on met à jour updated_at à la main (le DEFAULT ne joue qu'à
// l'INSERT). Renvoie le nombre de lignes affectées (slide 24 : changes).
export async function updateClient(
  db: SQLiteDatabase,
  id: number,
  data: ClientFormData
): Promise<number> {
  const result = await db.runAsync(
    `UPDATE clients SET
       first_name = ?, last_name = ?, email = ?, phone = ?,
       address = ?, city = ?, postal_code = ?, status = ?, notes = ?,
       updated_at = datetime('now')
     WHERE id = ?`,
    [
      data.first_name,
      data.last_name,
      data.email ?? null,
      data.phone ?? null,
      data.address ?? null,
      data.city ?? null,
      data.postal_code ?? null,
      data.status,
      data.notes ?? null,
      id,
    ]
  );
  return result.changes;
}

// DELETE — renvoie le nombre de lignes supprimées.
export async function deleteClient(
  db: SQLiteDatabase,
  id: number
): Promise<number> {
  const result = await db.runAsync('DELETE FROM clients WHERE id = ?', [id]);
  return result.changes;
}
