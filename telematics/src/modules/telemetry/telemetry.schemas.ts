import { z } from 'zod';

/**
 * Schéma d'une position GPS ingérée (boîtier ou import). Tolérant : seuls
 * `vehicleId`, `latitude` et `longitude` sont requis ; le timestamp est ajouté
 * côté serveur s'il est absent.
 */
export const PositionSchema = z.object({
  vehicleId: z.string().min(1, 'vehicleId is required'),
  timestamp: z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  latitude: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  longitude: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
  speedKmh: z.number().nonnegative('speedKmh must be >= 0').optional(),
  heading: z.number().min(0).max(360).optional(),
  altitude: z.number().optional(),
  ignition: z.boolean().optional(),
  fuelLevelL: z.number().nonnegative('fuelLevelL must be >= 0').optional(),
  odometerKm: z.number().nonnegative('odometerKm must be >= 0').optional(),
  satellites: z.number().int().nonnegative().optional(),
});

/**
 * Corps d'ingestion : soit une position seule, soit `{ positions: [...] }`.
 * Accepte donc indifféremment 1 ou plusieurs positions.
 */
export const IngestSchema = z.union([
  PositionSchema,
  z.object({
    positions: z.array(PositionSchema).min(1, 'positions must contain at least one item'),
  }),
]);

export type PositionInput = z.infer<typeof PositionSchema>;
export type IngestInput = z.infer<typeof IngestSchema>;
