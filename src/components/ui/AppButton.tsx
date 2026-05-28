// src/components/ui/AppButton.tsx
// Bouton centralisé avec 3 variantes, état désactivé et état "chargement".
// Utilise Pressable (recommandé RN) pour un feedback visuel à l'appui.

import { Pressable, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;          // affiche un spinner et bloque l'appui
  style?: ViewStyle;          // surcharge ponctuelle si besoin
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: AppButtonProps) {
  // Un bouton est inactif s'il est désactivé OU en cours de chargement.
  const isInactive = disabled || loading;

  // Couleur de fond selon la variante.
  const backgroundColor = {
    primary: colors.primary,
    secondary: colors.surface,
    danger: colors.danger,
  }[variant];

  // Couleur du texte selon la variante.
  const textColor = ({
    primary: 'onPrimary',
    secondary: 'primary',
    danger: 'onDanger',
  } as const)[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      // `pressed` est fourni par Pressable : on l'utilise pour assombrir au toucher.
      style={({ pressed }) => [
        styles.base,
        { backgroundColor },
        variant === 'secondary' && styles.secondaryBorder,
        pressed && !isInactive && styles.pressed,
        isInactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' ? colors.primary : colors.onPrimary}
        />
      ) : (
        <AppText variant="title" color={textColor}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,            // cible tactile confortable (>= 44pt recommandé)
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,            // feedback visuel à l'appui
  },
  inactive: {
    opacity: 0.5,             // état désactivé / chargement
  },
});