import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { findAllCompanies } from '../../lib/models/company.js';
import { findEstimatesByCompanyId } from '../../lib/models/estimates.js';
import { findExitMultiplesByCompanyId } from '../../lib/models/exitMultiple.js';
import { calculate5YearIRR, hasSufficientDataForIRR } from '../../lib/utils/irrCalculator.js';
import PDFDocument from 'pdfkit';

/**
 * Test endpoint to generate and return PDF snapshot directly (for testing)
 * This returns the PDF as a response instead of storing it
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Get today's date in ET timezone
    const now = new Date();
    const etDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const snapshotDate = etDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Fetch all companies with estimates and IRR calculations
    const companies = await findAllCompanies();
    const enrichedCompanies = await Promise.all(
      companies.map(async (company) => {
        const estimates = await findEstimatesByCompanyId(company.id!, company.metric_type);
        const exitMultiples = await findExitMultiplesByCompanyId(company.id!, 5);
        const exitMultiple = exitMultiples.length > 0 ? exitMultiples[0].multiple : null;

        let irr: number | null = null;
        if (exitMultiple && hasSufficientDataForIRR(company, estimates)) {
          irr = calculate5YearIRR(company, estimates, exitMultiple);
        }

        return {
          ...company,
          estimates,
          exit_multiple_5yr: exitMultiple,
          irr_5yr: irr,
        };
      })
    );

    // Generate PDF directly from data
    const actualTime = new Date();
    const pdfBuffer = await generatePDFFromData(enrichedCompanies, snapshotDate, actualTime);

    // Return PDF directly
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="platinum-list-${snapshotDate}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating test snapshot:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate snapshot',
    });
  }
}

async function generatePDFFromData(companies: any[], date: string, createdAt: Date): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const sortedCompanies = [...companies].sort((a, b) => {
        const aIRR = a.irr_5yr ?? -Infinity;
        const bIRR = b.irr_5yr ?? -Infinity;
        return bIRR - aIRR;
      });

      const formatPercentage = (val: number | null) => {
        if (val === null || val === undefined) return '—';
        return `${(val * 100).toFixed(1)}%`;
      };

      const formatPrice = (val: number | null) => {
        if (val === null || val === undefined) return '—';
        return `$${val.toFixed(2)}`;
      };

      const formatMultiple = (val: number | null) => {
        if (val === null || val === undefined) return '—';
        return `${val.toFixed(1)}x`;
      };

      const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      };

      // PDF margin: 0.1 inch = 7.2 points (72 points per inch) - DO NOT CHANGE
      // PDFKit margin: single number applies uniformly to all sides
      const PDF_MARGIN = 7.2;
      const doc = new PDFDocument({ margin: PDF_MARGIN, size: 'LETTER' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Get the actual margin values from PDFKit
      const leftMargin = doc.page.margins.left;
      const topMargin = doc.page.margins.top;
      
      // Header - use explicit coordinates to match table positioning exactly
      doc.fontSize(20).fillColor('black').text('Platinum List | IRR Tracker', leftMargin, topMargin);
      // Format the actual creation time in ET - use toLocaleTimeString directly on the Date object
      const timeStr = createdAt.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZone: 'America/New_York',
        hour12: true 
      });
      doc.fontSize(10).fillColor('#666666').text(`Dashboard Snapshot @ ${timeStr} ET on ${date}`, leftMargin, doc.y);
      doc.moveDown(2);

      // Column positions (better spacing - use more of the page width with narrow margins)
      const colTicker = 7.2;
      const colCompany = PDF_MARGIN + 62;   // Ticker column width = 62
      const colReturn = colCompany + 154;   // Company column width = 154
      const colPrice = colReturn + 45;    // 5Y Return column width = 45
      const colExit = colPrice + 55;     // Price column width = 55
      const colAnalyst = colExit + 130;  // Exit Multiple column width = 130
      const colUpdated = colAnalyst + 40;  // Analyst column width = 40
      const PAGE_WIDTH = 612; // Letter size page width in points
      const rightMargin = doc.page.margins.right;
      const rightEdge = PAGE_WIDTH - rightMargin;  // Page width minus actual right margin

      // Table headers
      doc.fontSize(9).fillColor('black').font('Helvetica-Bold');
      const headerY = doc.y;
      doc.text('Ticker', colTicker, headerY, { width: 63 });
      doc.text('Company', colCompany, headerY, { width: 147 });
      doc.text('5Y Return', colReturn, headerY, { align: 'center', width: 45 });
      doc.text('Price', colPrice, headerY, { align: 'center', width: 55 });
      doc.text('Exit Multiple', colExit, headerY, { align: 'center', width: 130 });
      doc.text('Analyst', colAnalyst, headerY, { align: 'center', width: 40 });
      doc.text('Updated', colUpdated, headerY, { align: 'right', width: 245 });

      // Draw header line
      doc.moveTo(colTicker, headerY + 15).lineTo(rightEdge, headerY + 15).stroke();
      doc.y = headerY + 18;

      // Table rows
      doc.font('Helvetica').fontSize(9);
      sortedCompanies.forEach((company, index) => {
        // Check if we need a new page
        if (doc.y > 750) {
          doc.addPage();
          // Redraw headers on new page
          const newHeaderY = doc.y;
          doc.font('Helvetica-Bold').fontSize(9);
          doc.text('Ticker', colTicker, newHeaderY, { width: 68 });
          doc.text('Company', colCompany, newHeaderY, { width: 155 });
          doc.text('5Y Return', colReturn, newHeaderY, { align: 'center', width: 45 });
          doc.text('Price', colPrice, newHeaderY, { align: 'center', width: 55 });
          doc.text('Exit Multiple', colExit, newHeaderY, { align: 'center', width: 130 });
          doc.text('Analyst', colAnalyst, newHeaderY, { align: 'center', width: 40 });
          doc.text('Updated', colUpdated, newHeaderY, { align: 'right', width: 245 });
          doc.moveTo(colTicker, newHeaderY + 15).lineTo(rightEdge, newHeaderY + 15).stroke();
          doc.y = newHeaderY + 18;
          doc.font('Helvetica');
        }

        const y = doc.y;

        // Alternate row background (subtle)
        if (index % 2 === 0) {
          doc.rect(colTicker, y - 6, rightEdge - colTicker, 18).fillColor('#f5f5f5').fill().fillColor('black');
        }

        doc.fontSize(9);
        doc.text(company.ticker || '—', colTicker, y, { width: 63 });
        doc.text((company.company_name || '—').substring(0, 30), colCompany, y, { width: 147 });
        doc.text(formatPercentage(company.irr_5yr), colReturn, y, { align: 'center', width: 45 });
        doc.text(formatPrice(company.current_stock_price), colPrice, y, { align: 'center', width: 55 });
        const exitMultipleText = `${formatMultiple(company.exit_multiple_5yr)}${company.exit_multiple_5yr ? ` (${company.metric_type})` : ''}`;
        doc.text(exitMultipleText, colExit, y, { align: 'center', width: 130 });
        doc.text(company.analyst_initials || '—', colAnalyst, y, { align: 'center', width: 40 });
        doc.text(formatDate(company.updated_at), colUpdated, y, { align: 'right', width: 245 });

        doc.y = y + 18;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

