import { z } from 'zod';

/**
 * Plage temporelle optionnelle partagée par les endpoints d'agrégation
 * analytique. Les dates sont fournies en chaîne ISO via la query string et
 * converties en `Date` côté contrôleur/service.
 */
export const DateRangeQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

/**
 * Corps optionnel du recalcul de score : permet de passer la période dans le
 * body en plus (ou à la place) de la query string `?from&to`.
 */
export const RecomputeScoreSchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

export type DateRangeQuery = z.infer<typeof DateRangeQuerySchema>;
export type RecomputeScoreInput = z.infer<typeof RecomputeScoreSchema>;
