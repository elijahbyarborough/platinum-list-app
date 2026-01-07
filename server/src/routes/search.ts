import { Router } from 'express';
import { StockPriceService } from '../services/stockPriceService.js';

const router = Router();

// GET /api/search?q=AAPL - Search for ticker symbols
router.get('/', async (req, res) => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.length < 1) {
      return res.json([]);
    }
    
    const results = await StockPriceService.search(query);
    res.json(results);
  } catch (error) {
    console.error('Error searching tickers:', error);
    res.status(500).json({ error: 'Failed to search tickers' });
  }
});

export default router;

