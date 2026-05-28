// src/app/_layout.tsx
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { migrateDbIfNeeded } from '@/lib/db';

export default function RootLayout() {
  return (
    // Suspense affiche le spinner tant que la base n'est pas prête
    <Suspense fallback={<DbLoading />}>
      <SQLiteProvider
        databaseName="roofpro.db"
        onInit={migrateDbIfNeeded}
        useSuspense
      >
        {/* Navigation hiérarchique racine (Stack).
            Le groupe (tabs) est un écran de ce Stack. */}
        <Stack >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="clients" options={{ headerShown: false }} />
          <Stack.Screen name="products/[id]" options={{ headerShown: false }} />
          
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}

function DbLoading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});