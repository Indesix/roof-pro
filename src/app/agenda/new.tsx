// src/app/agenda/new.tsx
import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { EventForm } from '../../components/agenda/EventForm';
import { createEvent } from '../../services/db/event.service';

export default function NewEventScreen() {
  const router = useRouter();
  const db = useSQLiteContext();

  return (
    <>
      <Stack.Screen options={{ title: 'Nouveau rendez-vous' }} />
      <EventForm
        submitLabel="Créer le RDV"
        onSubmit={async input => {
          await createEvent(db, input);
          router.back();
        }}
        onCancel={() => router.back()}
      />
    </>
  );
}
