import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { errorResponse } from '../utils/response';

export function validate(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Zod renvoie le type de sortie du schéma ; on le convertit en `unknown`
      // pour l'assigner à `req.body` sans introduire de valeur `any` non sûre.
      req.body = schema.parse(req.body) as unknown;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        errorResponse(res, 'Validation failed', 400, errors);
        return;
      }
      next(err);
    }
  };
}
