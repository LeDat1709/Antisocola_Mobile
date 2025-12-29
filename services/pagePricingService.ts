import { apiClient } from './api';

export interface PagePricing {
  paperSize: string;      // 'A4', 'A3'
  pricePerPage: number;   // Giá mỗi trang (VND)
  currency: string;       // 'VND'
  notes?: string;
}

export const pagePricingService = {
  /**
   * Lấy tất cả giá đang active
   */
  async getAllPricing(): Promise<PagePricing[]> {
    const response = await apiClient.get<PagePricing[]>('/page-pricing');
    return response.data;
  },

  /**
   * Lấy giá theo paper size
   */
  async getPricing(paperSize: string): Promise<PagePricing> {
    const response = await apiClient.get<PagePricing>(`/page-pricing/${paperSize}`);
    return response.data;
  },

  /**
   * Tính tổng giá tiền cho việc mua trang
   */
  calculatePrice(paperSize: string, numPages: number, pricing: PagePricing[]): number {
    const matchedPrice = pricing.find(p => p.paperSize === paperSize);
    if (!matchedPrice) {
      console.warn(`No pricing found for ${paperSize}`);
      return 0;
    }
    return matchedPrice.pricePerPage * numPages;
  },
};
