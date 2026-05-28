// src/app/(tabs)/dashboard.tsx
// Tableau de bord : 4 cartes de KPIs (CA, devis en attente, taux de conversion,
// clients actifs) + un graphique en anneau de la répartition des devis par
// statut. Les données viennent du hook useDashboard (agrégation SQL).
//
// Le graphique utilise react-native-chart-kit (PieChart). Installation :
//   npx expo install react-native-chart-kit react-native-svg

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { useDashboard } from '../../hooks/useDashboard';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { AppText } from '../../components/ui/AppText';
import { AppCard } from '../../components/ui/AppCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatPrice, QUOTE_STATUS_LABELS } from '../../models/quote';
import { spacing } from '../../constants/spacing';

// Couleurs du donut, cohérentes avec les statuts (gris/bleu/vert/rouge).
const STATUS_COLORS: Record<string, string> = {
  draft: '#9AA5B1',     // gris  (brouillon)
  sent: '#4A90D9',      // bleu  (envoyé)
  accepted: '#2E9E5B',  // vert  (accepté)
  refused: '#D0493B',   // rouge (refusé)
};

export default function DashboardScreen() {
  const { stats, loading, error } = useDashboard();
  // Largeur réelle de la carte du graphique, mesurée via onLayout (responsive).
  const [chartWidth, setChartWidth] = useState(0);

  if (loading) return <LoadingSpinner />;

  if (error || !stats) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <AppText variant="body" color="danger">
            {error ?? 'Données indisponibles.'}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // Données du donut : un segment par statut ayant au moins 1 devis.
  const pieData = (Object.keys(stats.byStatus) as Array<keyof typeof stats.byStatus>)
    .filter((status) => stats.byStatus[status] > 0)
    .map((status) => ({
      name: QUOTE_STATUS_LABELS[status],
      population: stats.byStatus[status],
      color: STATUS_COLORS[status],
      legendFontColor: '#444',
      legendFontSize: 13,
    }));

  const hasQuotes = pieData.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* 4 KPIs en grille 2×2 */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <KpiCard label="Chiffre d'affaires" value={formatPrice(stats.revenue)} color="success" />
          </View>
          <View style={styles.gridItem}>
            <KpiCard label="Devis en attente" value={String(stats.pendingQuotes)} color="primary" />
          </View>
          <View style={styles.gridItem}>
            <KpiCard label="Taux de conversion" value={`${stats.conversionRate} %`} color="primary" />
          </View>
          <View style={styles.gridItem}>
            <KpiCard label="Clients actifs" value={String(stats.activeClients)} color="primary" />
          </View>
        </View>

        {/* Donut : répartition des devis par statut */}
        <AppText variant="h2">Répartition des devis</AppText>
        <AppCard>
          <View
            style={styles.chartBox}
            onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
          >
            {hasQuotes && chartWidth > 0 ? (
              <>
                {/* Donut centré, sans légende intégrée (on fait la nôtre) */}
                <PieChart
                  data={pieData}
                  width={chartWidth}
                  height={200}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft={`${chartWidth / 4}`}
                  hasLegend={false}
                  chartConfig={{ color: () => '#000' }}
                />

                {/* Légende custom, EN DESSOUS du donut */}
                <View style={styles.legend}>
                  {pieData.map((item) => (
                    <View key={item.name} style={styles.legendItem}>
                      <View style={[styles.dot, { backgroundColor: item.color }]} />
                      <AppText variant="caption" color="textSecondary">
                        {item.name} ({item.population})
                      </AppText>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <EmptyState message="Aucun devis à afficher pour l'instant." />
            )}
          </View>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.md, gap: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  // Deux colonnes : chaque carte prend ~la moitié de la largeur.
  gridItem: { width: '47%' },
  chartBox: { alignItems: 'center' },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
