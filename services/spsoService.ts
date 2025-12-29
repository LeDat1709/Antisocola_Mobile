import { apiClient } from './api';

// Dashboard
export interface DashboardStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  totalPages: number;
  totalRevenue: number;
  monthRevenue: number;
}

// Accounts
export interface Account {
  userId: string;
  email: string;
  fullName: string;
  userType: 'Student' | 'SPSO' | 'Admin';
  status: string;
  a4Balance: number | null;
  a3Balance: number | null;
  totalPrintJobs: number | null;
  lastLogin: string | null;
  createdAt: string;
}

export interface AccountDetail {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  userType: 'Student' | 'SPSO' | 'Admin';
  status: string;
  createdAt: string;
  lastLogin: string | null;
  a4Balance: number | null;
  a3Balance: number | null;
  totalPrintJobs: number | null;
  totalPagesPrinted: number | null;
}

// Students
export interface Student {
  studentId: string;
  email: string;
  fullName: string;
  status: string;
  a4Balance: number;
  totalPrintJobs: number;
  lastLogin: string | null;
}

// Print Logs
export interface PrintLog {
  logId: number;
  jobId: number;
  studentId: string;
  studentName: string;
  printerName: string;
  printerLocation?: string;
  documentName: string;
  paperSize: string;
  pagesPrinted: number;
  printTime: string;
  status: string;
}

export interface PrintLogStats {
  totalLogs: number;
  completedLogs: number;
  failedLogs: number;
  cancelledLogs: number;
  pendingLogs: number;
  totalPages: number;
}

// Reports
export interface MonthlyReport {
  year: number;
  month: number;
  monthName: string;
  totalPrintJobs: number;
  totalPagesPrinted: number;
  totalRevenue: number;
  successfulJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  totalStudentsActive: number;
  totalA4Equivalent: number;
  totalPagesPurchased: number;
  paperSizeDistribution: {
    a4Count: number;
    a3Count: number;
    a4Percentage: number;
    a3Percentage: number;
  };
  topStudents: Array<{
    studentId: string;
    studentName: string;
    totalPages: number;
    totalJobs: number;
  }>;
  topPrinters: Array<{
    printerId: string;
    printerName: string;
    location: string;
    totalJobs: number;
    totalPages: number;
  }>;
}

export interface YearlyReport {
  year: number;
  totalPrintJobs: number;
  totalPagesPrinted: number;
  totalRevenue: number;
  successfulJobs: number;
  failedJobs: number;
  totalStudentsActive: number;
  monthlyStats: Array<{
    month: number;
    monthName: string;
    jobs: number;
    pages: number;
    revenue: number;
  }>;
}

// Transactions
export interface Transaction {
  transactionId: number;
  transactionCode: string;
  studentId: string;
  studentName: string;
  transactionType: 'Allocate' | 'Purchase' | 'Use';
  a4Pages: number;
  balanceAfterA4: number | null;
  amount: number | null;
  transactionStatus: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface TransactionStats {
  totalAll: number;
  totalAllocate: number;
  totalPurchase: number;
  totalUse: number;
}

// Locations
export interface Campus {
  campusId: number;
  campusCode: string;
  campusName: string;
  address?: string;
  isActive: boolean;
}

export interface Building {
  buildingId: number;
  campusId: number;
  campusName?: string;
  buildingCode: string;
  buildingName?: string;
  floorCount?: number;
  isActive: boolean;
}

export interface Room {
  roomId: number;
  buildingId: number;
  buildingName?: string;
  roomNumber: string;
  roomName?: string;
  roomType?: string;
  isActive: boolean;
}

// Settings
export interface SystemConfig {
  configKey: string;
  configValue: string;
  description: string;
  dataType?: string;
}

export interface Semester {
  semesterId: number;
  semesterCode: string;
  semesterName: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  defaultA4Pages: number;
  isActive: boolean;
  isCurrent: boolean;
}

export interface SystemSettings {
  configs: Record<string, SystemConfig>;
  semesters: Semester[];
  currentSemester: Semester | null;
}

export const spsoService = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  // Accounts
  async getAccounts(
    page = 0,
    size = 20,
    filters?: { keyword?: string; userType?: string; status?: string }
  ): Promise<{ content: Account[]; totalElements: number; totalPages: number }> {
    let url = `/spso/accounts?pageNumber=${page + 1}&pageSize=${size}`;
    if (filters?.keyword) url += `&keyword=${filters.keyword}`;
    if (filters?.userType) url += `&userType=${filters.userType}`;
    if (filters?.status) url += `&status=${filters.status}`;
    const response = await apiClient.get<{ content: Account[]; totalElements: number; totalPages: number }>(url);
    return response.data;
  },

