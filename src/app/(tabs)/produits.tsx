// src/app/(tabs)/produits.tsx — DÉMO AppSelect (temporaire, Jour 2)
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppSelect } from '@/components/ui/AppSelect';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/constants/spacing';

export default function ProduitsScreen() {
  // 1. Le state : il contient la VALUE choisie (pas le label), ou null si rien.
  const [statut, setStatut] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* 2. Le select contrôlé */}
      <AppSelect
        label="Statut du devis"
        placeholder="Choisir un statut…"
        options={[
          { label: 'Brouillon', value: 'draft' },
          { label: 'En attente', value: 'pending' },
          { label: 'Accepté', value: 'accepted' },
          { label: 'Refusé', value: 'rejected' },
        ]}
        value={statut}
        onSelect={setStatut}
      />

      {/* 3. Un témoin qui affiche le state en direct — pour VÉRIFIER que ça marche */}
      <AppText variant="body" color="textSecondary" style={styles.debug}>
        Valeur actuelle du state : {statut ?? '(rien)'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  debug: {
    marginTop: spacing.lg,
  },
});