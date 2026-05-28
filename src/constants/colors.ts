// src/constants/colors.ts
// Palette centralisée — source unique de vérité pour toutes les couleurs.
// Aucun composant ne doit écrire une couleur "en dur" : il importe d'ici.

export const colors = {
  // Couleur de marque : bleu ardoise (évoque le toit/l'ardoise, sobre et pro)
  primary: '#334E68',        // bleu ardoise principal (boutons, titres forts)
  primaryDark: '#243B53',    // état pressé / accent foncé
  primaryLight: '#627D98',   // variantes douces, icônes secondaires

  // Neutres (la majorité d'une UB pro est faite de gris)
  background: '#F0F4F8',     // fond d'écran général
  surface: '#FFFFFF',        // cartes, inputs, modales
  border: '#D9E2EC',         // bordures fines, séparateurs

  // Texte
  textPrimary: '#102A43',    // texte principal (presque noir, bleuté)
  textSecondary: '#627D98',  // texte secondaire, labels, placeholders
  textDisabled: '#9FB3C8',   // texte désactivé

  // États sémantiques (utilisés par StatusBadge, validations…)
  success: '#0B875B',        // devis accepté, chantier terminé
  warning: '#B45309',        // en attente, à relancer
  danger: '#9B2C2C',         // refusé, erreur, suppression
  info: '#2563EB',           // information neutre

  // Couleurs posées SUR un fond coloré (contraste garanti)
  onPrimary: '#FFFFFF',      // texte blanc sur bouton primaire
  onDanger: '#FFFFFF',
} as const;

// Type dérivé : autorise l'autocomplétion + bloque les fautes de frappe.
// `keyof typeof colors` = 'primary' | 'primaryDark' | ...
export type ColorName = keyof typeof colors;