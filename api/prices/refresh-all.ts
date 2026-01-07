import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findAllCompanies, updateCompanyPrice } from '../../lib/models/company.js';
import { getPrice } from '../../lib/services/stockPriceService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const companies = await findAllCompanies();
    const results: Array<{
      ticker: string;
      success: boolean;
      price?: number | null;
      error?: string;
    }> = [];
    
    // Process all companies in parallel for better performance
    const pricePromises = companies.map(async (company) => {
      try {
        const price = await getPrice(company.ticker);
        
        if (price !== null) {
          await updateCompanyPrice(company.ticker, price);
          return {
            ticker: company.ticker,
            success: true,
            price,
          };
        } else {
          return {
            ticker: company.ticker,
            success: false,
            error: 'Price unavailable',
          };
        }
      } catch (error) {
        console.error(`Error refreshing price for ${company.ticker}:`, error);
        return {
          ticker: company.ticker,
          success: false,
          error: 'Failed to fetch price',
        };
      }
    });

    const settledResults = await Promise.all(pricePromises);
    
    return res.json({
      total: companies.length,
      results: settledResults,
    });
  } catch (error) {
    console.error('Error refreshing prices:', error);
    return res.status(500).json({ error: 'Failed to refresh prices' });
  }
}

