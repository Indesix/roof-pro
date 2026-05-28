// src/hooks/useQuote.ts
// Hook de lecture d'UN devis par son id. Même pattern que useProduct, MAIS
// un devis = un en-tête + ses lignes. On charge donc DEUX choses dans le même
// `load` (deux appels au service) et on renvoie { quote, lines }.

import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { type Quote, type QuoteLine } from '../models/quote';
import { getQuoteById, getQuoteLines } from '../services/db/quote.service';

interface UseQuoteResult {
  quote: Quote | null;
  lines: QuoteLine[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQuote(id: number): UseQuoteResult {
  const db = useSQLiteContext();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Deux lectures : l'en-tête, puis ses lignes.
      const header = await getQuoteById(db, id);
      const quoteLines = await getQuoteLines(db, id);
      setQuote(header);
      setLines(quoteLines);
    } catch (e) {
      console.error('useQuote load error:', e);
      setError('Impossible de charger le devis.');
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { quote, lines, loading, error, refetch: load };
}
