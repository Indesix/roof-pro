// src/components/ui/LoadingSpinner.tsx
// Indicateur de chargement centré, affiché pendant une requête (SQLite…).
// Optionnellement accompagné d'un message.

import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

type LoadingSpinnerProps = {
  message?: string;              // texte optionnel sous le spinner
  fullScreen?: boolean;          // true = occupe tout l'espace et centre
};

export function LoadingSpinner({
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={colors.primary} />

      {message && (
        <AppText variant="body" color="textSecondary" style={styles.message}>
          {message}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  fullScreen: {
    flex: 1,                     // prend toute la hauteur disponible
  },
  message: {
    marginTop: spacing.md,
  },
});