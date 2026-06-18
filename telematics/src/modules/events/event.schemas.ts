import { z } from 'zod';
import { EventSeverity, EventType } from '@prisma/client';

export const CreateEventSchema = z.object({
  vehicleId: z.string().uuid('Must be a valid vehicle UUID'),
  driverId: z.string().uuid('Must be a valid driver UUID').optional(),
  tripId: z.string().uuid('Must be a valid trip UUID').optional(),
  type: z.nativeEnum(EventType, {
    errorMap: () => ({ message: 'Invalid event type' }),
  }),
  severity: z
    .nativeEnum(EventSeverity, {
      errorMap: () => ({ message: 'Invalid event severity' }),
    })
    .optional()
    .default(EventSeverity.MEDIUM),
  timestamp: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  speedKmh: z.number().nonnegative().optional(),
  speedLimitKmh: z.number().nonnegative().optional(),
  value: z.number().optional(),
  penaltyPoints: z.number().int().nonnegative().optional().default(0),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
