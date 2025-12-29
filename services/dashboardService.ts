import { apiClient } from './api';

export interface DashboardStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  pendingJobs: number;
  printingJobs: number;
  totalPages: number;
  totalRevenue: number;
  monthRevenue: number;
  monthlyStats: MonthlyStatDTO[];
  weeklyStats: WeeklyStatDTO[];
}

export interface MonthlyStatDTO {
  month: string;
  year: number;
  jobs: number;
  revenue: number;
}

export interface WeeklyStatDTO {
  day: string;
  date: string;
  jobs: number;
}

export const dashboardService = {
  /**
   * GET /api/dashboard/stats
   * Lấy thống kê dashboard
   */
  async getDashboardStats(year?: number): Promise<DashboardStats> {
    const url = year ? `/dashboard/stats?year=${year}` : '/dashboard/stats';
    const response = await apiClient.get<DashboardStats>(url);
    return response.data;
  },
};
