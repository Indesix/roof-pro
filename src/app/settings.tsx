// src/app/settings.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function SettingsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Paramètres' }} />
      <View style={styles.container}>
        <Text>Écran Paramètres (à venir)</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});