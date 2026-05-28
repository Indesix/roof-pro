// src/hooks/useAgenda.ts
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getAllEvents } from '../services/db/event.service';
import { type EventWithRelations } from '../models/event';

type State = {
  events: EventWithRelations[];
  loading: boolean;
  error: string | null;
};

/**
 * Charge la liste des RDV à venir et la rafraîchit automatiquement
 * chaque fois que l'utilisateur revient sur l'écran (useFocusEffect).
 *
 * Même pattern que les autres modules : on récupère `db` via
 * useSQLiteContext et on le passe au service.
 */
export function useAgenda() {
  const db = useSQLiteContext();
  const [state, setState] = useState<State>({
    events: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true, error: null }));
      const events = await getAllEvents(db, {
        fromIso: new Date().toISOString(),
      });
      setState({ events, loading: false, error: null });
    } catch (e) {
      setState({
        events: [],
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
