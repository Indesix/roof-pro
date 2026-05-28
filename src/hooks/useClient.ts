// src/hooks/useClient.ts
// Variante de useClients pour UN client (écrans détail et édition).
// Même pattern : useSQLiteContext + useState + useEffect + refetch.

import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { type Client } from '../models/client';
import { getClientById } from '../services/db/client.service';
import { useFocusEffect } from 'expo-router';

interface UseClientResult {
  client: Client | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useClient(id: number): UseClientResult {
  const db = useSQLiteContext();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const row = await getClientById(db, id);
      setClient(row);
    } catch (e) {
      console.error('useClient load error:', e);
      setError('Impossible de charger ce client.');
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useEffect(() => {
    load();
  }, [load]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
    );
    // Refetch client data when the screen is focused, 
          // le focus c'est quand on revient de l'écran d'édition par exemple. Sans ça, les données restent figées à l'état initial (avant édition).
          // useEffect ne suffit pas car le composant n'est pas démonté/remonté, c'est un focus. C'est spécifique à React Navigation / Expo Router.
  return { client, loading, error, refetch: load };
}
