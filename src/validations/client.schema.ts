// src/validations/client.schema.ts
// Validation du formulaire client avec Zod (Module 5), ALIGNÉE sur le
// schéma SQL réel (first_name/last_name, city, postal_code, status).
// Le schéma est l'unique source de vérité : on infère le type du
// formulaire depuis lui (z.infer).

import { z } from 'zod';
import { CLIENT_STATUSES } from '../models/client';

// Transforme une chaîne vide "" en undefined (un AppInput non rempli
// renvoie "" et non null).
const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

export const clientSchema = z.object({
  // Prénom et nom obligatoires (colonnes NOT NULL).
  first_name: z
    .string({ message: 'Le prénom est obligatoire' })
    .trim()
    .min(2, 'Le prénom doit faire au moins 2 caractères')
    .max(50, 'Le prénom est trop long'),

  last_name: z
    .string({ message: 'Le nom est obligatoire' })
    .trim()
    .min(2, 'Le nom doit faire au moins 2 caractères')
    .max(50, 'Le nom est trop long'),

  // Email facultatif, validé s'il est rempli.
  email: z.preprocess(
    emptyToUndefined,
    z.string().email("L'email n'est pas valide").optional()
  ),

  phone: z.preprocess(
    emptyToUndefined,
    z.string().min(6, 'Le téléphone est trop court').max(20, 'Trop long').optional()
  ),

  address: z.preprocess(
    emptyToUndefined,
    z.string().max(200, 'Adresse trop longue').optional()
  ),

  city: z.preprocess(
    emptyToUndefined,
    z.string().max(100, 'Ville trop longue').optional()
  ),

  postal_code: z.preprocess(
    emptyToUndefined,
    z.string().max(20, 'Code postal trop long').optional()
  ),

  notes: z.preprocess(
    emptyToUndefined,
    z.string().max(1000, 'Notes trop longues').optional()
  ),

  // Statut : doit faire partie des valeurs autorisées par le CHECK SQL.
  status: z.enum(CLIENT_STATUSES).default('lead'),
});

// Type des données du formulaire, inféré depuis le schéma.
export type ClientFormData = z.infer<typeof clientSchema>;
