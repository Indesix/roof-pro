// src/components/chantier/CreateChantierButton.tsx
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  createChantierFromQuote,
  getChantierByQuoteId,
} from '../../services/db/chantier.service';

type Props = {
  quoteId: number;
  quoteStatus: string;
};

/**
 * Bouton à placer dans la fiche d'un devis.
 * - Si le devis n'est pas 'accepted' → rien (le bouton ne s'affiche pas)
 * - Si le devis a déjà un chantier → bouton « Voir le chantier »
 * - Sinon → bouton « Créer le chantier »
 *
 * C'est l'implémentation concrète de la fonctionnalité 4 du brief :
 * « Transformer un devis en chantier ».
 */
export function CreateChantierButton({ quoteId, quoteStatus }: Props) {
  const db = useSQLiteContext();
  const router = useRouter();
  const [existingChantierId, setExistingChantierId] = useState<number | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  // À l'affichage du devis, on regarde si un chantier existe déjà.
  useEffect(() => {
    if (quoteStatus !== 'accepted') return;
    let alive = true;
    (async () => {
      try {
        const ch = await getChantierByQuoteId(db, quoteId);
        if (alive) setExistingChantierId(ch?.id ?? null);
      } catch {
        // silencieux : le bouton restera en mode "créer", l'erreur
        // remontera à la tentative de création.
      }
    })();
    return () => {
      alive = false;
    };
  }, [db, quoteId, quoteStatus]);

  // Bouton masqué si le devis n'est pas accepté.
  if (quoteStatus !== 'accepted') return null;

  // Cas 1 : chantier existant → bouton de navigation.
  if (existingChantierId != null) {
    return (
      <Pressable
        onPress={() => router.push(`/chantier/${existingChantierId}` as never)}
        style={({ pressed }) => [
          styles.btn,
          styles.btnSecondary,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={styles.btnSecondaryText}>Voir le chantier →</Text>
      </Pressable>
    );
  }

  // Cas 2 : à créer.
  async function handleCreate() {
    setBusy(true);
    try {
      const newId = await createChantierFromQuote(db, quoteId);
      router.push(`/chantier/${newId}` as never);
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : 'Création impossible.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable
      onPress={handleCreate}
      disabled={busy}
      style={({ pressed }) => [
        styles.btn,
        styles.btnPrimary,
        (pressed || busy) && { opacity: 0.85 },
      ]}
    >
      <Text style={styles.btnPrimaryText}>
        {busy ? 'Création…' : '🔨 Créer le chantier'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  btnPrimary: { backgroundColor: '#16A34A' },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  btnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  btnSecondaryText: { color: '#16A34A', fontWeight: '600', fontSize: 15 },
});
