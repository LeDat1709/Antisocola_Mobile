import { apiClient } from './api';

export interface PageBalance {
  id: number;
  userId: number;
  pagesA4: number;
  lastUpdated: string;
}

export interface PageTransaction {
  transactionId: number;
  transactionCode: string;
  transactionType: string;
  a4Pages: number;
  balanceAfterA4: number;
  notes: string;
  createdAt: string;
}

export interface PageTransactionResponse {
  content: PageTransaction[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export const pageBalanceService = {
  async getBalance(): Promise<PageBalance> {
    const response = await apiClient.get<PageBalance>('/page-balance');
    return response.data;
  },

  async getTransactions(
    page: number = 0,
    size: number = 10,
    filters?: { type?: string; startDate?: string; endDate?: string }
  ): Promise<PageTransactionResponse> {
    let url = `/page-balance/transactions?page=${page}&size=${size}`;
    if (filters?.type) url += `&type=${filters.type}`;
    if (filters?.startDate) url += `&startDate=${filters.startDate}`;
    if (filters?.endDate) url += `&endDate=${filters.endDate}`;
    
    const response = await apiClient.get<PageTransactionResponse>(url);
    return response.data;
  },

  async purchasePages(a4Pages: number): Promise<any> {
    const response = await apiClient.post('/page-balance/purchase', { a4Pages, a3Pages: 0 });
    return response.data;
  },
};
