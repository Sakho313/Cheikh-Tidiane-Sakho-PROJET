import { z } from 'zod';
import { GeofenceType, GeofenceCategory } from '@prisma/client';

const PolygonSchema = z
  .array(z.tuple([z.number(), z.number()]))
  .min(3, 'Polygon must have at least 3 points ([lng, lat] pairs)');

export const CreateGeofenceSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(2000).optional(),
    type: z
      .nativeEnum(GeofenceType, {
        errorMap: () => ({ message: 'Invalid geofence type' }),
      })
      .optional()
      .default(GeofenceType.CIRCLE),
    category: z
      .nativeEnum(GeofenceCategory, {
        errorMap: () => ({ message: 'Invalid geofence category' }),
      })
      .optional()
      .default(GeofenceCategory.OTHER),
    centerLat: z.number().min(-90).max(90).optional(),
    centerLng: z.number().min(-180).max(180).optional(),
    radiusM: z.number().positive('Radius must be positive').optional(),
    polygon: PolygonSchema.optional(),
    color: z.string().max(20).optional().default('#2563eb'),
    isActive: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.type === GeofenceType.CIRCLE) {
      if (data.centerLat === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['centerLat'],
          message: 'centerLat is required for a CIRCLE geofence',
        });
      }
      if (data.centerLng === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['centerLng'],
          message: 'centerLng is required for a CIRCLE geofence',
        });
      }
      if (data.radiusM === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['radiusM'],
          message: 'radiusM is required for a CIRCLE geofence',
        });
      }
    }

    if (data.type === GeofenceType.POLYGON) {
      if (data.polygon === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['polygon'],
          message: 'polygon is required for a POLYGON geofence',
        });
      }
    }
  });

export const UpdateGeofenceSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255).optional(),
    description: z.string().max(2000).optional(),
    type: z
      .nativeEnum(GeofenceType, {
        errorMap: () => ({ message: 'Invalid geofence type' }),
      })
      .optional(),
    category: z
      .nativeEnum(GeofenceCategory, {
        errorMap: () => ({ message: 'Invalid geofence category' }),
      })
      .optional(),
    centerLat: z.number().min(-90).max(90).optional(),
    centerLng: z.number().min(-180).max(180).optional(),
    radiusM: z.number().positive('Radius must be positive').optional(),
    polygon: PolygonSchema.optional(),
    color: z.string().max(20).optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === GeofenceType.CIRCLE) {
      if (data.centerLat === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['centerLat'],
          message: 'centerLat is required for a CIRCLE geofence',
        });
      }
      if (data.centerLng === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['centerLng'],
          message: 'centerLng is required for a CIRCLE geofence',
        });
      }
      if (data.radiusM === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['radiusM'],
          message: 'radiusM is required for a CIRCLE geofence',
        });
      }
    }

    if (data.type === GeofenceType.POLYGON && data.polygon === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['polygon'],
        message: 'polygon is required for a POLYGON geofence',
      });
    }
  });

export type CreateGeofenceInput = z.infer<typeof CreateGeofenceSchema>;
export type UpdateGeofenceInput = z.infer<typeof UpdateGeofenceSchema>;