  async getAccountDetail(userId: string): Promise<AccountDetail> {
    const response = await apiClient.get<AccountDetail>(`/spso/accounts/${userId}`);
    return response.data;
  },

  async updateAccountStatus(userId: string, status: string, reason?: string): Promise<void> {
    await apiClient.put('/spso/accounts/status', { userId, status, reason });
  },

  async updateAccountRole(userId: string, newRole: string, reason?: string): Promise<void> {
    await apiClient.put('/spso/accounts/role', { userId, newRole, reason });
  },

  async allocatePages(studentId: string, a4Pages: number, reason?: string): Promise<void> {
    await apiClient.post('/spso/accounts/allocate-pages', { studentId, a4Pages, a3Pages: 0, reason });
  },

  async createAccount(data: {
    userId: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    userType: string;
    password: string;
  }): Promise<void> {
    await apiClient.post('/spso/accounts', data);
  },

  // Students
  async getStudents(page = 0, size = 20, keyword?: string): Promise<{ content: Student[]; totalElements: number }> {
    let url = `/spso/students?pageNumber=${page + 1}&pageSize=${size}`;
    if (keyword) url += `&keyword=${keyword}`;
    const response = await apiClient.get<{ content: Student[]; totalElements: number }>(url);
    return response.data;
  },

  async getStudentDetail(studentId: string): Promise<Student> {
    const response = await apiClient.get<Student>(`/spso/students/${studentId}`);
    return response.data;
  },

  // Print Logs
  async getPrintLogs(
    page = 0,
    size = 20,
    filters?: { studentSearch?: string; status?: string; startDate?: string; endDate?: string }
  ): Promise<{ content: PrintLog[]; totalElements: number; totalPages: number }> {
    let url = `/print-logs?page=${page}&size=${size}`;
    if (filters?.studentSearch) url += `&studentSearch=${filters.studentSearch}`;
    if (filters?.status) url += `&status=${filters.status}`;
    if (filters?.startDate) url += `&startDate=${filters.startDate}`;
    if (filters?.endDate) url += `&endDate=${filters.endDate}`;
    const response = await apiClient.get<{ content: PrintLog[]; totalElements: number; totalPages: number }>(url);
    return response.data;
  },

  async getPrintLogStats(): Promise<PrintLogStats> {
    const response = await apiClient.get<PrintLogStats>('/print-logs/stats');
    return response.data;
  },

