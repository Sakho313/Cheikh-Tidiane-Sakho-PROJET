import { z } from 'zod';
import { Sector, EntityType } from '@prisma/client';

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(200),
  sector: z.nativeEnum(Sector, {
    errorMap: () => ({ message: 'Invalid sector value' }),
  }),
  entityType: z.nativeEnum(EntityType, {
    errorMap: () => ({ message: 'Entity type must be ESSENTIAL or IMPORTANT' }),
  }),
  country: z.string().min(2, 'Country is required').max(100),
  contactEmail: z
    .string()
    .min(1, 'Contact email is required')
    .email('Must be a valid email address'),
  contactPhone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
