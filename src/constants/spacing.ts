// src/constants/spacing.ts
// Échelle d'espacement (8-point grid) + rayons + typographie de base.
// Avoir une échelle fixe = une UI cohérente sans "valeurs au pif".

// Échelle 8pt : chaque pas = multiple de 4/8. Standard de l'industrie mobile.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,   // espacement par défaut le plus courant
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Rayons de bordure (cohérence visuelle des coins arrondis)
export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999, // pour les éléments en "pilule" (badges)
} as const;

// Tailles de police + graisses, nommées par usage (pas par taille brute).
export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  title: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  label: { fontSize: 14, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
} as const;

export type SpacingKey = keyof typeof spacing;
export type TypographyVariant = keyof typeof typography;