// src/hooks/useProduct.ts
// Variante pour UN produit (écrans détail et édition). Même pattern.

import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { type Product } from '../models/product';
import { getProductById } from '../services/db/product.service';

interface UseProductResult {
  product: Product | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProduct(id: number): UseProductResult {
  const db = useSQLiteContext();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const row = await getProductById(db, id);
      setProduct(row);
    } catch (e) {
      console.error('useProduct load error:', e);
      setError('Impossible de charger ce produit.');
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { product, loading, error, refetch: load };
}
