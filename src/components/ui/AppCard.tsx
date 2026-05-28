// src/components/ui/AppCard.tsx
// Conteneur réutilisable : fond blanc, coins arrondis, ombre légère.
// Sert de "boîte" pour afficher un client, un devis, un RDV dans une liste.
// Cliquable seulement si on lui passe onPress (sinon c'est une simple boîte).

import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';

type AppCardProps = {
  children: ReactNode;        // n'importe quel contenu (texte, lignes, boutons…)
  onPress?: () => void;       // optionnel : si fourni, la carte devient cliquable
  style?: ViewStyle;          // surcharge ponctuelle
};

export function AppCard({ children, onPress, style }: AppCardProps) {
  // Si onPress existe → carte interactive (Pressable).
  // Sinon → simple conteneur (View). On choisit le composant à utiliser.
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    // Ombre légère (iOS via shadow*, Android via elevation).
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  pressed: {
    opacity: 0.7,
  },
});