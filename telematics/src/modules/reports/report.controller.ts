import { Request, Response, NextFunction } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { ReportType } from '@prisma/client';
import reportService from './report.service';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { resolveOrgId } from '../../shared/utils/org';
import { GenerateReportInput } from './report.schemas';

export async function getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { type } = req.query as { type?: ReportType };
    const { reports, total, page, limit } = await reportService.findAll(
      orgId,
      req.query as Record<string, unknown>,
      { type },
    );
    paginatedResponse(res, reports, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getReport(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const report = await reportService.findById(orgId, req.params.id);
    successResponse(res, report);
  } catch (err) {
    next(err);
  }
}

export async function generateReport(
  req: Request<Record<string, string>, unknown, GenerateReportInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const generatedById = req.user?.userId ?? null;
    const report = await reportService.generate(orgId, req.body, generatedById);
    successResponse(res, report, 'Report generated successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function deleteReport(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    await reportService.delete(orgId, req.params.id);
    successResponse(res, null, 'Report deleted successfully');
  } catch (err) {
    next(err);
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArrayOfRecords(value: unknown): value is JsonRecord[] {
  return Array.isArray(value) && value.every((v) => isRecord(v));
}

function stringifyCell(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

/**
 * Aplati les sections principales d'un objet `report.data` en feuilles de
 * calcul : chaque tableau d'objets devient une feuille de lignes, et les
 * valeurs scalaires/objets restants sont regroupés dans une feuille "Résumé".
 */
function populateWorkbook(workbook: ExcelJS.Workbook, data: unknown): void {
  const summaryRows: Array<{ key: string; value: string | number | boolean | null }> = [];
  const usedNames = new Set<string>();

  const sheetName = (raw: string): string => {
    // Excel : 31 caractères max, certains caractères interdits.
    const name = raw.replace(/[\\/?*[\]:]/g, ' ').slice(0, 28).trim() || 'Feuille';
    let candidate = name;
    let i = 1;
    while (usedNames.has(candidate.toLowerCase())) {
      candidate = `${name.slice(0, 24)} ${i++}`;
    }
    usedNames.add(candidate.toLowerCase());
    return candidate;
  };

  const addTableSheet = (title: string, rows: JsonRecord[]): void => {
    const sheet = workbook.addWorksheet(sheetName(title));
    if (rows.length === 0) {
      sheet.addRow(['(aucune donnée)']);
      return;
    }
    const columns = Array.from(
      rows.reduce<Set<string>>((set, row) => {
        Object.keys(row).forEach((k) => set.add(k));
        return set;
      }, new Set()),
    );
    sheet.addRow(columns);
    for (const row of rows) {
      sheet.addRow(columns.map((c) => stringifyCell(row[c])));
    }
  };

  if (isRecord(data)) {
    for (const [key, value] of Object.entries(data)) {
      if (isArrayOfRecords(value) && value.length > 0) {
        addTableSheet(key, value);
      } else if (isRecord(value)) {
        // Sous-objet (ex. summary, kpis) → lignes clé/valeur dans le résumé.
        for (const [subKey, subValue] of Object.entries(value)) {
          if (isArrayOfRecords(subValue)) {
            addTableSheet(`${key} ${subKey}`, subValue);
          } else {
            summaryRows.push({ key: `${key}.${subKey}`, value: stringifyCell(subValue) });
          }
        }
      } else {
        summaryRows.push({ key, value: stringifyCell(value) });
      }
    }
  } else {
    summaryRows.push({ key: 'data', value: stringifyCell(data) });
  }

  // Feuille "Résumé" en première position.
  const summary = workbook.addWorksheet(sheetName('Résumé'));
  summary.addRow(['Indicateur', 'Valeur']);
  for (const row of summaryRows) {
    summary.addRow([row.key, row.value]);
  }
  workbook.worksheets.splice(workbook.worksheets.indexOf(summary), 1);
  workbook.worksheets.unshift(summary);
}

function writePdfSection(doc: PDFKit.PDFDocument, title: string, value: unknown): void {
  doc.moveDown(0.5).fontSize(14).text(title, { underline: true });
  doc.fontSize(10);

  if (isArrayOfRecords(value)) {
    value.slice(0, 100).forEach((row, idx) => {
      const line = Object.entries(row)
        .map(([k, v]) => `${k}: ${String(stringifyCell(v) ?? '')}`)
        .join('  |  ');
      doc.text(`${idx + 1}. ${line}`);
    });
    if (value.length > 100) doc.text(`… (${value.length - 100} lignes supplémentaires)`);
  } else if (isRecord(value)) {
    for (const [k, v] of Object.entries(value)) {
      if (isArrayOfRecords(v)) {
        doc.text(`${k}:`);
        v.slice(0, 50).forEach((row) => {
          const line = Object.entries(row)
            .map(([rk, rv]) => `${rk}: ${String(stringifyCell(rv) ?? '')}`)
            .join('  |  ');
          doc.text(`  - ${line}`);
        });
      } else {
        doc.text(`${k}: ${String(stringifyCell(v) ?? '')}`);
      }
    }
  } else {
    doc.text(String(stringifyCell(value) ?? ''));
  }
}

export async function exportReport(
  req: Request<{ id: string }, unknown, unknown, { format?: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const format = (req.query.format ?? 'csv').toLowerCase();
    const report = await reportService.findById(orgId, req.params.id);
    const data = report.data;
    const baseName = `report-${report.id}`;

    if (format === 'csv' || format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      populateWorkbook(workbook, data);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${baseName}.csv"`);
        await workbook.csv.write(res);
      } else {
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', `attachment; filename="${baseName}.xlsx"`);
        await workbook.xlsx.write(res);
      }
      res.end();
      return;
    }

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.pdf"`);

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.pipe(res);

      doc.fontSize(20).text(report.title, { align: 'center' });
      doc.moveDown(0.3).fontSize(10).fillColor('#666');
      doc.text(`Type: ${report.type}`);
      if (report.periodStart) doc.text(`Période début: ${report.periodStart.toISOString()}`);
      if (report.periodEnd) doc.text(`Période fin: ${report.periodEnd.toISOString()}`);
      doc.text(`Généré le: ${report.createdAt.toISOString()}`);
      doc.fillColor('#000');

      if (isRecord(data)) {
        for (const [key, value] of Object.entries(data)) {
          if (key === 'reportType' || key === 'period') continue;
          writePdfSection(doc, key, value);
        }
      } else {
        writePdfSection(doc, 'Données', data);
      }

      doc.end();
      return;
    }

    const error = new Error(`Unsupported export format: ${format}`);
    Object.assign(error, { statusCode: 400 });
    throw error;
  } catch (err) {
    next(err);
  }
}
