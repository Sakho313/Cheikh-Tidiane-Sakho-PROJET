import { z } from 'zod';
import { MaintenanceType, MaintenanceStatus } from '@prisma/client';

export const CreateMaintenanceSchema = z.object({
  vehicleId: z.string().uuid('Must be a valid vehicle UUID'),
  type: z.nativeEnum(MaintenanceType, {
    errorMap: () => ({ message: 'Invalid maintenance type' }),
  }),
  status: z
    .nativeEnum(MaintenanceStatus, {
      errorMap: () => ({ message: 'Invalid maintenance status' }),
    })
    .optional()
    .default(MaintenanceStatus.SCHEDULED),
  description: z.string().max(2000).optional(),
  scheduledDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  completedDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  dueOdometerKm: z.number().nonnegative('Due odometer must be >= 0').optional(),
  cost: z.number().nonnegative('Cost must be >= 0').optional(),
  currency: z.string().max(10).optional().default('XOF'),
  vendor: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const UpdateMaintenanceSchema = CreateMaintenanceSchema.omit({
  vehicleId: true,
}).partial();

export type CreateMaintenanceInput = z.infer<typeof CreateMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof UpdateMaintenanceSchema>;
