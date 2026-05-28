// src/app/clients/[id]/edit.tsx
// Écran ÉDITION : réutilise ClientForm avec les valeurs existantes.
// Démontre la réutilisation du même formulaire création/édition.
// Aligné sur le schéma réel (first_name, last_name, city, postal_code).

import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useClient } from '../../../hooks/useClient';
import { ClientForm } from '../../../components/clients/ClientForm';
import { updateClient } from '../../../services/db/client.service';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { type ClientFormData } from '../../../validations/client.schema';

export default function EditClientScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const clientId = Number(id);

  const { client, loading, error } = useClient(clientId);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(data: ClientFormData) {
    try {
      setSaving(true);
      await updateClient(db, clientId, data);
      router.back();
    } catch (e) {
      console.error('updateClient error:', e);
      Alert.alert('Erreur', 'Impossible de mettre à jour le client.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner fullScreen />;

  if (error || !client) {
    return (
      <EmptyState
        title="Client introuvable"
        description={error ?? "Ce client n'existe pas."}
        actionLabel="Retour"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Modifier le client' }} />
      <ClientForm
        // Valeurs initiales = client actuel. On convertit les null en
        // undefined pour coller au type ClientFormData (champs optionnels).
        initialValues={{
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email ?? undefined,
          phone: client.phone ?? undefined,
          address: client.address ?? undefined,
          city: client.city ?? undefined,
          postal_code: client.postal_code ?? undefined,
          notes: client.notes ?? undefined,
          status: client.status,
        }}
        onSubmit={handleSubmit}
        submitLabel="Enregistrer les modifications"
        loading={saving}
      />
    </>
  );
}
