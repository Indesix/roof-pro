// src/app/(tabs)/devis.tsx
// Onglet Devis : liste des devis. Même structure que l'onglet produits :
// hook useQuotes, gestion des 3 états (chargement / vide / données),
// pull-to-refresh, recherche en JS (useMemo), et bouton "+" vers la création.

import React, { useState, useMemo } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuotes } from '../../hooks/useQuotes';
import { QuoteCard } from '../../components/quotes/QuoteCard';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { AppText } from '../../components/ui/AppText';
import { spacing } from '../../constants/spacing';

export default function DevisScreen() {
  const router = useRouter();
  const { quotes, loading, error, refetch } = useQuotes();
  const [search, setSearch] = useState('');

  // Recherche en JS sur la liste chargée (par numéro ou nom de client).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter(
      (item) =>
        item.quote_number.toLowerCase().includes(q) ||
        item.client_name.toLowerCase().includes(q)
    );
  }, [quotes, search]);

  // État 1 : chargement.
  if (loading) {
    return <LoadingSpinner />;
  }

  // État erreur.
  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <AppText variant="body" color="danger">{error}</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <AppInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher (numéro, client)..."
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
        // État 2 : liste vide.
        ListEmptyComponent={
          <EmptyState title="Aucun devis. Créez votre premier devis." />
        }
        // État 3 : données.
        renderItem={({ item }) => (
          <QuoteCard
            quoteNumber={item.quote_number}
            clientName={item.client_name}
            total={item.total}
            status={item.status}
            onPress={() =>
              router.push({
                pathname: '/quotes/[id]',
                params: { id: String(item.id) },
              })
            }
          />
        )}
      />

      <View style={styles.footer}>
        <AppButton
          title="+ Nouveau devis"
          onPress={() => router.push('/quotes/new')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: spacing.md },
  list: { padding: spacing.md, gap: spacing.md },
  footer: { padding: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
