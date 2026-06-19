import { z } from 'zod';
import { TripStatus } from '@prisma/client';

export const UpdateTripSchema = z
  .object({
    driverId: z.string().uuid('Must be a valid driver UUID').nullable().optional(),
    status: z
      .nativeEnum(TripStatus, {
        errorMap: () => ({ message: 'Invalid trip status' }),
      })
      .optional(),
    startAddress: z.string().max(500).optional(),
    endAddress: z.string().max(500).optional(),
  })
  .strict();

export type UpdateTripInput = z.infer<typeof UpdateTripSchema>;
