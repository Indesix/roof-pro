// src/components/ui/EmptyState.tsx
// Affiché quand une liste est vide ("Aucun client", "Aucun devis"…).
// Optionnellement, propose une action (ex. bouton "Ajouter un client").

import { View, StyleSheet } from 'react-native';
import { ReactNode } from 'react';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { spacing } from '@/constants/spacing';

type EmptyStateProps = {
  title: string;                 // message principal ("Aucun client")
  description?: string;          // précision optionnelle
  icon?: ReactNode;              // emoji ou composant icône optionnel
  actionLabel?: string;          // libellé du bouton (si action voulue)
  onAction?: () => void;         // callback du bouton
};

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  // On n'affiche le bouton que si on a À LA FOIS un libellé et une action.
  const showAction = !!actionLabel && !!onAction;

  return (
    <View style={styles.container}>
      {icon && <View style={styles.icon}>{icon}</View>}

      <AppText variant="title" color="textPrimary" style={styles.title}>
        {title}
      </AppText>

      {description && (
        <AppText variant="body" color="textSecondary" style={styles.description}>
          {description}
        </AppText>
      )}

      {showAction && (
        <View style={styles.action}>
          <AppButton title={actionLabel!} onPress={onAction!} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  action: {
    width: '100%',
  },
});