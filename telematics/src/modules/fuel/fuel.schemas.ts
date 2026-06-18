import { z } from 'zod';
import { FuelRecordType } from '@prisma/client';

export const CreateFuelRecordSchema = z.object({
  vehicleId: z.string().uuid('Must be a valid vehicle UUID'),
  driverId: z.string().uuid('Must be a valid driver UUID').optional(),
  type: z
    .nativeEnum(FuelRecordType, {
      errorMap: () => ({ message: 'Invalid fuel record type' }),
    })
    .optional()
    .default(FuelRecordType.REFUEL),
  timestamp: z
    .string()
    .datetime('Must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val)),
  liters: z.number().positive('Liters must be positive'),
  pricePerLiter: z.number().nonnegative('Price per liter must be >= 0').optional(),
  totalCost: z.number().nonnegative('Total cost must be >= 0').optional(),
  currency: z.string().min(1).max(10).optional().default('XOF'),
  odometerKm: z.number().nonnegative('Odometer must be >= 0').optional(),
  fuelLevelBeforeL: z.number().nonnegative('Fuel level before must be >= 0').optional(),
  fuelLevelAfterL: z.number().nonnegative('Fuel level after must be >= 0').optional(),
  location: z.string().max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  stationName: z.string().max(255).optional(),
  isFullTank: z.boolean().optional().default(true),
  notes: z.string().max(2000).optional(),
});

export const UpdateFuelRecordSchema = CreateFuelRecordSchema.partial();

export type CreateFuelRecordInput = z.infer<typeof CreateFuelRecordSchema>;
export type UpdateFuelRecordInput = z.infer<typeof UpdateFuelRecordSchema>;
