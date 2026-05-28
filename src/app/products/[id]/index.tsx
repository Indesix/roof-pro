// app/products/[id]/index.tsx
// Écran DÉTAIL d'un produit. Affiche les infos, propose Éditer et Supprimer.
import React, { useState } from 'react';
import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useProduct } from '../../../hooks/useProduct';
import { deleteProduct } from '../../../services/db/product.service';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { AppCard } from '../../../components/ui/AppCard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { formatPrice } from '../../../models/product';
import { spacing } from '../../../constants/spacing';

export default function ProductDetailScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);

  const { product, loading, error } = useProduct(productId);
  const [deleting, setDeleting] = useState(false);

  function confirmDelete() {
    Alert.alert('Supprimer ce produit ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: handleDelete },
    ]);
  }

  async function handleDelete() {
    try {
      setDeleting(true);
      await deleteProduct(db, productId);
      router.back();
    } catch (e) {
      console.error('deleteProduct error:', e);
      Alert.alert('Erreur', 'Impossible de supprimer le produit.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <LoadingSpinner fullScreen />;

  if (error || !product) {
    return (
      <EmptyState
        title="Produit introuvable"
        description={error ?? "Ce produit n'existe pas ou a été supprimé."}
        actionLabel="Retour"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.container}>
        <AppCard>
          <AppText variant="title">{product.name}</AppText>
          <AppText variant="label" >
            {formatPrice(product.unit_price)} / {product.unit}
          </AppText>

          {product.description && (
            <View style={styles.field}>
              <AppText variant="caption" color="textSecondary">Description</AppText>
              <AppText>{product.description}</AppText>
            </View>
          )}
        </AppCard>

        <View style={styles.actions}>
          <AppButton
            title="Éditer"
            onPress={() =>
              router.push({
                pathname: '/products/[id]/edit',
                params: { id: product.id },
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

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md },
  field: { gap: spacing.xs, marginTop: spacing.sm },
  actions: { gap: spacing.sm },
});
