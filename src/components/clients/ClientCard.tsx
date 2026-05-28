// src/components/clients/ClientCard.tsx
// Carte d'affichage d'un client dans une liste.
// Réutilise les composants du Design System (Jour 2) : AppCard, AppText,
// StatusBadge. Aligné sur le schéma réel (first_name + last_name).

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppCard } from '../ui/AppCard';
import { AppText } from '../ui/AppText';
import { StatusBadge } from '../ui/StatusBadge';
import { type Client, clientFullName } from '../../models/client';
import { spacing } from '../../constants/spacing';

interface ClientCardProps {
  client: Client;
  onPress?: (client: Client) => void;
}

export const ClientCard = memo(function ClientCard({ client, onPress }: ClientCardProps) {
  return (
    <AppCard onPress={onPress ? () => onPress(client) : undefined}>
      <View style={styles.row}>
        <View style={styles.info}>
          <AppText variant="title">{clientFullName(client)}</AppText>
          {/* On affiche le 1er contact dispo : email sinon téléphone */}
          {(client.email || client.phone) && (
            <AppText variant="caption" color="textSecondary">
              {client.email ?? client.phone}
            </AppText>
          )}
        </View>
        {/* StatusBadge gère lui-même couleur + libellé à partir du statut */}
        <StatusBadge status={client.status} />
      </View>
    </AppCard>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
});
