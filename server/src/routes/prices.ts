import { Router } from 'express';
import { CompanyModel } from '../models/Company.js';
import { StockPriceService } from '../services/stockPriceService.js';

const router = Router();

// POST /api/prices/refresh-all - Refresh prices for all companies
router.post('/refresh-all', async (req, res) => {
  try {
    const companies = CompanyModel.findAll();
    const results = [];
    
    for (const company of companies) {
      try {
        const price = await StockPriceService.getPrice(company.ticker);
        
        if (price !== null) {
          CompanyModel.updatePrice(company.ticker, price);
          results.push({
            ticker: company.ticker,
            success: true,
            price,
          });
        } else {
          results.push({
            ticker: company.ticker,
            success: false,
            error: 'Price unavailable',
          });
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error refreshing price for ${company.ticker}:`, error);
        results.push({
          ticker: company.ticker,
          success: false,
          error: 'Failed to fetch price',
        });
      }
    }
    
    res.json({
      total: companies.length,
      results,
    });
  } catch (error) {
    console.error('Error refreshing prices:', error);
    res.status(500).json({ error: 'Failed to refresh prices' });
  }
});

export default router;

