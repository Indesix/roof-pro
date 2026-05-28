// src/app/(tabs)/chantier.tsx
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useChantiers } from '../../hooks/useChantiers';
import { ChantierListItem } from '../../components/chantier/ChantierListItem';
import {
  CHANTIER_STATUS_LABEL,
  type ChantierStatus,
  type ChantierWithRelations,
} from '../../models/chantier';

// Ordre fixe d'affichage des sections.
const STATUS_ORDER: ChantierStatus[] = [
  'in_progress',
  'planned',
  'completed',
  'cancelled',
];

function groupByStatus(
  chantiers: ChantierWithRelations[]
): Array<{ title: string; status: ChantierStatus; data: ChantierWithRelations[] }> {
  const map = new Map<ChantierStatus, ChantierWithRelations[]>();
  for (const ch of chantiers) {
    const arr = map.get(ch.status) ?? [];
    arr.push(ch);
    map.set(ch.status, arr);
  }
  return STATUS_ORDER.filter(s => map.has(s)).map(status => ({
    title: CHANTIER_STATUS_LABEL[status],
    status,
    data: map.get(status)!,
  }));
}

export default function ChantierListScreen() {
  const router = useRouter();
  const { chantiers, loading, error, refresh } = useChantiers();

  const sections = useMemo(() => groupByStatus(chantiers), [chantiers]);

  if (loading && chantiers.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erreur : {error}</Text>
        <Pressable style={styles.retryBtn} onPress={refresh}>
          <Text style={styles.retryText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  if (chantiers.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Aucun chantier</Text>
        <Text style={styles.emptyText}>
          Un chantier se crée depuis la fiche d'un devis accepté.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <ChantierListItem
            chantier={item}
            onPress={() => router.push(`/chantier/${item.id}` as never)}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {section.title} ({section.data.length})
            </Text>
          </View>
        )}
        stickySectionHeadersEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  errorText: { color: '#B91C1C', marginBottom: 12, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: { color: '#6B7280', textAlign: 'center' },
  sectionHeader: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
