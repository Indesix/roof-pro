// src/app/(tabs)/clients.tsx — DÉMO design system (temporaire, Jour 2)
// Montre les 3 états d'une liste : chargement → vide → données.
import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { spacing } from '@/constants/spacing';

// Type local juste pour la démo (les vrais clients viendront de la base).
type DemoClient = {
  id: number;
  name: string;
  phone: string;
  status: 'accepted' | 'pending';
};

export default function ClientsScreen() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<DemoClient[]>([]);

  useEffect(() => {
    // Simule une requête asynchrone de 1,5 s, puis remplit la liste.
    const timer = setTimeout(() => {
      setClients([
        { id: 1, name: 'Jean Dupont', phone: '06 12 34 56 78', status: 'accepted' },
        { id: 2, name: 'Marie Martin', phone: '06 98 76 54 32', status: 'pending' },
        { id: 3, name: 'Toiture Express SARL', phone: '03 22 11 00 99', status: 'accepted' },
      ]);
      setLoading(false);
    }, 1500);

    // Nettoyage : annule le timer si l'écran est quitté avant la fin.
    return () => clearTimeout(timer);
  }, []);

  // --- État 1 : chargement ---
  if (loading) {
    return <LoadingSpinner fullScreen message="Chargement des clients…" />;
  }

  // --- État 2 : liste vide ---
  if (clients.length === 0) {
    return (
      <EmptyState
        icon={<AppText style={{ fontSize: 48 }}>📭</AppText>}
        title="Aucun client"
        description="Ajoutez votre premier client pour commencer."
        actionLabel="Ajouter un client"
        onAction={() => console.log('aller vers création client')}
      />
    );
  }

  // --- État 3 : données ---
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppText variant="h2" style={styles.heading}>
        Clients ({clients.length})
      </AppText>

      {clients.map((c) => (
        <AppCard key={c.id} onPress={() => console.log('ouvrir', c.name)}>
          <View style={styles.cardHeader}>
            <AppText variant="title">{c.name}</AppText>
            <StatusBadge status={c.status} />
          </View>
          <AppText variant="body" color="textSecondary">{c.phone}</AppText>
        </AppCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  heading: { marginBottom: spacing.xs },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
});