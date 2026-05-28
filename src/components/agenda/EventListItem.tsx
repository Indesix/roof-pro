// src/components/agenda/EventListItem.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  type EventWithRelations,
  getClientFullName,
  getDurationMinutes,
} from '../../models/event';
import { formatTime, formatDuration } from '../../utils/agendaDates';

type Props = {
  event: EventWithRelations;
  onPress: () => void;
};

/**
 * Une ligne de la liste d'agenda.
 * Heure + titre + client (toujours présent) + lieu + devis lié si présent.
 */
export function EventListItem({ event, onPress }: Props) {
  const clientLabel = getClientFullName(event);
  const durationMin = getDurationMinutes(event);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.timeCol}>
        <Text style={styles.time}>{formatTime(event.starts_at)}</Text>
        <Text style={styles.duration}>{formatDuration(durationMin)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.contentCol}>
        <Text style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.client} numberOfLines={1}>
          👤 {clientLabel}
        </Text>
        {event.location && (
          <Text style={styles.location} numberOfLines={1}>
            📍 {event.location}
          </Text>
        )}
        {event.quote_number && (
          <Text style={styles.quote} numberOfLines={1}>
            📄 Devis {event.quote_number}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowPressed: { backgroundColor: '#F3F4F6' },
  timeCol: {
    width: 64,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  time: { fontSize: 16, fontWeight: '600', color: '#111827' },
  duration: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  divider: {
    width: 3,
    backgroundColor: '#2563EB',
    borderRadius: 2,
    marginHorizontal: 12,
  },
  contentCol: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: '#111827' },
  client: { fontSize: 13, color: '#374151', marginTop: 2 },
  location: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  quote: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});
