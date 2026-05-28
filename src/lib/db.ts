// src/lib/db.ts
import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Numéro de version du schéma de base de données.
 *
 * À INCRÉMENTER à chaque nouvelle migration livrée.
 * Pattern enseigné slide 40 du Module 8.
 *
 * Historique :
 *   v1 (actuelle) : schéma initial — clients, products, quotes,
 *                   quote_lines, appointments, chantiers
 */
const DATABASE_VERSION = 2;

/**
 * Fonction d'initialisation et de migration de la base.
 *
 * Appelée par <SQLiteProvider> via la prop `onInit` au démarrage de
 * l'application (slide 31), avant le premier rendu des écrans.
 *
 * Pattern PRAGMA user_version (slides 36-40) :
 *   - on lit la version stockée dans l'en-tête du fichier .db
 *   - si elle est inférieure à DATABASE_VERSION, on applique en cascade
 *     les migrations manquantes
 *   - on écrit la nouvelle version à la fin
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  // -----------------------------------------------------------------------
  // PRAGMA non persistants : à activer à CHAQUE ouverture de la base,
  // pas seulement lors de la première migration. foreign_keys est
  // désactivé par défaut en SQLite et ne se "mémorise" pas.
  // -----------------------------------------------------------------------
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Lecture de la version actuelle (0 sur une base vierge)
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let currentVersion = result?.user_version ?? 0;

  // Base déjà à jour : on s'arrête.
  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  // -----------------------------------------------------------------------
  // Migration v0 → v1 : création initiale du schéma
  // -----------------------------------------------------------------------
  if (currentVersion === 0) {
    await db.execAsync(`
      -- WAL : meilleures perfs en lecture/écriture concurrente (slide 12).
      -- Persistant : on ne le règle qu'une fois.
      PRAGMA journal_mode = WAL;

      -- =====================================================
      -- clients : leads, clients actifs, archivés
      -- (table unique, distinguée par la colonne 'status')
      -- =====================================================
      CREATE TABLE IF NOT EXISTS clients (
        id          INTEGER PRIMARY KEY NOT NULL,
        first_name  TEXT NOT NULL,
        last_name   TEXT NOT NULL,
        email       TEXT,
        phone       TEXT,
        address     TEXT,
        city        TEXT,
        postal_code TEXT,
        status      TEXT NOT NULL DEFAULT 'lead'
                    CHECK (status IN ('lead', 'active', 'archived')),
        notes       TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

      -- =====================================================
      -- products : catalogue de matériaux
      -- =====================================================
      CREATE TABLE IF NOT EXISTS products (
        id          INTEGER PRIMARY KEY NOT NULL,
        name        TEXT NOT NULL,
        description TEXT,
        image_uri   TEXT,
        unit_price  REAL NOT NULL,
        unit        TEXT NOT NULL,
        category    TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- =====================================================
      -- quotes : devis (en-tête)
      -- =====================================================
      CREATE TABLE IF NOT EXISTS quotes (
        id           INTEGER PRIMARY KEY NOT NULL,
        client_id    INTEGER NOT NULL
                     REFERENCES clients(id) ON DELETE RESTRICT,
        quote_number TEXT NOT NULL UNIQUE,
        title        TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'sent', 'accepted', 'refused')),
        labor_cost   REAL NOT NULL DEFAULT 0,
        travel_cost  REAL NOT NULL DEFAULT 0,
        subtotal     REAL NOT NULL DEFAULT 0,
        vat_rate     REAL NOT NULL DEFAULT 0.21,
        vat_amount   REAL NOT NULL DEFAULT 0,
        total        REAL NOT NULL DEFAULT 0,
        notes        TEXT,
        sent_at      TEXT,
        accepted_at  TEXT,
        created_at   TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id);
      CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

      -- =====================================================
      -- quote_lines : lignes d'un devis
      -- =====================================================
      CREATE TABLE IF NOT EXISTS quote_lines (
        id          INTEGER PRIMARY KEY NOT NULL,
        quote_id    INTEGER NOT NULL
                    REFERENCES quotes(id) ON DELETE CASCADE,
        product_id  INTEGER
                    REFERENCES products(id) ON DELETE SET NULL,
        description TEXT NOT NULL,
        quantity    REAL NOT NULL,
        unit        TEXT NOT NULL,
        unit_price  REAL NOT NULL,
        line_total  REAL NOT NULL,
        position    INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_quote_lines_quote
        ON quote_lines(quote_id);

      -- =====================================================
      -- appointments : rendez-vous
      -- =====================================================
      CREATE TABLE IF NOT EXISTS appointments (
        id              INTEGER PRIMARY KEY NOT NULL,
        client_id       INTEGER NOT NULL
                        REFERENCES clients(id) ON DELETE CASCADE,
        quote_id        INTEGER
                        REFERENCES quotes(id) ON DELETE SET NULL,
        title           TEXT NOT NULL,
        starts_at       TEXT NOT NULL,
        ends_at         TEXT NOT NULL,
        location        TEXT,
        notes           TEXT,
        google_event_id TEXT,
        created_at      TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_appointments_client
        ON appointments(client_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_starts
        ON appointments(starts_at);

      -- =====================================================
      -- chantiers : suivi terrain (minimal v1)
      -- =====================================================
      CREATE TABLE IF NOT EXISTS chantiers (
        id               INTEGER PRIMARY KEY NOT NULL,
        quote_id         INTEGER NOT NULL UNIQUE
                         REFERENCES quotes(id) ON DELETE RESTRICT,
        client_id        INTEGER NOT NULL
                         REFERENCES clients(id) ON DELETE RESTRICT,
        status           TEXT NOT NULL DEFAULT 'planned'
                         CHECK (status IN ('planned', 'in_progress',
                                           'completed', 'cancelled')),
        started_at       TEXT,
        completed_at     TEXT,
        notes            TEXT,
        client_signature TEXT,
        created_at       TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_chantiers_status ON chantiers(status);
    `);
    currentVersion = 1;
  }

// -----------------------------------------------------------------------
// Migration v1 → v2 : table chantier_photos
// -----------------------------------------------------------------------
if (currentVersion === 1) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS chantier_photos (
      id          INTEGER PRIMARY KEY NOT NULL,
      chantier_id INTEGER NOT NULL
                  REFERENCES chantiers(id) ON DELETE CASCADE,
      uri         TEXT NOT NULL,
      caption     TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_chantier_photos_chantier
      ON chantier_photos(chantier_id);
  `);
  currentVersion = 2;
}

  // Écriture de la version finale dans l'en-tête du fichier .db
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}