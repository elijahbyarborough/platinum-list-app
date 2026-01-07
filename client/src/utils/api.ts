import { Company, CompanyFormData } from '@/types/company';
import { ApiResponse, RefreshPricesResponse } from '@/types/api';
import { SubmissionLogEntry } from '@/types/submissionLog';
import { EditComparison } from '@/types/editHistory';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Companies
  getCompanies: (): Promise<Company[]> => {
    return fetchApi<Company[]>('/companies');
  },

  getCompany: (ticker: string): Promise<Company> => {
    return fetchApi<Company>(`/companies/${ticker}`);
  },

  createCompany: (data: CompanyFormData): Promise<Company> => {
    return fetchApi<Company>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  refreshPrice: (ticker: string): Promise<Company> => {
    return fetchApi<Company>(`/companies/${ticker}/refresh-price`, {
      method: 'POST',
    });
  },

  refreshAllPrices: (): Promise<RefreshPricesResponse> => {
    return fetchApi<RefreshPricesResponse>('/prices/refresh-all', {
      method: 'POST',
    });
  },

  // Submission Logs
  getSubmissionLogs: (): Promise<SubmissionLogEntry[]> => {
    return fetchApi<SubmissionLogEntry[]>('/submission-logs');
  },

  // Edit History
  getEditHistory: (): Promise<EditComparison[]> => {
    return fetchApi<EditComparison[]>('/edit-history');
  },
};

