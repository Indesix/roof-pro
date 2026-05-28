// src/components/ui/AppText.tsx
// Composant texte centralisé : remplace le <Text> natif partout dans l'app.
// Garantit que TOUT le texte utilise la même typo et la même palette.

import { Text, TextProps, StyleSheet } from 'react-native';
import { colors, ColorName } from '@/constants/colors';
import { typography, TypographyVariant } from '@/constants/spacing';

// On étend les props natives de <Text> (donc onPress, numberOfLines, etc.
// restent disponibles) et on ajoute nos deux props maison.
type AppTextProps = TextProps & {
  variant?: TypographyVariant;  // 'h1' | 'h2' | 'title' | 'body' | 'label' | 'caption'
  color?: ColorName;            // 'primary' | 'textSecondary' | ...
};

export function AppText({
  variant = 'body',             // valeur par défaut : texte courant
  color = 'textPrimary',
  style,                        // style éventuel passé par l'appelant
  children,
  ...rest                       // toutes les autres props natives de Text
}: AppTextProps) {
  return (
    <Text
      // Ordre important : nos styles d'abord, le style de l'appelant ensuite
      // (pour qu'il puisse surcharger ponctuellement si besoin).
      style={[
        typography[variant],
        { color: colors[color] },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}