// src/components/agenda/EventForm.tsx
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { ClientPicker, type PickableClient } from './ClientPicker';
import { QuotePicker, type PickableQuote } from './QuotePicker';
import { addMinutesIso, formatDateTime } from '../../utils/agendaDates';
import {
  eventSchema,
  type EventFormData,
} from '../../validations/event.schema';

type Props = {
  initial?: {
    title: string;
    starts_at: string;
    ends_at: string;
    client: PickableClient;
    quote: PickableQuote | null;
    location: string | null;
    notes: string | null;
  };
  submitLabel: string;
  onSubmit: (input: EventFormData) => Promise<void>;
  onCancel?: () => void;
};

const DURATION_PRESETS = [
  { label: '30 min', value: 30 },
  { label: '1 h', value: 60 },
  { label: '1 h 30', value: 90 },
  { label: '2 h', value: 120 },
];

function durationFromDates(startsAtIso: string, endsAtIso: string): number {
  const ms =
    new Date(endsAtIso).getTime() - new Date(startsAtIso).getTime();
  return Math.max(0, Math.round(ms / 60_000));
}

function nextRoundHour(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

export function EventForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [startAt, setStartAt] = useState<Date>(
    initial ? new Date(initial.starts_at) : nextRoundHour()
  );
  const [duration, setDuration] = useState(
    initial ? durationFromDates(initial.starts_at, initial.ends_at) : 60
  );
  const [client, setClient] = useState<PickableClient | null>(
    initial?.client ?? null
  );
  const [quote, setQuote] = useState<PickableQuote | null>(
    initial?.quote ?? null
  );
  const [location, setLocation] = useState(initial?.location ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);

  function handleClientChange(c: PickableClient | null) {
    setClient(c);
    setQuote(null);
    if (c && !location.trim()) {
      const parts = [c.address, c.postal_code, c.city].filter(Boolean);
      if (parts.length > 0) setLocation(parts.join(' '));
    }
  }

  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);

  function onDateTimeChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setPickerMode(null);
    if (event.type === 'dismissed' || !selected) return;
    if (pickerMode === 'date') {
      const next = new Date(startAt);
      next.setFullYear(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate()
      );
      setStartAt(next);
    } else if (pickerMode === 'time') {
      const next = new Date(startAt);
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setStartAt(next);
    }
  }

  async function handleSubmit() {
    if (!client) {
      Alert.alert('Client requis', 'Veuillez sélectionner un client.');
      return;
    }

    const startsAtIso = startAt.toISOString();
    const endsAtIso = addMinutesIso(startsAtIso, duration);

    const parsed = eventSchema.safeParse({
      title,
      starts_at: startsAtIso,
      ends_at: endsAtIso,
      client_id: client.id,
      quote_id: quote?.id ?? null,
      location,
      notes,
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      Alert.alert('Formulaire invalide', first?.message ?? 'Données invalides.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : 'Impossible d’enregistrer.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // KeyboardAvoidingView : décale le contenu vers le haut quand le
    // clavier apparaît. Le comportement diffère entre iOS et Android :
    //  - iOS : 'padding' ajoute du padding-bottom égal à la hauteur clavier
    //  - Android : 'height' réduit la hauteur dispo (Android gère déjà
    //    une partie du décalage nativement via android:windowSoftInputMode)
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      // keyboardVerticalOffset compense la hauteur du header de navigation
      // (sans ça, le contenu peut être décalé trop haut ou trop bas).
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Titre *">
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Métré, visite de chantier…"
            maxLength={120}
          />
        </Field>

        <Field label="Client *">
          <ClientPicker
            value={client}
            onChange={handleClientChange}
            required
            placeholder="Sélectionner un client"
          />
        </Field>

        <Field label="Date et heure">
          <Pressable onPress={() => setPickerMode('date')} style={styles.input}>
            <Text style={styles.inputText}>
              {formatDateTime(startAt.toISOString())}
            </Text>
          </Pressable>
          <View style={styles.dateRow}>
            <Pressable
              onPress={() => setPickerMode('date')}
              style={[styles.smallBtn, styles.smallBtnGhost]}
            >
              <Text style={styles.smallBtnGhostText}>Changer la date</Text>
            </Pressable>
            <Pressable
              onPress={() => setPickerMode('time')}
              style={[styles.smallBtn, styles.smallBtnGhost]}
            >
              <Text style={styles.smallBtnGhostText}>Changer l'heure</Text>
            </Pressable>
          </View>
          {pickerMode && (
            <DateTimePicker
              value={startAt}
              mode={pickerMode}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateTimeChange}
            />
          )}
        </Field>

        <Field label="Durée">
          <View style={styles.chipsRow}>
            {DURATION_PRESETS.map(p => {
              const selected = duration === p.value;
              return (
                <Pressable
                  key={p.value}
                  onPress={() => setDuration(p.value)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Devis lié">
          <QuotePicker
            value={quote}
            onChange={setQuote}
            filterByClientId={client?.id ?? null}
          />
        </Field>

        <Field label="Lieu">
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Adresse ou indication"
            multiline
          />
        </Field>

        <Field label="Notes">
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Détails du rendez-vous…"
            multiline
          />
        </Field>

        <View style={styles.actions}>
          {onCancel && (
            <Pressable
              onPress={onCancel}
              disabled={submitting}
              style={[styles.btn, styles.btnGhost]}
            >
              <Text style={styles.btnGhostText}>Annuler</Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[
              styles.btn,
              styles.btnPrimary,
              submitting && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.btnPrimaryText}>
              {submitting ? 'Enregistrement…' : submitLabel}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 80 },
  field: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  inputText: { fontSize: 15, color: '#111827' },
  notesInput: { minHeight: 90, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  smallBtnGhost: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  smallBtnGhostText: { color: '#374151', fontSize: 13, fontWeight: '500' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  chipSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { color: '#374151', fontSize: 14 },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: '#2563EB' },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  btnGhost: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  btnGhostText: { color: '#374151', fontWeight: '600', fontSize: 15 },
});
