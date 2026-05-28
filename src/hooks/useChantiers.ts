// src/hooks/useChantiers.ts
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getAllChantiers } from '../services/db/chantier.service';
import { type ChantierWithRelations } from '../models/chantier';

type State = {
  chantiers: ChantierWithRelations[];
  loading: boolean;
  error: string | null;
};

/**
 * Liste de tous les chantiers, rafraîchie au focus.
 * Même pattern que useAgenda, useClients, etc.
 */
export function useChantiers() {
  const db = useSQLiteContext();
  const [state, setState] = useState<State>({
    chantiers: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true, error: null }));
      const chantiers = await getAllChantiers(db);
      setState({ chantiers, loading: false, error: null });
    } catch (e) {
      setState({
        chantiers: [],
        loading: false,
        error: e instanceof Error ? e.message : 'Erreur de chargement',
      });
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { ...state, refresh };
}
