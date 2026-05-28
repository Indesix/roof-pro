// src/validations/event.schema.ts
// Schéma de validation du formulaire de rendez-vous.
// Aligné sur la table `appointments` (lib/db.ts).
// Convention identique à validations/client.schema.ts (Zod).

import { z } from 'zod';

export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Le titre est requis')
      .max(120, 'Le titre est trop long (120 caractères max)'),

    // ISO 8601 : produit par Date.toISOString().
    // .datetime() garantit une chaîne parsable.
    starts_at: z.string().datetime({ message: 'Date de début invalide' }),
    ends_at: z.string().datetime({ message: 'Date de fin invalide' }),

    // Client OBLIGATOIRE (client_id NOT NULL côté schéma).
    client_id: z
      .number({ message: 'Veuillez sélectionner un client' })
      .int()
      .positive('Client invalide'),

    // Devis optionnel.
    quote_id: z.number().int().positive().nullable().optional(),

    // Textes libres optionnels — chaîne vide → null, comme pour les
    // clients (city, address… stockés à NULL si vide).
    location: z
      .string()
      .trim()
      .max(200, 'Lieu trop long')
      .transform(v => (v.length === 0 ? null : v))
      .nullable()
      .optional(),

    notes: z
      .string()
      .trim()
      .max(2000, 'Notes trop longues')
      .transform(v => (v.length === 0 ? null : v))
      .nullable()
      .optional(),
  })
  // Règle métier : la fin doit être strictement après le début.
  .refine(
    data => new Date(data.ends_at).getTime() > new Date(data.starts_at).getTime(),
    {
      message: "L'heure de fin doit être après l'heure de début",
      path: ['ends_at'],
    }
  );

export type EventFormData = z.infer<typeof eventSchema>;
