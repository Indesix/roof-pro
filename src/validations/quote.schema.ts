// src/validations/quote.schema.ts
// Validation du formulaire Devis avec Zod (Module 5), alignée sur le schéma SQL.
// Le type du formulaire est inféré depuis le schéma (z.infer), comme au Jour 4.
//
// NOUVEAUTÉ par rapport à Clients/Produits : un devis n'est pas un objet plat,
// c'est un EN-TÊTE qui contient une LISTE de LIGNES. On écrit donc deux schémas :
//   - quoteLineSchema  : valide UNE ligne ;
//   - quoteSchema      : valide l'en-tête + un tableau de lignes (z.array).
// Zod applique automatiquement quoteLineSchema à chaque élément du tableau.
//
// RAPPEL TECHNIQUE (Jour 4) : les champs numériques sont saisis en TEXTE par
// les <AppInput>. On les convertit en nombre avec z.coerce.number() avant de
// valider (ex: "2.5" → 2.5).

import { z } from 'zod';
import { VAT_RATES } from '../models/quote';

// Liste des taux de TVA autorisés, extraite de VAT_RATES (source unique).
// Ex: [0.06, 0.21]. Sert à vérifier que le taux choisi est bien permis.
const ALLOWED_VAT_RATES: number[] = VAT_RATES.map((r) => r.value);

// --- Schéma d'UNE ligne de devis -------------------------------------------
export const quoteLineSchema = z.object({
  // Lien optionnel vers un produit du catalogue. Peut être null si la ligne
  // a été saisie à la main (SET NULL côté SQL).
  product_id: z.number().nullable(),

  // Description obligatoire (recopiée du produit, mais éditable).
  description: z
    .string({ message: 'La description est obligatoire' })
    .trim()
    .min(1, 'La description est obligatoire')
    .max(200, 'Description trop longue'),

  // Quantité : texte → nombre, strictement positive.
  quantity: z.coerce
    .number({ message: 'La quantité doit être un nombre' })
    .positive('La quantité doit être supérieure à 0'),

  // Unité (m² / ml / pièce / h / forfait), recopiée du produit.
  unit: z.string().min(1, "L'unité est obligatoire"),

  // Prix unitaire : texte → nombre, strictement positif.
  unit_price: z.coerce
    .number({ message: 'Le prix doit être un nombre' })
    .positive('Le prix doit être supérieur à 0'),
});

export type QuoteLineFormData = z.infer<typeof quoteLineSchema>;

// --- Schéma de l'EN-TÊTE du devis ------------------------------------------
export const quoteSchema = z.object({
  // Client obligatoire : un devis est toujours rattaché à un client.
  client_id: z
    .number({ message: 'Veuillez choisir un client' })
    .int()
    .positive('Veuillez choisir un client'),

  // Titre facultatif (ex: "Réfection toiture rue des Lilas").
  title: z
    .string()
    .trim()
    .max(120, 'Titre trop long')
    .optional(),

  // Taux de TVA : doit faire partie des valeurs autorisées (0.06 / 0.21).
  // .refine() = règle personnalisée : ici "la valeur est-elle dans la liste ?".
  vat_rate: z.coerce
    .number({ message: 'Taux de TVA invalide' })
    .refine((v) => ALLOWED_VAT_RATES.includes(v), {
      message: 'Le taux de TVA doit être 6 % ou 21 %',
    }),

  // Notes facultatives (conditions, délais...).
  notes: z
    .string()
    .trim()
    .max(1000, 'Notes trop longues')
    .optional(),

  // Les lignes : un tableau d'objets, chacun validé par quoteLineSchema.
  // .min(1) → un devis doit contenir AU MOINS une ligne (pas de devis vide).
  lines: z
    .array(quoteLineSchema)
    .min(1, 'Ajoutez au moins une ligne au devis'),
});

// Type des données du formulaire, inféré depuis le schéma.
export type QuoteFormData = z.infer<typeof quoteSchema>;
