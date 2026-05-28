// src/components/chantier/ChantierListItem.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  type ChantierWithRelations,
  getClientFullName,
} from '../../models/chantier';
import { StatusBadge } from '../ui/StatusBadge';

type Props = {
  chantier: ChantierWithRelations;
  onPress: () => void;
};

export function ChantierListItem({ chantier, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {chantier.quote_title}
        </Text>
        <StatusBadge status={chantier.status} />
      </View>
      <Text style={styles.client} numberOfLines={1}>
        👤 {getClientFullName(chantier)}
      </Text>
      <Text style={styles.meta}>
        📄 {chantier.quote_number} · 🖼 {chantier.photo_count} photo
        {chantier.photo_count !== 1 ? 's' : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowPressed: { backgroundColor: '#F3F4F6' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  title: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  client: { fontSize: 13, color: '#374151', marginTop: 2 },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 4 },
});
