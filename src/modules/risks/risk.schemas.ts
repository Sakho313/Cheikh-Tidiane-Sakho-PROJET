import { z } from 'zod';
import { RiskCategory, RiskStatus } from '@prisma/client';

export const CreateRiskSchema = z.object({
  organizationId: z.string().uuid('Must be a valid organization UUID'),
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().min(1, 'Description is required').max(10000),
  category: z.nativeEnum(RiskCategory, {
    errorMap: () => ({ message: 'Invalid risk category' }),
  }),
  likelihood: z
    .number()
    .int('Likelihood must be a whole number')
    .min(1, 'Likelihood must be between 1 and 5')
    .max(5, 'Likelihood must be between 1 and 5'),
  impact: z
    .number()
    .int('Impact must be a whole number')
    .min(1, 'Impact must be between 1 and 5')
    .max(5, 'Impact must be between 1 and 5'),
  status: z
    .nativeEnum(RiskStatus, {
      errorMap: () => ({ message: 'Invalid risk status' }),
    })
    .optional()
    .default(RiskStatus.IDENTIFIED),
  mitigationPlan: z.string().max(5000).optional(),
  ownerId: z.string().uuid('Must be a valid user UUID').optional(),
  reviewDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

export const UpdateRiskSchema = CreateRiskSchema.omit({
  organizationId: true,
}).partial();

export type CreateRiskInput = z.infer<typeof CreateRiskSchema>;
export type UpdateRiskInput = z.infer<typeof UpdateRiskSchema>;
