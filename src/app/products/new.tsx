// app/products/new.tsx
// Écran de CRÉATION d'un produit.
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ProductForm } from '../../components/products/ProductForm';
import { createProduct } from '../../services/db/product.service';
import { type ProductFormData } from '../../validations/product.schema';

export default function NewProductScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(data: ProductFormData) {
    try {
      setSaving(true);
      await createProduct(db, data);
      router.back();
    } catch (e) {
      console.error('createProduct error:', e);
      Alert.alert('Erreur', "Impossible d'enregistrer le produit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Nouveau produit' }} />
      <ProductForm
        onSubmit={handleSubmit}
        submitLabel="Créer le produit"
        loading={saving}
      />
    </>
  );
}
