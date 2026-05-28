// src/components/products/ProductCard.tsx
// Carte d'affichage d'un produit dans une liste.
// Réutilise AppCard, AppText du Design System (Jour 2).

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppCard } from '../ui/AppCard';
import { AppText } from '../ui/AppText';
import { type Product, formatPrice } from '../../models/product';
import { spacing } from '../../constants/spacing';

interface ProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <AppCard onPress={onPress ? () => onPress(product) : undefined}>
      <View style={styles.row}>
        <View style={styles.info}>
          <AppText variant="subtitle">{product.name}</AppText>
          {product.description && (
            <AppText variant="caption" color="textSecondary" numberOfLines={1}>
              {product.description}
            </AppText>
          )}
        </View>

        {/* Prix + unité à droite (ex: "12.50 € / m²") */}
        <AppText variant="subtitle">
          {formatPrice(product.unit_price)} / {product.unit}
        </AppText>
      </View>
    </AppCard>
  );
}

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
