// src/validations/chantier.schema.ts
// Schémas de validation pour le module Chantiers.

import { z } from 'zod';

const STATUSES = ['planned', 'in_progress', 'completed', 'cancelled'] as const;

/**
 * Schéma de mise à jour d'un chantier.
 * Le statut est obligatoire ; les autres champs sont optionnels.
 */
export const chantierUpdateSchema = z.object({
  status: z.enum(STATUSES, { message: 'Statut invalide' }),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes trop longues')
    .transform(v => (v.length === 0 ? null : v))
    .nullable()
    .optional(),
});

export type ChantierUpdateData = z.infer<typeof chantierUpdateSchema>;

/**
 * Schéma de création d'une photo.
 * URI obligatoire (vient du picker), légende optionnelle.
 */
export const photoCreateSchema = z.object({
  uri: z.string().min(1, 'URI requis'),
  caption: z
    .string()
    .trim()
    .max(200, 'Légende trop longue')
    .transform(v => (v.length === 0 ? null : v))
    .nullable()
    .optional(),
});

export type PhotoCreateData = z.infer<typeof photoCreateSchema>;
