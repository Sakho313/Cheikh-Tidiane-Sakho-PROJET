import { z } from 'zod';
import { ReportType } from '@prisma/client';

export const GenerateReportSchema = z.object({
  type: z.nativeEnum(ReportType, {
    errorMap: () => ({ message: 'Invalid report type' }),
  }),
  periodStart: z.string().datetime({ offset: true }).optional(),
  periodEnd: z.string().datetime({ offset: true }).optional(),
  vehicleId: z.string().uuid('Must be a valid UUID').optional(),
  driverId: z.string().uuid('Must be a valid UUID').optional(),
});

export type GenerateReportInput = z.infer<typeof GenerateReportSchema>;
