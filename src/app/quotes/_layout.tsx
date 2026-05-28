// app/quotes/_layout.tsx
// Stack du module devis (création, détail).
// Les titres sont définis par chaque écran via <Stack.Screen options>,
// exactement comme products/_layout.tsx.
import { Stack } from 'expo-router';

export default function QuotesStackLayout() {
  return <Stack>
    <Stack.Screen name="new" options={{ title: 'Nouveau devis' }} />
  <Stack.Screen name="[id]/index" options={{ title: 'Devis' }} />
</Stack>;
}
