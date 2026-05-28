// app/products/[id]/edit.tsx
// Écran ÉDITION : réutilise ProductForm avec les valeurs existantes.
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useProduct } from '../../../hooks/useProduct';
import { ProductForm } from '../../../components/products/ProductForm';
import { updateProduct } from '../../../services/db/product.service';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { type ProductFormData } from '../../../validations/product.schema';
import { type ProductUnit } from '../../../models/product';

export default function EditProductScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);

  const { product, loading, error } = useProduct(productId);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(data: ProductFormData) {
    try {
      setSaving(true);
      await updateProduct(db, productId, data);
      router.back();
    } catch (e) {
      console.error('updateProduct error:', e);
      Alert.alert('Erreur', 'Impossible de mettre à jour le produit.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner fullScreen />;

  if (error || !product) {
    return (
      <EmptyState
        title="Produit introuvable"
        description={error ?? "Ce produit n'existe pas."}
        actionLabel="Retour"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ProductForm
        initialValues={{
          name: product.name,
          description: product.description ?? undefined,
          unit_price: product.unit_price,
          unit: product.unit as ProductUnit,
        }}
        onSubmit={handleSubmit}
        submitLabel="Enregistrer les modifications"
        loading={saving}
      />
    </>
  );
}
