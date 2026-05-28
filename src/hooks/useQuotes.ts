// src/hooks/useQuotes.ts
// Hook de lecture de la LISTE des devis. Pattern identique à useProducts :
// useSQLiteContext pour la connexion, useState pour les 3 états, useFocusEffect
// pour recharger automatiquement au focus (après création/suppression).
//
// Différence : on manipule des QuoteListItem (devis + nom du client, via la
// jointure faite dans le service), pas de simples Quote.

import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getAllQuotes, type QuoteListItem } from '../services/db/quote.service';

interface UseQuotesResult {
  quotes: QuoteListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQuotes(): UseQuotesResult {
  const db = useSQLiteContext();

  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await getAllQuotes(db);
      setQuotes(rows);
    } catch (e) {
      console.error('useQuotes load error:', e);
      setError('Impossible de charger les devis.');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { quotes, loading, error, refetch: load };
}
