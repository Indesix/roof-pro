// app/(tabs)/produits.tsx
// Onglet Produits : liste du catalogue + recherche par nom.
// Même structure que l'écran clients (3 états, recherche JS, FlatList,
// bouton toujours visible), mais sans filtre statut.

import React, { useCallback, useState, useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from '../../components/products/ProductCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { AppInput } from '../../components/ui/AppInput';
import { type Product } from '../../models/product';
import { spacing } from '../../constants/spacing';

export default function ProduitsScreen() {
  const router = useRouter();
  const { products, loading, error, refetch } = useProducts();
  const [search, setSearch] = useState('');

  // Recherche en JS sur le nom (mémoïsée, Module 7).
  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const openDetail = useCallback(
    (product: Product) => {
      router.push({ pathname: '/products/[id]', params: { id: product.id } });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard product={item} onPress={openDetail} />
    ),
    [openDetail]
  );

  if (loading && products.length === 0) {
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
      <View style={styles.controls}>
        <AppInput
          label="Rechercher"
          value={search}
          onChangeText={setSearch}
          placeholder="Nom du produit..."
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={visibleProducts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={loading}
        ListEmptyComponent={
          <EmptyState
            title="Aucun produit"
            description={
              search.trim()
                ? 'Aucun produit ne correspond à votre recherche.'
                : 'Ajoutez votre premier produit au catalogue.'
            }
          />
        }
      />

      <View style={styles.fab}>
        <AppButton
          title="+ Nouveau produit"
          onPress={() => router.push('/products/new')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl * 3, flexGrow: 1 },
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
