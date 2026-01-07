import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export interface StockQuote {
  price: number | null;
  companyName: string | null;
}

export class StockPriceService {
  /**
   * Fetch current stock price by ticker
   */
  static async getPrice(ticker: string): Promise<number | null> {
    try {
      const quote = await yahooFinance.quote(ticker);
      return quote.regularMarketPrice || null;
    } catch (error) {
      console.error(`Error fetching price for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Fetch company name by ticker
   */
  static async getCompanyName(ticker: string): Promise<string | null> {
    try {
      const quote = await yahooFinance.quote(ticker);
      return quote.longName || quote.shortName || null;
    } catch (error) {
      console.error(`Error fetching company name for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Fetch both price and company name
   */
  static async getQuote(ticker: string): Promise<StockQuote> {
    try {
      const quote = await yahooFinance.quote(ticker);
      return {
        price: quote.regularMarketPrice || null,
        companyName: quote.longName || quote.shortName || null,
      };
    } catch (error) {
      console.error(`Error fetching quote for ${ticker}:`, error);
      return {
        price: null,
        companyName: null,
      };
    }
  }
}

