import { apiClient } from './api';

export interface CreatePaymentResponse {
  success: boolean;
  paymentCode: string;
  amount: number;
  a4Pages: number;
  qrUrl: string;
  bankName: string;
  bankAccount: string;
  accountName: string;
  expiresAt: string;
  message: string;
}

export interface PaymentStatus {
  paymentCode: string;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  amount: number;
  a4Pages: number;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
}

export const paymentService = {
  /**
   * POST /api/payment/create
   * Tạo giao dịch thanh toán mới
   */
  async createPayment(a4Pages: number): Promise<CreatePaymentResponse> {
    const response = await apiClient.post<CreatePaymentResponse>('/payment/create', { a4Pages });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Tạo giao dịch thất bại');
    }
    return response.data;
  },

  /**
   * GET /api/payment/status/{paymentCode}
   * Kiểm tra trạng thái thanh toán
   */
  async getPaymentStatus(paymentCode: string): Promise<PaymentStatus> {
    const response = await apiClient.get<PaymentStatus>(`/payment/status/${paymentCode}`);
    return response.data;
  },

  /**
   * GET /api/payment/pending
   * Lấy danh sách giao dịch đang chờ
   */
  async getPendingPayments(): Promise<PaymentStatus[]> {
    const response = await apiClient.get<PaymentStatus[]>('/payment/pending');
    return response.data;
  },

  /**
   * DELETE /api/payment/cancel/{paymentCode}
   * Hủy giao dịch đang chờ
   */
  async cancelPayment(paymentCode: string): Promise<void> {
    await apiClient.delete(`/payment/cancel/${paymentCode}`);
  },

  /**
   * POST /api/payment/test-complete/{paymentCode}
   * Test hoàn thành giao dịch (dev only)
   */
  async testCompletePayment(paymentCode: string): Promise<{ success: boolean; message: string; a4Pages: number }> {
    const response = await apiClient.post<{ success: boolean; message: string; a4Pages: number }>(
      `/payment/test-complete/${paymentCode}`
    );
    return response.data;
  },
};
