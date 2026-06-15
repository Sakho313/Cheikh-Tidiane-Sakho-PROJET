import { z } from 'zod';
import {
  AuditType,
  AuditStatus,
  FindingSeverity,
  FindingStatus,
} from '@prisma/client';

export const CreateAuditSchema = z.object({
  organizationId: z.string().uuid('Must be a valid organization UUID'),
  title: z.string().min(1, 'Title is required').max(300),
  type: z.nativeEnum(AuditType, {
    errorMap: () => ({ message: 'Invalid audit type' }),
  }),
  status: z
    .nativeEnum(AuditStatus, {
      errorMap: () => ({ message: 'Invalid audit status' }),
    })
    .optional()
    .default(AuditStatus.PLANNED),
  startDate: z
    .string()
    .datetime({ message: 'startDate must be a valid ISO datetime' })
    .transform((val) => new Date(val)),
  endDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  auditorId: z.string().uuid('Must be a valid user UUID').optional(),
  scope: z.string().max(5000).optional(),
  methodology: z.string().max(5000).optional(),
  summary: z.string().max(10000).optional(),
});

export const UpdateAuditSchema = CreateAuditSchema.omit({
  organizationId: true,
}).partial();

export const CreateFindingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().min(1, 'Description is required').max(10000),
  severity: z.nativeEnum(FindingSeverity, {
    errorMap: () => ({ message: 'Invalid finding severity' }),
  }),
  status: z
    .nativeEnum(FindingStatus, {
      errorMap: () => ({ message: 'Invalid finding status' }),
    })
    .optional()
    .default(FindingStatus.OPEN),
  controlId: z.string().uuid('Must be a valid control UUID').optional(),
  recommendation: z.string().max(5000).optional(),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

export const UpdateFindingSchema = CreateFindingSchema.partial();

export type CreateAuditInput = z.infer<typeof CreateAuditSchema>;
export type UpdateAuditInput = z.infer<typeof UpdateAuditSchema>;
export type CreateFindingInput = z.infer<typeof CreateFindingSchema>;
export type UpdateFindingInput = z.infer<typeof UpdateFindingSchema>;
