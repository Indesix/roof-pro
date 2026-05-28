// src/app/quotes/new.tsx
// Écran de CRÉATION d'un devis. Comme products/new.tsx : il monte le
// formulaire et, au submit, appelle le service (createQuoteWithLines, qui
// fait la transaction atomique en-tête + lignes). Puis revient en arrière.

import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { QuoteForm } from '../../components/quotes/QuoteForm';
import { createQuoteWithLines } from '../../services/db/quote.service';
import { type QuoteFormData } from '../../validations/quote.schema';

export default function NewQuoteScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: QuoteFormData) {
    try {
      setLoading(true);
      await createQuoteWithLines(db, data);
      router.back();
    } catch (e) {
      console.error('createQuoteWithLines error:', e);
      Alert.alert('Erreur', "Impossible d'enregistrer le devis.");
    } finally {
      setLoading(false);
    }
  }

  return <QuoteForm onSubmit={handleSubmit} loading={loading} />;
}
