import { Router } from 'express';
import { CompanyModel } from '../models/Company.js';
import { ExitMultipleModel } from '../models/ExitMultiple.js';
import { SubmissionLogModel } from '../models/SubmissionLog.js';
import { StockPriceService } from '../services/stockPriceService.js';
import { calculate5YearIRR, hasSufficientDataForIRR } from '../utils/irrCalculator.js';
import { Company } from '../models/types.js';

const router = Router();

// GET /api/companies - List all companies with calculated IRRs
router.get('/', async (req, res) => {
  try {
    const companies = CompanyModel.findAll();
    
    // Enrich with exit multiples and IRR calculations
    const enriched = companies.map(company => {
      const exitMultiples = ExitMultipleModel.findByCompanyId(company.id!, 5);
      const exitMultiple = exitMultiples.length > 0 ? exitMultiples[0].multiple : null;
      
      let irr: number | null = null;
      if (exitMultiple && hasSufficientDataForIRR(company)) {
        irr = calculate5YearIRR(company, exitMultiple);
      }
      
      return {
        ...company,
        exit_multiple_5yr: exitMultiple,
        irr_5yr: irr,
      };
    });
    
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// GET /api/companies/:ticker - Get single company by ticker
router.get('/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const company = CompanyModel.findByTicker(ticker.toUpperCase());
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const exitMultiples = ExitMultipleModel.findByCompanyId(company.id!, 5);
    const exitMultiple = exitMultiples.length > 0 ? exitMultiples[0].multiple : null;
    
    res.json({
      ...company,
      exit_multiple_5yr: exitMultiple,
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// POST /api/companies - Create or update company (upsert by ticker)
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // Validate required fields
    if (!data.ticker || !data.company_name || !data.fiscal_year_end_date || !data.metric_type || !data.analyst_initials) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Normalize ticker to uppercase
    data.ticker = data.ticker.toUpperCase();
    
    // Convert estimates arrays to fy1-fy11 format if needed
    if (Array.isArray(data.metrics)) {
      for (let i = 0; i < 11; i++) {
        data[`fy${i + 1}_metric`] = data.metrics[i] ?? null;
      }
      delete data.metrics;
    }
    
    if (Array.isArray(data.dividends)) {
      for (let i = 0; i < 11; i++) {
        data[`fy${i + 1}_div`] = data.dividends[i] ?? null;
      }
      delete data.dividends;
    }
    
    // Set default scenario if not provided
    if (!data.scenario) {
      data.scenario = 'base';
    }
    
    // Upsert company
    const company = CompanyModel.upsertByTicker(data as Company);
    
    // Upsert exit multiple if provided
    if (data.exit_multiple_5yr !== undefined && data.exit_multiple_5yr !== null) {
      ExitMultipleModel.upsert({
        company_id: company.id!,
        time_horizon_years: 5,
        multiple: data.exit_multiple_5yr,
      });
    }
    
    // Create submission log entry
    SubmissionLogModel.create({
      company_id: company.id!,
      analyst_initials: data.analyst_initials,
      snapshot_data: JSON.stringify(company),
    });
    
    res.json(company);
  } catch (error) {
    console.error('Error creating/updating company:', error);
    res.status(500).json({ error: 'Failed to create/update company' });
  }
});

// POST /api/companies/:ticker/refresh-price - Refresh single company price
router.post('/:ticker/refresh-price', async (req, res) => {
  try {
    const { ticker } = req.params;
    const normalizedTicker = ticker.toUpperCase();
    
    const company = CompanyModel.findByTicker(normalizedTicker);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const quote = await StockPriceService.getQuote(normalizedTicker);
    
    if (quote.price !== null) {
      CompanyModel.updatePrice(normalizedTicker, quote.price);
      company.current_stock_price = quote.price;
      company.price_last_updated = new Date().toISOString();
    }
    
    res.json({
      ...company,
      price_updated: quote.price !== null,
      price: quote.price,
    });
  } catch (error) {
    console.error('Error refreshing price:', error);
    res.status(500).json({ error: 'Failed to refresh price' });
  }
});

export default router;

