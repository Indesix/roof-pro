// src/components/quotes/QuoteLineEditor.tsx
// Modale d'AJOUT d'une ligne de devis, en deux temps :
//   1. chercher un produit du catalogue (réutilise useProducts + filtre JS
//      en useMemo, exactement comme la recherche du Jour 4) ;
//   2. choisir la quantité → la ligne est prête.
//
// Au valider, on renvoie au formulaire parent une ligne au format attendu par
// quoteLineSchema : { product_id, description, quantity, unit, unit_price }.
// Le total de ligne est calculé en direct via computeLineTotal (calculateur pur).

import React, { useState, useMemo } from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { AppModal } from '../ui/AppModal';
import { AppInput } from '../ui/AppInput';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { EmptyState } from '../ui/EmptyState';
import { useProducts } from '../../hooks/useProducts';
import { type Product, formatPrice } from '../../models/product';
import { computeLineTotal } from '../../features/quotes/quote.calculator';
import { type QuoteLineFormData } from '../../validations/quote.schema';
import { spacing } from '../../constants/spacing';
import { colors } from '../../constants/colors';

interface QuoteLineEditorProps {
  visible: boolean;
  onClose: () => void;
  // Renvoie la ligne prête au formulaire parent.
  onAdd: (line: QuoteLineFormData) => void;
}

export function QuoteLineEditor({ visible, onClose, onAdd }: QuoteLineEditorProps) {
  const { products } = useProducts();

  // Produit sélectionné (null tant qu'on n'a pas choisi → on affiche la recherche).
  const [selected, setSelected] = useState<Product | null>(null);
  // Texte de recherche et quantité (saisie en texte, convertie au valider).
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState<string | null>(null);

  // Recherche en JS sur la liste déjà chargée (mémoïsée), pattern du Jour 4.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  // Remet tout à zéro (à l'ouverture/fermeture).
  function reset() {
    setSelected(null);
    setSearch('');
    setQuantity('1');
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleConfirm() {
    if (!selected) return;

    const qty = Number(quantity.replace(',', '.'));
    if (Number.isNaN(qty) || qty <= 0) {
      setError('La quantité doit être un nombre supérieur à 0.');
      return;
    }

    // Ligne au format quoteLineSchema. La description est recopiée du produit.
    onAdd({
      product_id: selected.id,
      description: selected.name,
      quantity: qty,
      unit: selected.unit,
      unit_price: selected.unit_price,
    });

    reset();
    onClose();
  }

  return (
    <AppModal visible={visible} onClose={handleClose} title="Ajouter une ligne">
      {selected == null ? (
        // --- ÉTAPE 1 : recherche produit -----------------------------------
        <View style={styles.container}>
          <AppInput
            label="Rechercher un produit"
            value={search}
            onChangeText={setSearch}
            placeholder="Ex: tuile, isolant, main d'œuvre..."
          />

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <EmptyState title="Aucun produit trouvé." />
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.productRow}
                onPress={() => setSelected(item)}
              >
                <AppText variant="body">{item.name}</AppText>
                <AppText variant="caption" color="textSecondary">
                  {formatPrice(item.unit_price)} / {item.unit}
                </AppText>
              </Pressable>
            )}
          />
        </View>
      ) : (
        // --- ÉTAPE 2 : quantité --------------------------------------------
        <View style={styles.container}>
          <View style={styles.selectedBox}>
            <AppText variant="title">{selected.name}</AppText>
            <AppText variant="body" color="textSecondary">
              {formatPrice(selected.unit_price)} / {selected.unit}
            </AppText>
          </View>

          <AppInput
            label={`Quantité (${selected.unit})`}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            placeholder="1"
            error={error ?? undefined}
          />

          {/* Total de la ligne calculé en direct (calculateur pur). */}
          <AppText variant="title">
            Total ligne :{' '}
            {formatPrice(
              computeLineTotal(
                Number(quantity.replace(',', '.')) || 0,
                selected.unit_price
              )
            )}
          </AppText>

          <View style={styles.actions}>
            <AppButton
              title="Changer de produit"
              variant="secondary"
              onPress={() => setSelected(null)}
            />
            <AppButton title="Ajouter la ligne" onPress={handleConfirm} />
          </View>
        </View>
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  list: { maxHeight: 280 },
  productRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  selectedBox: { gap: spacing.xs },
  actions: { gap: spacing.sm },
});
