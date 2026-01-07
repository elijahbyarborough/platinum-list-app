import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export interface StockQuote {
  price: number | null;
  companyName: string | null;
  fiscalYearEnd?: string | null; // ISO date string (e.g., "2026-12-31")
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}

export class StockPriceService {
  /**
   * Search for ticker symbols
   */
  static async search(query: string): Promise<SearchResult[]> {
    try {
      const results = await yahooFinance.search(query);
      return results.quotes.slice(0, 10).map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
        exchange: quote.exchange,
        type: quote.quoteType,
      }));
    } catch (error) {
      console.error(`Error searching for ${query}:`, error);
      return [];
    }
  }

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
        fiscalYearEnd: null, // Will be fetched separately
      };
    } catch (error) {
      console.error(`Error fetching quote for ${ticker}:`, error);
      return {
        price: null,
        companyName: null,
        fiscalYearEnd: null,
      };
    }
  }

  /**
   * Fetch fiscal year end date from quoteSummary
   */
  static async getFiscalYearEnd(ticker: string): Promise<string | null> {
    try {
      const summary = await yahooFinance.quoteSummary(ticker, {
        modules: ['defaultKeyStatistics', 'calendarEvents'],
      });

      // Try calendarEvents first (more reliable)
      if (summary.calendarEvents?.earnings?.earningsDate) {
        const earningsDates = summary.calendarEvents.earnings.earningsDate;
        if (earningsDates && earningsDates.length > 0) {
          // This gives us earnings date, but we need fiscal year end
          // We'll use defaultKeyStatistics instead
        }
      }

      // Try defaultKeyStatistics for fiscal year end
      if (summary.defaultKeyStatistics?.lastFiscalYearEnd) {
        const lastFiscalYearEnd = summary.defaultKeyStatistics.lastFiscalYearEnd;
        if (lastFiscalYearEnd) {
          // lastFiscalYearEnd is a timestamp, convert to date
          const baseDate = new Date(lastFiscalYearEnd);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Start with the month and day from the last fiscal year end
          const month = baseDate.getMonth();
          const day = baseDate.getDate();
          
          // Calculate the next upcoming fiscal year end
          let nextFiscalYearEnd = new Date(today.getFullYear(), month, day);
          nextFiscalYearEnd.setHours(0, 0, 0, 0);
          
          // If this year's FYE has already passed, use next year's
          if (nextFiscalYearEnd <= today) {
            nextFiscalYearEnd.setFullYear(today.getFullYear() + 1);
          }
          
          // Format as ISO date string (YYYY-MM-DD)
          return nextFiscalYearEnd.toISOString().split('T')[0];
        }
      }

      // Alternative: use calendarEvents earnings date to infer fiscal year
      // If earnings date is in Q1 (Jan-Mar), FYE is likely Dec of previous year
      // If earnings date is in Q2-Q4, FYE is in that year
      
      return null;
    } catch (error) {
      console.error(`Error fetching fiscal year end for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Fetch complete quote including fiscal year end
   */
  static async getCompleteQuote(ticker: string): Promise<StockQuote> {
    try {
      // Fetch quote first (required)
      const quote = await yahooFinance.quote(ticker);
      
      // Try to fetch fiscal year end, but don't fail if it errors
      let fiscalYearEnd: string | null = null;
      try {
        fiscalYearEnd = await this.getFiscalYearEnd(ticker);
      } catch (fyeError) {
        // Silently fail - fiscal year end is optional
        console.warn(`Could not fetch fiscal year end for ${ticker}:`, fyeError);
      }

      return {
        price: quote.regularMarketPrice || null,
        companyName: quote.longName || quote.shortName || null,
        fiscalYearEnd: fiscalYearEnd,
      };
    } catch (error) {
      console.error(`Error fetching complete quote for ${ticker}:`, error);
      return {
        price: null,
        companyName: null,
        fiscalYearEnd: null,
      };
    }
  }
}

