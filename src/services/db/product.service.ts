// src/services/db/product.service.ts
// Couche d'accès aux données pour les produits, ALIGNÉE sur le schéma réel.
// Même pattern que client.service.ts : les fonctions reçoivent `db` en
// paramètre (le hook le récupère via useSQLiteContext). Requêtes paramétrées
// `?` partout (slides 15, 21) : jamais d'interpolation de saisie utilisateur.
//
// MVP : on n'écrit pas category ni image_uri (laissés à leur défaut/null).

import { type SQLiteDatabase } from 'expo-sqlite';
import { type Product } from '../../models/product';
import { type ProductFormData } from '../../validations/product.schema';

// READ — liste, triée par nom (ordre alphabétique, pratique pour un catalogue).
export async function getAllProducts(db: SQLiteDatabase): Promise<Product[]> {
  return db.getAllAsync<Product>('SELECT * FROM products ORDER BY name ASC');
}

// READ — un seul produit (null si introuvable).
export async function getProductById(
  db: SQLiteDatabase,
  id: number
): Promise<Product | null> {
  return db.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', [id]);
}

// CREATE — created_at/updated_at remplis par DEFAULT (datetime('now')).
// Renvoie l'id généré (lastInsertRowId).
export async function createProduct(
  db: SQLiteDatabase,
  data: ProductFormData
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO products (name, description, unit_price, unit)
     VALUES (?, ?, ?, ?)`,
    [
      data.name,
      data.description ?? null,
      data.unit_price,
      data.unit,
    ]
  );
  return result.lastInsertRowId;
}

// UPDATE — met à jour updated_at à la main. Renvoie le nombre de lignes affectées.
export async function updateProduct(
  db: SQLiteDatabase,
  id: number,
  data: ProductFormData
): Promise<number> {
  const result = await db.runAsync(
    `UPDATE products SET
       name = ?, description = ?, unit_price = ?, unit = ?,
       updated_at = datetime('now')
     WHERE id = ?`,
    [
      data.name,
      data.description ?? null,
      data.unit_price,
      data.unit,
      id,
    ]
  );
  return result.changes;
}

// DELETE — renvoie le nombre de lignes supprimées.
export async function deleteProduct(
  db: SQLiteDatabase,
  id: number
): Promise<number> {
  const result = await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
  return result.changes;
}
