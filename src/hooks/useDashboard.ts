// src/hooks/useDashboard.ts
// Hook de lecture des indicateurs du tableau de bord. Même pattern que
// useProducts / useQuotes : useSQLiteContext, 3 états, refetch au focus
// (le dashboard se met donc à jour automatiquement après chaque devis créé
// ou statut changé, dès qu'on revient sur l'onglet).

import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getDashboardStats, type DashboardStats } from '../services/db/dashboard.service';

interface UseDashboardResult {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardResult {
  const db = useSQLiteContext();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats(db);
      setStats(data);
    } catch (e) {
      console.error('useDashboard load error:', e);
      setError('Impossible de charger le tableau de bord.');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { stats, loading, error, refetch: load };
}
