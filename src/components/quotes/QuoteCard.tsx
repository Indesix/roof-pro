// src/components/quotes/QuoteCard.tsx
// Ligne de liste d'un devis. Même esprit que ProductCard : un AppCard
// cliquable qui résume l'essentiel (numéro, client, total, statut).
// Réutilise le Design System (AppCard, AppText, StatusBadge).

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppCard } from '../ui/AppCard';
import { AppText } from '../ui/AppText';
import { StatusBadge } from '../ui/StatusBadge';
import { formatPrice, type QuoteStatus } from '../../models/quote';
import { spacing } from '../../constants/spacing';

interface QuoteCardProps {
  quoteNumber: string;
  clientName: string;
  total: number;
  status: QuoteStatus;
  onPress: () => void;
}

export function QuoteCard({
  quoteNumber,
  clientName,
  total,
  status,
  onPress,
}: QuoteCardProps) {
  return (
    <AppCard onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.left}>
          <AppText variant="title">{quoteNumber}</AppText>
          <AppText variant="body" color="textSecondary">
            {clientName}
          </AppText>
        </View>

        <View style={styles.right}>
          <AppText variant="title">{formatPrice(total)}</AppText>
          <StatusBadge status={status} />
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: { flex: 1, gap: spacing.xs },
  right: { alignItems: 'flex-end', gap: spacing.xs },
});
