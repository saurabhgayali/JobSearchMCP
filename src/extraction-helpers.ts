/**
 * Extraction Error Tracking and CSV Report Generation Helpers
 * 
 * Provides utilities for:
 * - Tracking successful job extractions
 * - Tracking extraction failures (404s, timeouts, network errors, etc.)
 * - Generating CSV reports for both success and error cases
 */

import * as fs from 'fs';

export interface ExtractedJob {
  company: string;
  jobTitle: string;
  description: string;
  expiryDate: string;
  applyLink: string;
}

export interface ExtractionError {
  company: string;
  url: string;
  errorCode: string;
  httpStatus: number | string;
  errorMessage: string;
  attemptedAt: string;
}

export interface ExtractionReport {
  successfulJobs: ExtractedJob[];
  failedExtractions: ExtractionError[];
}

/**
 * Escape CSV field value - handle quotes and newlines
 */
export function escapeCSVField(value: string): string {
  if (!value) return '';
  return value.replace(/"/g, '""').replace(/\n/g, ' ').trim();
}

/**
 * Generate CSV row from field values
 */
export function generateCSVRow(fields: string[]): string {
  return fields.map((field) => `"${escapeCSVField(field)}"`).join(',');
}

/**
 * Generate successful jobs CSV content
 */
export function generateSuccessCSV(jobs: ExtractedJob[]): string {
  const rows: string[] = ['Company,JobTitle,Description,ExpiryDate,ApplyLink'];

  for (const job of jobs) {
    const row = generateCSVRow([
      job.company,
      job.jobTitle,
      job.description,
      job.expiryDate,
      job.applyLink,
    ]);
    rows.push(row);
  }

  return rows.join('\n');
}

/**
 * Generate extraction errors CSV content
 */
export function generateErrorsCSV(errors: ExtractionError[]): string {
  const rows: string[] = ['Company,URL,ErrorCode,HTTPStatus,ErrorMessage,AttemptedAt'];

  for (const err of errors) {
    const row = generateCSVRow([
      err.company,
      err.url,
      err.errorCode,
      String(err.httpStatus),
      err.errorMessage,
      err.attemptedAt,
    ]);
    rows.push(row);
  }

  return rows.join('\n');
}

/**
 * Write reports to CSV files and console
 */
export function writeExtractionReports(
  report: ExtractionReport,
  successFilePath: string,
  errorFilePath: string
): void {
  // Write success CSV
  if (report.successfulJobs.length > 0) {
    const successCsv = generateSuccessCSV(report.successfulJobs);
    console.log('\n' + '='.repeat(80));
    console.log('CSV Report 1 - Successful Job Extractions');
    console.log('='.repeat(80) + '\n');
    console.log(successCsv);
    fs.writeFileSync(successFilePath, successCsv, 'utf-8');
    console.log(`\n✅ Success report saved to: ${successFilePath}`);
  }

  // Write error CSV
  if (report.failedExtractions.length > 0) {
    const errorCsv = generateErrorsCSV(report.failedExtractions);
    console.log('\n' + '='.repeat(80));
    console.log('CSV Report 2 - Extraction Errors (404s, Timeouts, etc.)');
    console.log('='.repeat(80) + '\n');
    console.log(errorCsv);
    fs.writeFileSync(errorFilePath, errorCsv, 'utf-8');
    console.log(`\n✅ Error report saved to: ${errorFilePath}`);
  }
}

/**
 * Print extraction summary
 */
export function printExtractionSummary(report: ExtractionReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('Summary');
  console.log('='.repeat(80));
  console.log(`✅ Successful Extractions: ${report.successfulJobs.length}`);
  console.log(`⚠️  Extraction Errors: ${report.failedExtractions.length}`);

  if (report.failedExtractions.length > 0) {
    const errorByCode: { [key: string]: number } = {};
    for (const err of report.failedExtractions) {
      errorByCode[err.errorCode] = (errorByCode[err.errorCode] || 0) + 1;
    }
    console.log('\nErrors by Type:');
    for (const [code, count] of Object.entries(errorByCode)) {
      console.log(`  ${code}: ${count}`);
    }
  }
  console.log('\n' + '='.repeat(80));
}
