// src/hooks/useChantier.ts
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  getChantierById,
  getPhotosByChantierId,
} from '../services/db/chantier.service';
import {
  type ChantierWithRelations,
  type ChantierPhoto,
} from '../models/chantier';

type State = {
  chantier: ChantierWithRelations | null;
  photos: ChantierPhoto[];
  loading: boolean;
  error: string | null;
};

/**
 * Charge un chantier et ses photos, rafraîchit au focus.
 * Les deux requêtes sont parallélisées via Promise.all.
 */
export function useChantier(id: number) {
  const db = useSQLiteContext();
  const [state, setState] = useState<State>({
    chantier: null,
    photos: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true, error: null }));
      const [chantier, photos] = await Promise.all([
        getChantierById(db, id),
        getPhotosByChantierId(db, id),
      ]);
      setState({
        chantier,
        photos,
        loading: false,
        error: chantier ? null : 'Chantier introuvable.',
      });
    } catch (e) {
      setState({
        chantier: null,
        photos: [],
        loading: false,
        error: e instanceof Error ? e.message : 'Erreur de chargement',
      });
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { ...state, refresh };
}
