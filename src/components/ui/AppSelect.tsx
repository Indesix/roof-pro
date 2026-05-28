// src/components/ui/AppSelect.tsx
// Sélecteur (menu déroulant) CONTRÔLÉ : la valeur vient du parent.
// Au tap, ouvre une AppModal listant les options. Pas de Picker natif
// (incohérent iOS/Android) — on réutilise nos propres composants.

import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { AppModal } from '@/components/ui/AppModal';
import { colors } from '@/constants/colors';
import { spacing, radius, typography } from '@/constants/spacing';

// Une option = ce qu'on affiche (label) + ce qu'on stocke (value).
export type SelectOption = {
  label: string;
  value: string;
};

type AppSelectProps = {
  label?: string;                 // libellé au-dessus du champ
  placeholder?: string;           // texte si rien n'est sélectionné
  options: SelectOption[];        // la liste des choix
  value: string | null;           // la value sélectionnée (contrôlé)
  onSelect: (value: string) => void;  // appelé au choix d'une option
  error?: string;
};

export function AppSelect({
  label,
  placeholder = 'Sélectionner…',
  options,
  value,
  onSelect,
  error,
}: AppSelectProps) {
  const [open, setOpen] = useState(false);  // état d'ouverture de la modale
  const hasError = !!error;

  // Retrouve l'option correspondant à la value pour afficher son label.
  const selected = options.find((opt) => opt.value === value);

  return (
    <View style={styles.container}>
      {label && (
        <AppText variant="label" color="textSecondary" style={styles.label}>
          {label}
        </AppText>
      )}

      {/* Le "faux champ" : au tap, on ouvre la modale. */}
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.field, hasError && styles.fieldError]}
      >
        <AppText
          variant="body"
          color={selected ? 'textPrimary' : 'textDisabled'}
        >
          {selected ? selected.label : placeholder}
        </AppText>
      </Pressable>

      {hasError && (
        <AppText variant="caption" color="danger" style={styles.errorText}>
          {error}
        </AppText>
      )}

      {/* La modale de choix : réutilise AppModal. */}
      <AppModal visible={open} onClose={() => setOpen(false)} title={label}>
        <View style={styles.optionsList}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  onSelect(opt.value);   // remonte le choix au parent
                  setOpen(false);        // ferme la modale
                }}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <AppText
                  variant="body"
                  color={isSelected ? 'primary' : 'textPrimary'}
                >
                  {opt.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </AppModal>
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
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: spacing.xs,
  },
  optionsList: {
    gap: spacing.xs,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  optionSelected: {
    backgroundColor: colors.background,
  },
  optionPressed: {
    opacity: 0.6,
  },
});