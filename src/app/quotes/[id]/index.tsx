// app/quotes/[id]/index.tsx
// Écran de DÉTAIL d'un devis : en-tête (numéro, statut, totaux) + ses lignes,
// + actions de cycle de vie (changer le statut) + suppression.
// Utilise useQuote (charge en-tête + lignes) et le service pour les actions.
//
// IMPORTANT : le <Stack.Screen options={{ title: 'Devis' }} /> est monté DÈS
// le début du rendu (avant le if loading), pour que le header affiche 'Devis'
// immédiatement et jamais le nom de route brut ([id]/index).

import React, { useState } from 'react';
import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useQuote } from '../../../hooks/useQuote';
import { updateQuoteStatus, deleteQuote } from '../../../services/db/quote.service';
import { exportQuotePdf } from '../../../features/quotes/quote.export';
import { AppText } from '../../../components/ui/AppText';
import { AppCard } from '../../../components/ui/AppCard';
import { AppButton } from '../../../components/ui/AppButton';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { formatPrice, type QuoteStatus } from '../../../models/quote';
import { spacing } from '../../../constants/spacing';
import { colors } from '../../../constants/colors';

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const quoteId = Number(id);
  const router = useRouter();
  const db = useSQLiteContext();

  const { quote, lines, loading, error, refetch } = useQuote(quoteId);
  const [busy, setBusy] = useState(false);

  // Change le statut (draft → sent → accepted / refused) puis recharge.
  async function changeStatus(status: QuoteStatus) {
    try {
      setBusy(true);
      await updateQuoteStatus(db, quoteId, status);
      await refetch();
    } catch (e) {
      console.error('updateQuoteStatus error:', e);
      Alert.alert('Erreur', 'Impossible de changer le statut.');
    } finally {
      setBusy(false);
    }
  }

  // Génère le PDF du devis et ouvre le partage natif.
  async function handleExportPdf() {
    if (!quote) return;
    try {
      setBusy(true);
      await exportQuotePdf(quote, lines);
    } catch (e) {
      console.error('exportQuotePdf error:', e);
      Alert.alert('Erreur', "Impossible de générer le PDF du devis.");
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Supprimer ce devis ?', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteQuote(db, quoteId);
            router.back();
          } catch (e) {
            console.error('deleteQuote error:', e);
            Alert.alert('Erreur', 'Impossible de supprimer le devis.');
          }
        },
      },
    ]);
  }

  // Titre du header : déclaré une seule fois, réutilisé dans chaque branche.
  const header = <Stack.Screen options={{ title: 'Devis' }} />;

  if (loading) {
    return (
      <>
        {header}
        <LoadingSpinner />
      </>
    );
  }

  if (error || !quote) {
    return (
      <>
        {header}
        <SafeAreaView style={styles.safe} edges={['bottom']}>
          <View style={styles.center}>
            <AppText variant="body" color="danger">
              {error ?? 'Devis introuvable.'}
            </AppText>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      {header}
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* En-tête */}
          <View style={styles.headerRow}>
            <AppText variant="h1">{quote.quote_number}</AppText>
            <StatusBadge status={quote.status} />
          </View>
          {quote.title ? (
            <AppText variant="body" color="textSecondary">{quote.title}</AppText>
          ) : null}

          {/* Lignes */}
          <AppText variant="h2">Lignes</AppText>
          {lines.map((line) => (
            <AppCard key={line.id}>
              <View style={styles.lineRow}>
                <View style={styles.lineInfo}>
                  <AppText variant="body">{line.description}</AppText>
                  <AppText variant="caption" color="textSecondary">
                    {line.quantity} {line.unit} × {formatPrice(line.unit_price)}
                  </AppText>
                </View>
                <AppText variant="body">{formatPrice(line.line_total)}</AppText>
              </View>
            </AppCard>
          ))}

          {/* Totaux */}
          <View style={styles.summary}>
            <Row label="Sous-total HT" value={formatPrice(quote.subtotal)} />
            <Row
              label={`TVA (${Math.round(quote.vat_rate * 100)} %)`}
              value={formatPrice(quote.vat_amount)}
            />
            <Row label="Total TTC" value={formatPrice(quote.total)} strong />
          </View>

          {/* Notes */}
          {quote.notes ? (
            <>
              <AppText variant="h2">Notes</AppText>
              <AppText variant="body" color="textSecondary">{quote.notes}</AppText>
            </>
          ) : null}

          {/* Cycle de vie : on n'affiche le titre + les boutons que s'il
              reste une action possible (draft ou sent). Une fois le devis
              accepté ou refusé, le cycle est terminé → message d'état final. */}
          {quote.status === 'draft' || quote.status === 'sent' ? (
            <>
              <AppText variant="h2">Statut</AppText>
              <View style={styles.actions}>
                {quote.status === 'draft' && (
                  <AppButton
                    title="Marquer comme envoyé"
                    onPress={() => changeStatus('sent')}
                    loading={busy}
                  />
                )}
                {quote.status === 'sent' && (
                  <>
                    <AppButton
                      title="Marquer accepté"
                      onPress={() => changeStatus('accepted')}
                      loading={busy}
                    />
                    <AppButton
                      title="Marquer refusé"
                      variant="secondary"
                      onPress={() => changeStatus('refused')}
                      loading={busy}
                    />
                  </>
                )}
              </View>
            </>
          ) : (
            <AppText variant="body" color="textSecondary">
              {quote.status === 'accepted'
                ? 'Ce devis a été accepté. Aucune action supplémentaire.'
                : 'Ce devis a été refusé. Aucune action supplémentaire.'}
            </AppText>
          )}

          {/* Export PDF (génère le devis et ouvre le partage natif) */}
          <AppButton title="Exporter en PDF" onPress={handleExportPdf} loading={busy} />

          {/* Suppression */}
          <AppButton title="Supprimer le devis" variant="secondary" onPress={confirmDelete} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <AppText variant={strong ? 'title' : 'body'} color={strong ? 'primary' : 'textSecondary'}>
        {label}
      </AppText>
      <AppText variant={strong ? 'title' : 'body'}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.md, gap: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineInfo: { flex: 1, gap: spacing.xs },
  summary: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: { gap: spacing.sm },
});
