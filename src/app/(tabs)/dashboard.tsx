// src/app/(tabs)/dashboard.tsx — VERSION TEMPORAIRE DE DEBUG
// (on mettra le vrai dashboard au Jour 7)
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/constants/spacing';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Tabs, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

export default function DashboardScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [tables, setTables] = useState<string[]>([]);
  const [version, setVersion] = useState<number | null>(null);
  const [nom, setNom] = useState('');
  useEffect(() => {
    async function check() {
      // Liste les tables créées (on exclut les tables système de SQLite)
      const rows = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );
      setTables(rows.map((r) => r.name));

      // Lit la version du schéma
      const v = await db.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version'
      );
      setVersion(v?.user_version ?? null);
    }
    check();
  }, [db]);
  
  return (
    <>
      <Tabs.Screen
        options={{
          title: 'Dashboard',
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/settings')}
              style={{ paddingHorizontal: spacing.md }}
            >
              <AppText style={{ fontSize: 22 }}>⚙️</AppText>
            </Pressable>
          ),
        }}
      />
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>✅ Vérification base de données</Text>
      <Text>Version du schéma : {version}</Text>
      <Text style={styles.subtitle}>Tables créées ({tables.length}) :</Text>
      {tables.map((t) => (
        <Text key={t}>• {t}</Text>
      ))}
       <AppButton title="Enregistrer" onPress={() => {}} />
  <AppButton title="Annuler" variant="secondary" onPress={() => {}} />
  <AppButton title="Supprimer" variant="danger" onPress={() => {}} />
  <AppButton title="Chargement…" loading onPress={() => {}} />
  <AppButton title="Indisponible" disabled onPress={() => {}} />
    <AppInput
    label="Nom"
    placeholder="Entrez votre nom"
    value={nom}
    onChangeText={setNom}
  />
  
<AppCard>
  <AppText variant="title">Jean Dupont</AppText>
  <AppText variant="body" color="textSecondary">06 12 34 56 78</AppText>
</AppCard>


<AppCard onPress={() => console.log('ouvrir le client')} style={{ marginTop: spacing.md }}>
  <AppText variant="title">Devis #2024-001</AppText>
  <AppText variant="body" color="textSecondary">Toiture — 4 250 €</AppText>
</AppCard>
<AppCard>
  <AppText variant="title">Devis #2024-001</AppText>
  <StatusBadge status="pending" />
  <StatusBadge status="accepted" />
  <StatusBadge status="rejected" />
  <StatusBadge status="draft" />
  <StatusBadge status="completed" />
</AppCard>
<EmptyState title="Aucun client" />
<EmptyState
  icon={<AppText style={{ fontSize: 48 }}>📭</AppText>}
  title="Aucun client pour l'instant"
  description="Ajoutez votre premier client pour commencer à créer des devis."
  actionLabel="Ajouter un client"
  onAction={() => console.log('aller vers création client')}
/>
<LoadingSpinner />


<LoadingSpinner fullScreen message="Chargement des clients…" />
    </ScrollView>
    </KeyboardAvoidingView>
  </> );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    gap: 8,            // espace régulier entre tous les éléments
    paddingBottom: 100,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  subtitle: { marginTop: 12, fontWeight: '600' },
});