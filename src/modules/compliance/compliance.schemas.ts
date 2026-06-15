import { z } from 'zod';
import { ComplianceStatus } from '@prisma/client';

export const UpsertAssessmentSchema = z.object({
  organizationId: z.string().uuid('Must be a valid organization UUID'),
  controlId: z.string().uuid('Must be a valid control UUID'),
  status: z.nativeEnum(ComplianceStatus, {
    errorMap: () => ({ message: 'Invalid compliance status' }),
  }),
  evidence: z.string().max(5000).optional(),
  notes: z.string().max(2000).optional(),
  assignedToId: z.string().uuid('Must be a valid user UUID').optional(),
  dueDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
});

export const UpdateAssessmentSchema = UpsertAssessmentSchema.omit({
  organizationId: true,
  controlId: true,
}).partial();

export type UpsertAssessmentInput = z.infer<typeof UpsertAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof UpdateAssessmentSchema>;