  // Reports
  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const response = await apiClient.get<MonthlyReport>(`/reports/monthly?year=${year}&month=${month}`);
    return response.data;
  },

  async getYearlyReport(year: number): Promise<YearlyReport> {
    const response = await apiClient.get<YearlyReport>(`/reports/yearly?year=${year}`);
    return response.data;
  },

  // Transactions
  async getTransactions(
    page = 0,
    size = 20,
    filters?: { keyword?: string; type?: string; startDate?: string; endDate?: string }
  ): Promise<{
    content: Transaction[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    totalAllocateTransactions: number;
    totalPurchaseTransactions: number;
    totalUseTransactions: number;
  }> {
    let url = `/admin/transactions?page=${page}&size=${size}`;
    if (filters?.keyword) url += `&keyword=${filters.keyword}`;
    if (filters?.type) url += `&type=${filters.type}`;
    if (filters?.startDate) url += `&startDate=${filters.startDate}`;
    if (filters?.endDate) url += `&endDate=${filters.endDate}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  async getTransactionDetail(id: number): Promise<Transaction> {
    const response = await apiClient.get<Transaction>(`/admin/transactions/${id}`);
    return response.data;
  },

  // Locations
  async getCampuses(): Promise<Campus[]> {
    const response = await apiClient.get<{ data: Campus[] }>('/locations/campuses');
    return response.data.data;
  },

  async createCampus(data: { campusCode: string; campusName: string; address?: string; isActive: boolean }): Promise<Campus> {
    const response = await apiClient.post<{ data: Campus }>('/locations/campuses', data);
    return response.data.data;
  },

  async updateCampus(id: number, data: { campusCode: string; campusName: string; address?: string; isActive: boolean }): Promise<Campus> {
    const response = await apiClient.put<{ data: Campus }>(`/locations/campuses/${id}`, data);
    return response.data.data;
  },

  async deleteCampus(id: number): Promise<void> {
    await apiClient.delete(`/locations/campuses/${id}`);
  },

  async getBuildings(): Promise<Building[]> {
    const response = await apiClient.get<{ data: Building[] }>('/locations/buildings');
    return response.data.data;
  },

  async createBuilding(data: { campusId: number; buildingCode: string; buildingName?: string; floorCount?: number; isActive: boolean }): Promise<Building> {
    const response = await apiClient.post<{ data: Building }>('/locations/buildings', data);
    return response.data.data;
  },

  async updateBuilding(id: number, data: { campusId: number; buildingCode: string; buildingName?: string; floorCount?: number; isActive: boolean }): Promise<Building> {
    const response = await apiClient.put<{ data: Building }>(`/locations/buildings/${id}`, data);
    return response.data.data;
  },

  async deleteBuilding(id: number): Promise<void> {
    await apiClient.delete(`/locations/buildings/${id}`);
  },

  async getRooms(): Promise<Room[]> {
    const response = await apiClient.get<{ data: Room[] }>('/locations/rooms');
    return response.data.data;
  },

  async createRoom(data: { buildingId: number; roomNumber: string; roomName?: string; roomType?: string; isActive: boolean }): Promise<Room> {
    const response = await apiClient.post<{ data: Room }>('/locations/rooms', data);
    return response.data.data;
  },

  async updateRoom(id: number, data: { buildingId: number; roomNumber: string; roomName?: string; roomType?: string; isActive: boolean }): Promise<Room> {
    const response = await apiClient.put<{ data: Room }>(`/locations/rooms/${id}`, data);
    return response.data.data;
  },

  async deleteRoom(id: number): Promise<void> {
    await apiClient.delete(`/locations/rooms/${id}`);
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    const response = await apiClient.get<SystemSettings>('/spso/settings');
    return response.data;
  },

  async updateConfig(configKey: string, configValue: string): Promise<void> {
    await apiClient.put('/spso/settings/config', { configKey, configValue, updatedBy: 'SPSO' });
  },

  async updateMultipleConfigs(configs: Record<string, string>): Promise<void> {
    await apiClient.put('/spso/settings/configs', configs, { params: { updatedBy: 'SPSO' } });
  },

  async createSemester(data: {
    semesterCode: string;
    semesterName: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    defaultA4Pages: number;
  }): Promise<Semester> {
    const response = await apiClient.post<Semester>('/spso/settings/semesters', { ...data, createdBy: 'SPSO' });
    return response.data;
  },

  async updateSemester(data: {
    semesterId: number;
    semesterName: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    defaultA4Pages: number;
    isActive?: boolean;
  }): Promise<Semester> {
    const response = await apiClient.put<Semester>('/spso/settings/semesters', { ...data, updatedBy: 'SPSO' });
    return response.data;
  },

  async deleteSemester(semesterId: number): Promise<void> {
    await apiClient.delete(`/spso/settings/semesters/${semesterId}`);
  },
};
