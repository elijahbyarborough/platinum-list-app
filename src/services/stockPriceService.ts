// Placeholder service for client-side stock price fetching
// In practice, this would call the backend API

export class StockPriceService {
  static async fetchCompanyName(ticker: string): Promise<string | null> {
    try {
      const response = await fetch(`http://localhost:3001/api/companies/${ticker}/refresh-price`);
      if (response.ok) {
        const data = await response.json();
        return data.company_name || null;
      }
      return null;
    } catch {
      return null;
    }
  }
}

