// src/app/clients/[id]/index.tsx
// Écran DÉTAIL d'un client (route dynamique, Module 3).
// Affiche les infos, propose Éditer et Supprimer.
// Aligné sur le schéma réel (first_name, last_name, city, postal_code).

import React, { useState } from 'react';
import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useClient } from '../../../hooks/useClient';
import { deleteClient } from '../../../services/db/client.service';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { AppCard } from '../../../components/ui/AppCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { clientFullName } from '../../../models/client';
import { spacing } from '../../../constants/spacing';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function ClientDetailScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const clientId = Number(id);
  

  const { client, loading, error, refetch } = useClient(clientId);
  const [deleting, setDeleting] = useState(false);

  
  function confirmDelete() {
    Alert.alert('Supprimer ce client ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: handleDelete },
    ]);
  }

  async function handleDelete() {
    try {
      setDeleting(true);
      await deleteClient(db, clientId);
      router.back();
    } catch (e) {
      console.error('deleteClient error:', e);
      Alert.alert('Erreur', 'Impossible de supprimer le client.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <LoadingSpinner fullScreen />;

  if (error || !client) {
    return (
      <EmptyState
        title="Client introuvable"
        description={error ?? "Ce client n'existe pas ou a été supprimé."}
        actionLabel="Retour"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: clientFullName(client) }}  />
      <ScrollView contentContainerStyle={styles.container}>
        <AppCard>
          <View style={styles.header}>
            <AppText variant="title">{clientFullName(client)}</AppText>
            <StatusBadge status={client.status} />
          </View>

          <View style={styles.fields}>
            <Field label="Email" value={client.email} />
            <Field label="Téléphone" value={client.phone} />
            <Field label="Adresse" value={client.address} />
            <Field label="Ville" value={client.city} />
            <Field label="Code postal" value={client.postal_code} />
            <Field label="Notes" value={client.notes} />
          </View>
        </AppCard>

        <View style={styles.actions}>
          <AppButton
            title="Éditer"
            onPress={() =>
              router.push({
                pathname: '/clients/[id]/edit',
                params: { id: client.id },
              })
            }
          />
          <AppButton
            title="Supprimer"
            variant="danger"
            onPress={confirmDelete}
            loading={deleting}
          />
        </View>
      </ScrollView>
    </>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.field}>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  fields: { gap: spacing.sm },
  field: { gap: spacing.xs },
  actions: { gap: spacing.sm },
});
