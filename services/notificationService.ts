import { apiClient } from './api';

export interface Notification {
  notificationId: number;
  recipientId: string;
  title: string;
  message: string;
  notificationType: 'Info' | 'Warning' | 'Error' | 'Success';
  isRead: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

export const notificationService = {
  /**
   * GET /api/notifications - Lấy danh sách thông báo
   */
  async getNotifications(page: number = 0, size: number = 10): Promise<NotificationResponse> {
    const response = await apiClient.get<{ data: NotificationResponse }>(
      `/notifications?page=${page}&size=${size}`
    );
    return response.data.data;
  },

  /**
   * GET /api/notifications/unread-count - Lấy số thông báo chưa đọc
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ data: { unreadCount: number } }>(
      '/notifications/unread-count'
    );
    return response.data.data.unreadCount;
  },

  /**
   * PUT /api/notifications/{id}/read - Đánh dấu đã đọc
   */
  async markAsRead(notificationId: number): Promise<void> {
    await apiClient.put(`/notifications/${notificationId}/read`);
  },

  /**
   * PUT /api/notifications/read-all - Đánh dấu tất cả đã đọc
   */
  async markAllAsRead(): Promise<number> {
    const response = await apiClient.put<{ data: { markedCount: number } }>(
      '/notifications/read-all'
    );
    return response.data.data.markedCount;
  },
};
