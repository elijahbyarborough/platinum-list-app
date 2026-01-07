export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface RefreshPricesResponse {
  total: number;
  results: Array<{
    ticker: string;
    success: boolean;
    price?: number;
    error?: string;
  }>;
}

