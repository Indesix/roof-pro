// src/components/ui/AppInput.tsx
// Champ de saisie CONTRÔLÉ : sa valeur vient toujours du state du parent.
// Affiche un label optionnel et un message d'erreur optionnel.

import { View, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { spacing, radius, typography } from '@/constants/spacing';

// On étend TextInputProps : keyboardType, autoCapitalize, multiline, etc.
// restent disponibles sans qu'on les redéclare.
type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;            // si présent : bordure rouge + message
};

export function AppInput({
  label,
  error,
  style,
  ...rest                    // value, onChangeText, placeholder, etc.
}: AppInputProps) {
  const hasError = !!error;  // convertit la string (ou undefined) en booléen

  return (
    <View style={styles.container}>
      {label && (
        <AppText variant="label" color="textSecondary" style={styles.label}>
          {label}
        </AppText>
      )}

      <TextInput
        // Le placeholder doit utiliser notre couleur de texte secondaire.
        placeholderTextColor={colors.textDisabled}
        style={[
          styles.input,
          hasError && styles.inputError,
          style,
        ]}
        {...rest}
      />

      {hasError && (
        <AppText variant="caption" color="danger" style={styles.errorText}>
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: spacing.xs,
  },
});