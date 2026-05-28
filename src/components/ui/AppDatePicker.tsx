// src/components/ui/AppDatePicker.tsx
// Sélecteur de date + heure CONTRÔLÉ. La valeur (un objet Date) vient du parent.
// Au tap, ouvre le picker natif. Sur Android : 2 étapes (date puis heure),
// car Android ne sait pas afficher date+heure d'un coup (contrainte plateforme).

import { useState } from 'react';
import { View, Pressable, Platform, StyleSheet } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';

type AppDatePickerProps = {
  label?: string;
  value: Date | null;            // la date sélectionnée (contrôlé), null = rien
  onChange: (date: Date) => void; // appelé quand l'utilisateur valide
  error?: string;
};

export function AppDatePicker({ label, value, onChange, error }: AppDatePickerProps) {
  // 'mode' indique quelle étape on affiche : la date, l'heure, ou rien (fermé).
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  // On mémorise la date choisie à l'étape 1 pour y greffer l'heure à l'étape 2.
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const hasError = !!error;

  // Ouvre le picker en commençant par la date.
  function openPicker() {
    setMode('date');
  }

  // Appelé par le picker natif à chaque interaction.
  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    // L'utilisateur a annulé (bouton retour / annuler) → on ferme tout.
    if (event.type === 'dismissed') {
      setMode(null);
      setTempDate(null);
      return;
    }

    if (mode === 'date' && selected) {
      // Étape 1 terminée : on garde la date et on passe à l'heure.
      setTempDate(selected);
      setMode('time');
    } else if (mode === 'time' && selected && tempDate) {
      // Étape 2 terminée : on fusionne date (de l'étape 1) + heure (étape 2).
      const finalDate = new Date(tempDate);
      finalDate.setHours(selected.getHours());
      finalDate.setMinutes(selected.getMinutes());
      onChange(finalDate);   // remonte le résultat final au parent
      setMode(null);
      setTempDate(null);
    }
  }

  // Formate la date pour l'affichage (ex. "12/03/2026 à 14:30").
  function formatDate(d: Date): string {
    const date = d.toLocaleDateString('fr-FR');
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${date} à ${time}`;
  }

  return (
    <View style={styles.container}>
      {label && (
        <AppText variant="label" color="textSecondary" style={styles.label}>
          {label}
        </AppText>
      )}

      <Pressable
        onPress={openPicker}
        style={[styles.field, hasError && styles.fieldError]}
      >
        <AppText variant="body" color={value ? 'textPrimary' : 'textDisabled'}>
          {value ? formatDate(value) : 'Choisir une date et une heure…'}
        </AppText>
      </Pressable>

      {hasError && (
        <AppText variant="caption" color="danger" style={styles.errorText}>
          {error}
        </AppText>
      )}

      {/* Le picker natif ne s'affiche que quand mode n'est pas null. */}
      {mode && (
        <DateTimePicker
          // valeur de départ : la date temporaire, ou la valeur actuelle, ou maintenant
          value={tempDate ?? value ?? new Date()}
          mode={mode}                         // 'date' puis 'time'
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
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
});