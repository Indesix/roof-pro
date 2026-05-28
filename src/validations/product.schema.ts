// src/validations/product.schema.ts
// Validation du formulaire produit avec Zod (Module 5), alignée sur le
// schéma SQL. Le type du formulaire est inféré depuis le schéma (z.infer).
//
// POINT TECHNIQUE : unit_price est un REAL en base (number), mais un
// <AppInput> renvoie toujours du TEXTE ("12.50"). On convertit donc la
// saisie texte en nombre avant de valider, avec z.coerce.number().

import { z } from 'zod';
import { PRODUCT_UNITS } from '../models/product';

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

export const productSchema = z.object({
  // Nom obligatoire.
  name: z
    .string({ message: 'Le nom est obligatoire' })
    .trim()
    .min(2, 'Le nom doit faire au moins 2 caractères')
    .max(100, 'Le nom est trop long'),

  // Description facultative.
  description: z.preprocess(
    emptyToUndefined,
    z.string().max(500, 'Description trop longue').optional()
  ),

  // Prix : z.coerce.number() transforme "12.50" (texte de l'input) en 12.5
  // avant de valider. Doit être un nombre strictement positif.
  unit_price: z.coerce
    .number({ message: 'Le prix doit être un nombre' })
    .positive('Le prix doit être supérieur à 0'),

  // Unité : doit faire partie des unités autorisées.
  unit: z.enum(PRODUCT_UNITS, { message: "L'unité est obligatoire" }),
});

// Type des données du formulaire, inféré depuis le schéma.
// NB : grâce à z.coerce, unit_price est de type `number` dans ce type.
export type ProductFormData = z.infer<typeof productSchema>;
