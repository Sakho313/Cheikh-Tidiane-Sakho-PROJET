import { z } from 'zod';
import { AlertType, AlertSeverity, AlertStatus } from '@prisma/client';

export const CreateAlertSchema = z.object({
  vehicleId: z.string().uuid('Must be a valid vehicle UUID').optional(),
  driverId: z.string().uuid('Must be a valid driver UUID').optional(),
  type: z.nativeEnum(AlertType, {
    errorMap: () => ({ message: 'Invalid alert type' }),
  }),
  severity: z
    .nativeEnum(AlertSeverity, {
      errorMap: () => ({ message: 'Invalid alert severity' }),
    })
    .optional()
    .default(AlertSeverity.MEDIUM),
  status: z
    .nativeEnum(AlertStatus, {
      errorMap: () => ({ message: 'Invalid alert status' }),
    })
    .optional()
    .default(AlertStatus.OPEN),
  title: z.string().min(1, 'Title is required').max(255),
  message: z.string().max(2000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type CreateAlertInput = z.infer<typeof CreateAlertSchema>;
