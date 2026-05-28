// app/(tabs)/clients.tsx
import React, { useCallback, useState, useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useClients } from '../../hooks/useClients';
import { ClientCard } from '../../components/clients/ClientCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { AppInput } from '../../components/ui/AppInput';
import { AppSelect } from '../../components/ui/AppSelect';
import { type Client, type ClientStatus } from '../../models/client';
import { spacing } from '../../constants/spacing';

// Filtre de statut. 'all' = pas de filtre (tous les clients).
type FilterValue = 'all' | ClientStatus;

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'lead', label: 'Leads' },
  { value: 'active', label: 'Actifs' },
  { value: 'archived', label: 'Archivés' },
];

export default function ClientsScreen() {
  const router = useRouter();

  // Filtre statut (appliqué côté SQL via le hook).
  const [filter, setFilter] = useState<FilterValue>('all');
  // Terme de recherche (appliqué côté JS sur le résultat).
  const [search, setSearch] = useState('');

  const { clients, loading, error, refetch } = useClients(
    filter === 'all' ? {} : { status: filter }
  );

  // Recherche en JS sur prénom + nom. useMemo : on ne recalcule la liste
  // filtrée que si la recherche ou les clients changent (Module 7).
  const visibleClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
      return fullName.includes(q);
    });
  }, [clients, search]);

  // MODULE 7 : référence stable tant que `router` ne change pas.
  const openDetail = useCallback(
    (client: Client) => {
      router.push(`/clients/${client.id}`);
    },
    [router]
  );

  // MODULE 7 : renderItem stable → la FlatList ne recrée pas chaque ligne.
  const renderItem = useCallback(
    ({ item }: { item: Client }) => (
      <ClientCard client={item} onPress={openDetail} />
    ),
    [openDetail]
  );

  if (loading && clients.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <AppText color="danger">{error}</AppText>
        <AppButton title="Réessayer" variant="secondary" onPress={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Recherche + filtre statut */}
      <View style={styles.controls}>
        <AppInput
          label="Rechercher"
          value={search}
          onChangeText={setSearch}
          placeholder="Prénom ou nom..."
          autoCapitalize="none"
        />
        <AppSelect
          label="Filtrer par statut"
          value={filter}
          options={FILTER_OPTIONS}
          onSelect={(v) => setFilter(v as FilterValue)}
        />
      </View>

      <FlatList
        data={visibleClients}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={loading}
        ListEmptyComponent={
          <EmptyState
            title="Aucun client"
            description={
              search.trim()
                ? 'Aucun client ne correspond à votre recherche.'
                : 'Aucun client ne correspond à ce filtre.'
            }
          />
        }
      />

      {/* Bouton toujours visible */}
      <View style={styles.fab}>
        <AppButton
          title="+ Nouveau client"
          onPress={() => router.push('/clients/new')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl * 3 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  fab: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
  },
});
