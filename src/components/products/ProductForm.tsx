// src/components/products/ProductForm.tsx
// Formulaire produit réutilisé en CRÉATION et en ÉDITION.
// Composant contrôlé + validation Zod au submit. Réutilise le Design System.
// Bouton fixe en bas (hors ScrollView) + SafeArea, comme ClientForm.
//
// Particularité : le prix est saisi en TEXTE (clavier decimal-pad), puis
// converti en number par Zod (z.coerce.number) au moment du submit.

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppInput } from '../ui/AppInput';
import { AppSelect } from '../ui/AppSelect';
import { AppButton } from '../ui/AppButton';
import { productSchema, type ProductFormData } from '../../validations/product.schema';
import { PRODUCT_UNITS, type ProductUnit } from '../../models/product';
import { spacing } from '../../constants/spacing';

interface ProductFormProps {
  // Valeurs de départ pour l'édition. En création : laisser vide.
  // Le prix est passé en string (ce que le champ texte attend).
  initialValues?: {
    name?: string;
    description?: string;
    unit_price?: number;
    unit?: ProductUnit;
  };
  onSubmit: (data: ProductFormData) => Promise<void> | void;
  submitLabel?: string;
  loading?: boolean;
}

const UNIT_OPTIONS = PRODUCT_UNITS.map((u) => ({ value: u, label: u }));

export function ProductForm({
  initialValues,
  onSubmit,
  submitLabel = 'Enregistrer',
  loading = false,
}: ProductFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  // Le prix est stocké en TEXTE dans le state (l'input renvoie du texte).
  // On convertit le number initial en string pour l'affichage en édition.
  const [price, setPrice] = useState(
    initialValues?.unit_price != null ? String(initialValues.unit_price) : ''
  );
  const [unit, setUnit] = useState<ProductUnit>(
    initialValues?.unit ?? 'm²'
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit() {
    // Zod convertit price ("12.50") en number via z.coerce.number().
    const result = productSchema.safeParse({
      name,
      description,
      unit_price: price,
      unit,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit(result.data);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <AppInput
          label="Nom *"
          value={name}
          onChangeText={setName}
          placeholder="Nom du produit"
          error={errors.name}
        />

        <AppInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optionnelle)"
          multiline
          error={errors.description}
        />

        <AppInput
          label="Prix unitaire *"
          value={price}
          onChangeText={setPrice}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.unit_price}
        />

        <AppSelect
          label="Unité *"
          value={unit}
          options={UNIT_OPTIONS}
          onSelect={(v) => setUnit(v as ProductUnit)}
        />
      </ScrollView>

      {/* Bouton fixe en bas, hors de la ScrollView */}
      <View style={styles.footer}>
        <AppButton title={submitLabel} onPress={handleSubmit} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.md, gap: spacing.md },
  footer: { padding: spacing.md },
});
