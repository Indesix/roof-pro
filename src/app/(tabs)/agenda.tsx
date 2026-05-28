// src/app/(tabs)/agenda.tsx — DÉMO AppSelect + AppDatePicker dans AppModal (temporaire, Jour 2)
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppModal } from '@/components/ui/AppModal';
import { AppSelect } from '@/components/ui/AppSelect';
import { AppDatePicker } from '@/components/ui/AppDatePicker';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/constants/spacing';

export default function AgendaScreen() {
  const [formVisible, setFormVisible] = useState(false);      // modale formulaire
  const [statut, setStatut] = useState<string | null>(null);  // select
  const [dateRdv, setDateRdv] = useState<Date | null>(null);  // date picker

  return (
    <View style={styles.container}>
      <AppButton title="Nouveau rendez-vous" onPress={() => setFormVisible(true)} />

      {/* Témoins de debug : on voit les deux states en direct */}
      <AppText variant="body" color="textSecondary" style={styles.debug}>
        Statut : {statut ?? '(rien)'}
      </AppText>
      <AppText variant="body" color="textSecondary" style={styles.debug}>
        Date : {dateRdv ? dateRdv.toLocaleString('fr-FR') : '(rien)'}
      </AppText>

      <AppModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        title="Nouveau rendez-vous"
      >
        <AppSelect
          label="Statut"
          placeholder="Choisir…"
          options={[
            { label: 'En attente', value: 'pending' },
            { label: 'Confirmé', value: 'confirmed' },
            { label: 'Annulé', value: 'cancelled' },
          ]}
          value={statut}
          onSelect={setStatut}
        />

        <AppDatePicker
          label="Date et heure"
          value={dateRdv}
          onChange={setDateRdv}
        />

        <AppButton
          title="Valider"
          onPress={() => {
            console.log('RDV →', { statut, date: dateRdv?.toISOString() });
            setFormVisible(false);
          }}
        />
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  debug: { marginTop: spacing.sm, textAlign: 'center' },
});