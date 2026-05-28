// app/clients/new.tsx
// Écran de CRÉATION d'un client.
// Réutilise ClientForm (mode vide) + le service createClient.

import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ClientForm } from '../../components/clients/ClientForm';
import { createClient } from '../../services/db/client.service';
import { type ClientFormData } from '../../validations/client.schema';

export default function NewClientScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(data: ClientFormData) {
    try {
      setSaving(true);
      await createClient(db, data);
      // Retour à la liste : useEffect du hook rechargera au remontage,
      // sinon on peut déclencher un refetch via un événement. Ici on
      // revient simplement en arrière.
      router.back();
    } catch (e) {
      console.error('createClient error:', e);
      Alert.alert('Erreur', "Impossible d'enregistrer le client.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Nouveau client' }} />
      <ClientForm
        onSubmit={handleSubmit}
        submitLabel="Créer le client"
        loading={saving}
      />
    </>
  );
}
