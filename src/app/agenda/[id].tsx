// src/app/agenda/[id].tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { EventForm } from '../../components/agenda/EventForm';
import {
  deleteEvent,
  getEventById,
  updateEvent,
} from '../../services/db/event.service';
import { type EventWithRelations } from '../../models/event';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = Number(id);
  const router = useRouter();
  const db = useSQLiteContext();

  const [event, setEvent] = useState<EventWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const e = await getEventById(db, eventId);
        if (alive) {
          setEvent(e);
          setLoading(false);
          if (!e) setError('Rendez-vous introuvable.');
        }
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : 'Erreur de chargement.');
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [eventId, db]);

  function confirmDelete() {
    Alert.alert('Supprimer ce rendez-vous ?', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEvent(db, eventId);
            router.back();
          } catch (e) {
            Alert.alert(
              'Erreur',
              e instanceof Error ? e.message : 'Suppression impossible.'
            );
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error ?? 'Rendez-vous introuvable.'}
        </Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  // Reconstitue les pickers à partir des colonnes JOIN.
  const initialClient = {
    id: event.client_id,
    first_name: event.client_first_name,
    last_name: event.client_last_name,
    phone: event.client_phone,
    address: event.client_address,
    city: event.client_city,
    postal_code: event.client_postal_code,
  };
  const initialQuote =
    event.quote_id != null && event.quote_number && event.quote_title
      ? {
          id: event.quote_id,
          quote_number: event.quote_number,
          title: event.quote_title,
          status: '',
          client_id: event.client_id,
        }
      : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Rendez-vous',
          headerRight: () => (
            <Pressable onPress={confirmDelete} hitSlop={8}>
              <Text style={styles.delete}>Supprimer</Text>
            </Pressable>
          ),
        }}
      />
      <EventForm
        initial={{
          title: event.title,
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          client: initialClient,
          quote: initialQuote,
          location: event.location,
          notes: event.notes,
        }}
        submitLabel="Enregistrer"
        onSubmit={async input => {
          await updateEvent(db, eventId, input);
          router.back();
        }}
        onCancel={() => router.back()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  errorText: { color: '#B91C1C', marginBottom: 12, textAlign: 'center' },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  backText: { color: '#fff', fontWeight: '600' },
  delete: { color: '#B91C1C', fontWeight: '600', paddingHorizontal: 8 },
});
