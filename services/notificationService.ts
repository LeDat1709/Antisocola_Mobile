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
  async getNotifications(page: number = 0, size: number = 10): Promise<NotificationResponse> {
    const response = await apiClient.get<{ data: NotificationResponse }>(
      `/notifications?page=${page}&size=${size}`
    );
    return response.data.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ data: { unreadCount: number } }>(
      '/notifications/unread-count'
    );
    return response.data.data.unreadCount;
  },

  async markAsRead(notificationId: number): Promise<void> {
    await apiClient.post(`/notifications/${notificationId}/read`, {});
  },

  async markAllAsRead(): Promise<number> {
    const response = await apiClient.post<{ data: { markedCount: number } }>(
      '/notifications/read-all',
      {}
    );
    return response.data.data.markedCount;
  },
};
