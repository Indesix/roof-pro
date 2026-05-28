// src/components/ui/StatusBadge.tsx
// Pastille colorée indiquant un état (devis accepté, chantier en cours…).
// Mappe un "statut métier" vers une couleur + un libellé lisible.

import { View, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, ColorName } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';

// Les statuts possibles dans l'app. On les centralise ici.
export type Status =
  | 'pending'    // en attente
  | 'accepted'   // accepté
  | 'rejected'   // refusé
  | 'completed'  // terminé
  | 'draft'      // brouillon
  | 'lead'       // client : prospect
  | 'active'     // client : actif
  | 'sent'        // ← ajouté (devis envoyé)
  | 'refused'     // ← ajouté (devis refusé)
  | 'archived';   // ← était 'inactive'
  

// Pour chaque statut : sa couleur sémantique + son libellé affiché (FR).
const STATUS_CONFIG: Record<Status, { color: ColorName; label: string }> = {
  pending:   { color: 'warning', label: 'En attente' },
  accepted:  { color: 'success', label: 'Accepté' },
  rejected:  { color: 'danger',  label: 'Refusé' },
  completed: { color: 'success', label: 'Terminé' },
  draft:     { color: 'info',    label: 'Brouillon' },
  lead:      { color: 'info',    label: 'Prospect' },
  active:    { color: 'success', label: 'Actif' },
  sent:      { color: 'warning',  label: 'Envoyé' },
  refused:   { color: 'danger',  label: 'Refusé' },
  archived:  { color: 'danger',  label: 'Archivé' },
};

type StatusBadgeProps = {
  status: Status;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { color, label } = STATUS_CONFIG[status];

  return (
    <View style={[styles.badge, { backgroundColor: colors[color] }]}>
      <AppText variant="caption" color="onPrimary" style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',   // la pastille ne prend que sa largeur de contenu
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,  // forme "pilule"
  },
  text: {
    fontWeight: '600',
  },
});