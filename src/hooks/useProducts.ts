// src/hooks/useProducts.ts
// Hook de lecture de la liste des produits. Même pattern que useClients :
// useSQLiteContext pour la connexion, useState pour les 3 états, et
// useFocusEffect pour recharger automatiquement quand l'écran reprend le
// focus (après création/édition/suppression). Pas de filtre statut ici
// (les produits n'en ont pas) → plus simple que useClients.

import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { type Product } from '../models/product';
import { getAllProducts } from '../services/db/product.service';

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProducts(): UseProductsResult {
  const db = useSQLiteContext();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await getAllProducts(db);
      setProducts(rows);
    } catch (e) {
      console.error('useProducts load error:', e);
      setError('Impossible de charger les produits.');
    } finally {
      setLoading(false);
    }
  }, [db]);

  // Recharge à chaque fois que l'écran reprend le focus.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { products, loading, error, refetch: load };
}
