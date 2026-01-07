import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export interface StockQuote {
  price: number | null;
  companyName: string | null;
  fiscalYearEnd?: string | null;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}

/**
 * Search for ticker symbols
 */
export async function searchTickers(query: string): Promise<SearchResult[]> {
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
export async function getPrice(ticker: string): Promise<number | null> {
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
export async function getCompanyName(ticker: string): Promise<string | null> {
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
export async function getQuote(ticker: string): Promise<StockQuote> {
  try {
    const quote = await yahooFinance.quote(ticker);
    return {
      price: quote.regularMarketPrice || null,
      companyName: quote.longName || quote.shortName || null,
      fiscalYearEnd: null,
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
export async function getFiscalYearEnd(ticker: string): Promise<string | null> {
  try {
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: ['defaultKeyStatistics', 'calendarEvents'],
    });

    // Try defaultKeyStatistics for fiscal year end
    if (summary.defaultKeyStatistics?.lastFiscalYearEnd) {
      const lastFiscalYearEnd = summary.defaultKeyStatistics.lastFiscalYearEnd;
      if (lastFiscalYearEnd) {
        const baseDate = new Date(lastFiscalYearEnd);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const month = baseDate.getMonth();
        const day = baseDate.getDate();
        
        let nextFiscalYearEnd = new Date(today.getFullYear(), month, day);
        nextFiscalYearEnd.setHours(0, 0, 0, 0);
        
        if (nextFiscalYearEnd <= today) {
          nextFiscalYearEnd.setFullYear(today.getFullYear() + 1);
        }
        
        return nextFiscalYearEnd.toISOString().split('T')[0];
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching fiscal year end for ${ticker}:`, error);
    return null;
  }
}

/**
 * Fetch complete quote including fiscal year end
 */
export async function getCompleteQuote(ticker: string): Promise<StockQuote> {
  try {
    const quote = await yahooFinance.quote(ticker);
    
    let fiscalYearEnd: string | null = null;
    try {
      fiscalYearEnd = await getFiscalYearEnd(ticker);
    } catch (fyeError) {
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

