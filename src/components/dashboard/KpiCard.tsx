// src/components/dashboard/KpiCard.tsx
// Carte d'un indicateur du tableau de bord : une valeur en gros + un libellé.
// Réutilise AppCard + AppText du Design System. Pas cliquable par défaut.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppCard } from '../ui/AppCard';
import { AppText } from '../ui/AppText';
import { spacing } from '../../constants/spacing';
import { type ColorName } from '../../constants/colors';

interface KpiCardProps {
  label: string;
  value: string;          // déjà formaté (ex: "5 360,00 €", "75 %", "12")
  color?: ColorName;      // couleur de la valeur (def. primary)
}

export function KpiCard({ label, value, color = 'primary' }: KpiCardProps) {
  return (
    <AppCard>
      <View style={styles.content}>
        <AppText variant="h1" color={color}>{value}</AppText>
        <AppText variant="caption" color="textSecondary">{label}</AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xs },
});
