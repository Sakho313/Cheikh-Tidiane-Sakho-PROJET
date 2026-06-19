import { Request, Response, NextFunction } from 'express';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import telemetryService from './telemetry.service';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { resolveOrgId } from '../../shared/utils/org';
import { IngestSchema, PositionInput, PositionSchema } from './telemetry.schemas';

/** Normalise le corps d'ingestion (objet seul ou `{ positions }`) en tableau. */
function toPositionList(body: unknown): PositionInput[] {
  const parsed = IngestSchema.parse(body);
  if ('positions' in parsed) {
    return parsed.positions;
  }
  return [parsed];
}

export async function ingest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const positions = toPositionList(req.body);
    const summary = await telemetryService.ingest(positions);
    successResponse(res, summary, 'Positions ingested successfully', 201);
  } catch (err) {
    next(err);
  }
}

/** Convertit une ligne brute (CSV/XLSX) en position validée. */
function rowToPosition(row: Record<string, unknown>): PositionInput {
  const num = (val: unknown): number | undefined => {
    if (val === undefined || val === null || val === '') return undefined;
    const n = typeof val === 'number' ? val : Number(String(val).replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
  };

  return PositionSchema.parse({
    vehicleId: String(row['vehicleId'] ?? '').trim(),
    timestamp: row['timestamp'] ? String(row['timestamp']) : undefined,
    latitude: num(row['latitude']),
    longitude: num(row['longitude']),
    speedKmh: num(row['speedKmh']),
  });
}

export async function importPositions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file) {
      const error = new Error('A CSV or Excel file is required (field "file")');
      Object.assign(error, { statusCode: 400 });
      throw error;
    }

    const name = req.file.originalname.toLowerCase();
    let rows: Array<Record<string, unknown>>;

    if (name.endsWith('.csv')) {
      rows = parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Array<Record<string, unknown>>;
    } else {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        const error = new Error('The uploaded workbook has no sheets');
        Object.assign(error, { statusCode: 400 });
        throw error;
      }
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    }

    const positions = rows.map(rowToPosition);
    if (positions.length === 0) {
      const error = new Error('No valid positions found in the file');
      Object.assign(error, { statusCode: 400 });
      throw error;
    }

    const summary = await telemetryService.ingest(positions);
    successResponse(res, summary, 'Positions imported successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function getLive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const live = await telemetryService.live(orgId);
    successResponse(res, live);
  } catch (err) {
    next(err);
  }
}

export async function getVehiclePositions(
  req: Request<{ vehicleId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { from, to } = req.query as { from?: string; to?: string };
    const filters: { from?: Date; to?: Date } = {};
    if (from) filters.from = new Date(from);
    if (to) filters.to = new Date(to);

    const { positions, total, page, limit } = await telemetryService.vehiclePositions(
      orgId,
      req.params.vehicleId,
      req.query as Record<string, unknown>,
      filters,
    );
    paginatedResponse(res, positions, total, page, limit);
  } catch (err) {
    next(err);
  }
}
