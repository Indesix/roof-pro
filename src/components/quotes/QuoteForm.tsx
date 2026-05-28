// src/components/quotes/QuoteForm.tsx
// Formulaire de COMPOSITION d'un devis (création). Le plus riche du projet.
// Il assemble quatre blocs :
//   1. Client      → AppSelect alimenté par useClients (Jour 3) ;
//   2. Lignes      → tableau qui grandit via QuoteLineEditor (modale) ;
//   3. TVA         → AppSelect alimenté par VAT_RATES (6 % / 21 %) ;
//   4. Récap       → sous-total / TVA / total recalculés EN DIRECT
//                    par computeQuoteTotals (calculateur pur).
//
// Comme ProductForm : composant contrôlé, validation Zod au submit (safeParse),
// et le formulaire NE TOUCHE PAS la base. Il prépare + valide, puis appelle
// onSubmit ; c'est l'écran parent qui enregistre (createQuoteWithLines).

import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppInput } from '../ui/AppInput';
import { AppSelect } from '../ui/AppSelect';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { AppCard } from '../ui/AppCard';
import { QuoteLineEditor } from './QuoteLineEditor';
import { useClients } from '../../hooks/useClients';
import {
  VAT_RATES,
  DEFAULT_VAT_RATE,
  formatPrice,
} from '../../models/quote';
import { computeQuoteTotals, computeLineTotal } from '../../features/quotes/quote.calculator';
import {
  quoteSchema,
  type QuoteFormData,
  type QuoteLineFormData,
} from '../../validations/quote.schema';
import { spacing } from '../../constants/spacing';
import { colors } from '../../constants/colors';

interface QuoteFormProps {
  onSubmit: (data: QuoteFormData) => Promise<void> | void;
  submitLabel?: string;
  loading?: boolean;
}

// Options TVA pour l'AppSelect (value = nombre converti en string pour le select).
const VAT_OPTIONS = VAT_RATES.map((r) => ({
  value: String(r.value),
  label: r.label,
}));

export function QuoteForm({
  onSubmit,
  submitLabel = 'Enregistrer le devis',
  loading = false,
}: QuoteFormProps) {
  const { clients } = useClients();

  const [clientId, setClientId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [vatRate, setVatRate] = useState<number>(DEFAULT_VAT_RATE);
  const [notes, setNotes] = useState('');
  // Le tableau de lignes : c'est lui qui grandit quand on ajoute une ligne.
  const [lines, setLines] = useState<QuoteLineFormData[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Options client pour l'AppSelect (value en string, converti au submit).
  const clientOptions = clients.map((c) => ({
    value: String(c.id),
    label: `${c.first_name} ${c.last_name}`,
  }));

  // Totaux recalculés à chaque changement de lignes ou de taux (calculateur pur).
  const totals = useMemo(
    () => computeQuoteTotals(lines, vatRate),
    [lines, vatRate]
  );

  function addLine(line: QuoteLineFormData) {
    setLines((prev) => [...prev, line]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    // On assemble l'objet et on valide d'un coup avec Zod (lignes incluses).
    const result = quoteSchema.safeParse({
      client_id: clientId ?? undefined,
      title,
      vat_rate: vatRate,
      notes,
      lines,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit(result.data);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. CLIENT */}
        <AppSelect
          label="Client *"
          value={clientId != null ? String(clientId) : ''}
          options={clientOptions}
          onSelect={(v) => setClientId(Number(v))}
        />
        {errors.client_id ? (
          <AppText variant="caption" color="danger">
            {errors.client_id}
          </AppText>
        ) : null}

        {/* Titre */}
        <AppInput
          label="Titre"
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Réfection toiture"
          error={errors.title}
        />

        {/* 2. LIGNES */}
        <AppText variant="h2">Lignes</AppText>

        {lines.length === 0 ? (
          <AppText variant="body" color="textSecondary">
            Aucune ligne pour l'instant.
          </AppText>
        ) : (
          lines.map((line, index) => (
            <AppCard key={index}>
              <View style={styles.lineRow}>
                <View style={styles.lineInfo}>
                  <AppText variant="body">{line.description}</AppText>
                  <AppText variant="caption" color="textSecondary">
                    {line.quantity} {line.unit} × {formatPrice(line.unit_price)}
                  </AppText>
                </View>
                <View style={styles.lineRight}>
                  <AppText variant="body">
                    {formatPrice(
                      computeLineTotal(line.quantity, line.unit_price)
                    )}
                  </AppText>
                  <Pressable onPress={() => removeLine(index)}>
                    <AppText variant="caption" color="danger">
                      Supprimer
                    </AppText>
                  </Pressable>
                </View>
              </View>
            </AppCard>
          ))
        )}

        {errors.lines ? (
          <AppText variant="caption" color="danger">
            {errors.lines}
          </AppText>
        ) : null}

        <AppButton
          title="+ Ajouter une ligne"
          variant="secondary"
          onPress={() => setModalVisible(true)}
        />

        {/* 3. TVA */}
        <AppSelect
          label="Taux de TVA *"
          value={String(vatRate)}
          options={VAT_OPTIONS}
          onSelect={(v) => setVatRate(Number(v))}
        />

        {/* Notes */}
        <AppInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Conditions, délais..."
          multiline
          error={errors.notes}
        />

        {/* 4. RÉCAPITULATIF (calculé en direct) */}
        <View style={styles.summary}>
          <SummaryRow label="Sous-total HT" value={formatPrice(totals.subtotal)} />
          <SummaryRow
            label={`TVA (${Math.round(vatRate * 100)} %)`}
            value={formatPrice(totals.vat_amount)}
          />
          <SummaryRow label="Total TTC" value={formatPrice(totals.total)} strong />
        </View>
      </ScrollView>

      {/* Bouton fixe en bas, hors ScrollView (comme ProductForm) */}
      <View style={styles.footer}>
        <AppButton title={submitLabel} onPress={handleSubmit} loading={loading} />
      </View>

      {/* Modale d'ajout de ligne */}
      <QuoteLineEditor
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addLine}
      />
    </SafeAreaView>
  );
}

// Petite ligne du récapitulatif (label à gauche, montant à droite).
function SummaryRow({
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
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineInfo: { flex: 1, gap: spacing.xs },
  lineRight: { alignItems: 'flex-end', gap: spacing.xs },
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
  footer: { padding: spacing.md },
});
