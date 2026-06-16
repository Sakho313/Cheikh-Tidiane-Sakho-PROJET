import { z } from 'zod';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';

export const CreateIncidentSchema = z.object({
  organizationId: z.string().uuid('Must be a valid organization UUID'),
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().min(1, 'Description is required').max(10000),
  severity: z.nativeEnum(IncidentSeverity, {
    errorMap: () => ({ message: 'Invalid severity level' }),
  }),
  status: z
    .nativeEnum(IncidentStatus, {
      errorMap: () => ({ message: 'Invalid incident status' }),
    })
    .optional()
    .default(IncidentStatus.DRAFT),
  incidentType: z.string().min(1, 'Incident type is required').max(100),
  detectedAt: z
    .string()
    .datetime({ message: 'detectedAt must be a valid ISO datetime' })
    .transform((val) => new Date(val)),
  reportedAt: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  resolvedAt: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  affectedSystems: z
    .array(z.string().min(1))
    .min(1, 'At least one affected system must be specified'),
  impactDescription: z.string().max(5000).optional(),
  reportedToAuthority: z.boolean().optional().default(false),
  authorityReference: z.string().max(200).optional(),
  estimatedUsers: z.number().int().positive().optional(),
});

export const UpdateIncidentSchema = CreateIncidentSchema.omit({
  organizationId: true,
}).partial();

export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof UpdateIncidentSchema>;
