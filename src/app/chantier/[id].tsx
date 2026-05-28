// src/app/chantier/[id].tsx
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { useChantier } from '../../hooks/useChantier';
import {
  addPhoto,
  deleteChantier,
  deletePhoto,
  updateChantier,
} from '../../services/db/chantier.service';
import {
  CHANTIER_STATUS_LABEL,
  type ChantierStatus,
  getClientFullName,
} from '../../models/chantier';
import { chantierUpdateSchema } from '../../validations/chantier.schema';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PhotoGrid } from '../../components/chantier/PhotoGrid';

const STATUSES: ChantierStatus[] = [
  'planned',
  'in_progress',
  'completed',
  'cancelled',
];

export default function ChantierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chantierId = Number(id);
  const router = useRouter();
  const db = useSQLiteContext();

  const { chantier, photos, loading, error, refresh } = useChantier(chantierId);

  // États locaux du formulaire d'édition.
  const [status, setStatus] = useState<ChantierStatus | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Initialisation à la 1ère réception du chantier (puis on respecte
  // les modifications locales de l'utilisateur sans les écraser).
  React.useEffect(() => {
    if (chantier && status === null) {
      setStatus(chantier.status);
      setNotes(chantier.notes ?? '');
    }
  }, [chantier, status]);

  if (loading && !chantier) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !chantier) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Chantier introuvable.'}</Text>
        <Pressable style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  async function handleSave() {
    if (!status) return;
    const parsed = chantierUpdateSchema.safeParse({ status, notes });
    if (!parsed.success) {
      Alert.alert(
        'Formulaire invalide',
        parsed.error.issues[0]?.message ?? 'Données invalides.'
      );
      return;
    }
    setSaving(true);
    try {
      await updateChantier(db, chantierId, parsed.data);
      Alert.alert('Enregistré', 'Le chantier a été mis à jour.');
      refresh();
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : 'Impossible d\'enregistrer.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission refusée',
        'Activez l\'accès à la galerie dans les réglages pour ajouter des photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets?.length) return;

    try {
      await addPhoto(db, chantierId, {
        uri: result.assets[0].uri,
        caption: null,
      });
      refresh();
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : 'Impossible d\'ajouter la photo.'
      );
    }
  }

  async function handleDeletePhoto(photoId: number) {
    await deletePhoto(db, photoId);
    refresh();
  }

  function confirmDeleteChantier() {
    Alert.alert(
      'Supprimer ce chantier ?',
      'Toutes les photos liées seront également supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChantier(db, chantierId);
              router.back();
            } catch (e) {
              Alert.alert(
                'Erreur',
                e instanceof Error ? e.message : 'Suppression impossible.'
              );
            }
          },
        },
      ]
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Chantier',
          headerRight: () => (
            <Pressable onPress={confirmDeleteChantier} hitSlop={8}>
              <Text style={styles.delete}>Supprimer</Text>
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Bloc résumé non éditable */}
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>{chantier.quote_title}</Text>
            <StatusBadge status={chantier.status} />
            <Text style={styles.summaryLine}>
              👤 {getClientFullName(chantier)}
            </Text>
            <Text style={styles.summaryLine}>
              📄 Devis {chantier.quote_number} — {chantier.quote_total.toFixed(2)} €
            </Text>
            {chantier.started_at && (
              <Text style={styles.summaryMeta}>
                Démarré le {new Date(chantier.started_at).toLocaleDateString('fr-FR')}
              </Text>
            )}
            {chantier.completed_at && (
              <Text style={styles.summaryMeta}>
                Terminé le {new Date(chantier.completed_at).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>

          {/* Statut */}
          <Text style={styles.label}>Statut</Text>
          <View style={styles.chipsRow}>
            {STATUSES.map(s => {
              const selected = status === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {CHANTIER_STATUS_LABEL[s]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Notes */}
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Observations terrain, points particuliers…"
            multiline
          />

          {/* Photos */}
          <View style={styles.photosHeader}>
            <Text style={styles.label}>Photos ({photos.length})</Text>
            <Pressable
              onPress={handleAddPhoto}
              style={({ pressed }) => [
                styles.addPhotoBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.addPhotoText}>+ Ajouter</Text>
            </Pressable>
          </View>
          <PhotoGrid photos={photos} onDelete={handleDeletePhoto} />

          {/* Action principale */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[styles.btn, saving && { opacity: 0.6 }, { marginTop: 24 }]}
          >
            <Text style={styles.btnText}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 80 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  errorText: { color: '#B91C1C', marginBottom: 12, textAlign: 'center' },
  delete: { color: '#B91C1C', fontWeight: '600', paddingHorizontal: 8 },

  summary: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    gap: 6,
  },
  summaryTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  summaryLine: { fontSize: 14, color: '#374151', marginTop: 4 },
  summaryMeta: { fontSize: 12, color: '#6B7280' },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 4,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
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

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 20,
  },
  notesInput: { minHeight: 90, textAlignVertical: 'top' },

  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addPhotoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  addPhotoText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  btn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2563EB',
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
