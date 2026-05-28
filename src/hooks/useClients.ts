// src/hooks/useClients.ts
// Hook de lecture des clients. Suit le pattern du prof (slide 32) :
// useSQLiteContext() pour récupérer la db, puis useState + useEffect
// pour charger les données. On enrichit avec les 3 états d'une liste
// (loading → vide → données) et une fonction refetch().
//
// Pourquoi refetch() ? useEffect ne se déclenche qu'au montage. Après
// une création/édition/suppression, on appelle refetch() à la main pour
// rafraîchir la liste. C'est explicite, sans magie → facile à justifier.

import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { type Client } from '../models/client';
import {
  getAllClients,
  type GetClientsOptions,
} from '../services/db/client.service';
import { useFocusEffect } from 'expo-router';

interface UseClientsResult {
  clients: Client[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Usage :
//   const { clients, loading, error, refetch } = useClients();
//   const { clients } = useClients({ status: 'lead' }); // onglet Leads
export function useClients(options: GetClientsOptions = {}): UseClientsResult {
  const db = useSQLiteContext();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On dérive une clé stable du filtre pour les dépendances du useCallback.
  // (évite de recréer load à chaque rendu si options est un nouvel objet)
  const statusFilter = options.status;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await getAllClients(db, { status: statusFilter });
      setClients(rows);
    } catch (e) {
      console.error('useClients load error:', e);
      setError('Impossible de charger les clients.');
    } finally {
      setLoading(false);
    }
  }, [db, statusFilter]);

  // Charge au montage et quand le filtre change.
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
            // ici cest mieux que dans les clients/[id]/index.tsx car ça couvre aussi le cas de la création d'un nouveau client 
            // (on revient à la liste après création, pas de remontée d'état possible).
  return { clients, loading, error, refetch: load };
}
