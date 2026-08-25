import { z } from 'zod';
import { DriverStatus } from '@prisma/client';

export const CreateDriverSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  licenseNumber: z.string().min(1, 'License number is required').max(50),
  licenseCategory: z.string().max(20).optional(),
  licenseExpiry: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  phone: z.string().max(30).optional(),
  email: z.string().email('Must be a valid email address').optional(),
  dateOfBirth: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  hireDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  status: z
    .nativeEnum(DriverStatus, {
      errorMap: () => ({ message: 'Invalid driver status' }),
    })
    .optional()
    .default(DriverStatus.ACTIVE),
});

export const UpdateDriverSchema = CreateDriverSchema.partial();

export type CreateDriverInput = z.infer<typeof CreateDriverSchema>;
export type UpdateDriverInput = z.infer<typeof UpdateDriverSchema>;
