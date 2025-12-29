import { apiClient } from './api';

// Dashboard
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
  monthlyStats?: Array<{ month: string; year: number; jobs: number; revenue: number }>;
  weeklyStats?: Array<{ day: string; date: string; jobs: number }>;
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
  totalA4Equivalent: number | null;
  totalPrintJobs: number | null;
  totalPagesPrinted: number | null;
  lastPrintTime: string | null;
}

export interface AccountFilter {
  keyword?: string;
  userType?: 'Student' | 'SPSO' | 'Admin';
  status?: string;
  sortBy?: string;
  sortDirection?: string;
}

// Students
export interface Student {
  studentId: string;
  email: string;
  fullName: string;
  status: string;
  a4Balance: number;
  a3Balance: number;
  totalPrintJobs: number;
  lastLogin: string | null;
}

export interface StudentDetail {
  studentId: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  status: string;
  createdAt: string;
  lastLogin: string | null;
  a4Balance: number;
  a3Balance: number;
  totalA4Equivalent: number;
  totalPrintJobs: number;
  totalPagesPrinted: number;
  lastPrintTime: string | null;
}

export interface StudentFilter {
  keyword?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: string;
}

// Print Logs
export interface PrintLog {
  logId: number;
  jobId: number;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  printerId: string;
  printerName: string;
  printerLocation?: string;
  documentName: string;
  paperSize: string;
  pagesPrinted: number;
  a4EquivalentUsed?: number;
  printTime: string;
  durationSeconds?: number;
  status: string;
  statusDisplay?: string;
  fileType?: string;
  errorMessage?: string;
}

export interface PrintLogFilter {
  studentSearch?: string;
  printerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  documentName?: string;
  sortBy?: string;
  sortDirection?: string;
}

export interface PrintLogStats {
  totalLogs: number;
  completedLogs: number;
  failedLogs: number;
  cancelledLogs: number;
  pendingLogs: number;
  printingLogs: number;
  totalPages: number;
  maxPages?: number;
  minPages?: number;
}

// Reports
export interface MonthlyReport {
  reportId?: number;
  year: number;
  month: number;
  monthName: string;
  totalStudentsActive: number;
  totalPrintJobs: number;
  successfulJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  totalPagesPrinted: number;
  totalA4Equivalent: number;
  totalPagesPurchased: number;
  totalRevenue: number;
  mostUsedPrinterId?: string;
  mostUsedPrinterName?: string;
  mostUsedPrinterJobs?: number;
  topStudentId?: string;
  topStudentName?: string;
  topStudentPages?: number;
  paperSizeDistribution: {
    a4Count: number;
    a3Count: number;
    a4Percentage: number;
    a3Percentage: number;
  };
  topStudents: Array<{
    studentId: string;
    studentName: string;
    studentEmail?: string;
    totalPages: number;
    totalJobs: number;
    totalSpent?: number;
  }>;
  topPrinters: Array<{
    printerId: string;
    printerName: string;
    location: string;
    totalJobs: number;
    totalPages: number;
  }>;
  dailyStats?: Array<{
    day: number;
    jobs: number;
    pages: number;
    revenue: number;
  }>;
}

export interface YearlyReport {
  reportId?: number;
  year: number;
  totalStudentsActive: number;
  totalPrintJobs: number;
  successfulJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  totalPagesPrinted: number;
  totalA4Equivalent: number;
  totalPagesPurchased: number;
  totalRevenue: number;
  averageRevenuePerStudent?: number;
  mostActiveMonth?: number;
  mostActiveMonthName?: string;
  mostActiveMonthJobs?: number;
  monthlyStats: Array<{
    month: number;
    monthName: string;
    jobs: number;
    pages: number;
    revenue: number;
  }>;
  topStudents: Array<{
    studentId: string;
    studentName: string;
    studentEmail?: string;
    totalPages: number;
    totalJobs: number;
    totalSpent?: number;
  }>;
  topPrinters: Array<{
    printerId: string;
    printerName: string;
    location: string;
    totalJobs: number;
    totalPages: number;
  }>;
  paperSizeDistribution?: {
    a4Count: number;
    a3Count: number;
    a4Percentage: number;
    a3Percentage: number;
  };
}

// Transactions
export interface Transaction {
  transactionId: number;
  transactionCode: string;
  studentId: string;
  studentName: string;
  transactionType: 'ALLOCATED' | 'PURCHASED' | 'DEDUCTED';
  a4Pages: number;
  a3Pages?: number;
  balanceAfterA4: number | null;
  balanceAfterA3?: number | null;
  amount: number | null;
  transactionStatus: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface TransactionFilter {
  keyword?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
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
  capacity?: number;
  isActive: boolean;
}

// Settings
export interface SystemConfig {
  configKey: string;
  configValue: string;
  description: string;
  dataType?: 'String' | 'Integer' | 'Decimal' | 'Boolean' | 'JSON';
}

export interface Semester {
  semesterId: number;
  semesterCode: string;
  semesterName: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  defaultA4Pages: number;
  pageAllocationDate?: string | null;
  isActive: boolean;
  isCurrent: boolean;
}

export interface AllowedFileType {
  fileTypeId: number;
  fileExtension: string;
  mimeType: string;
  maxFileSizeMB: number;
  isAllowed: boolean;
}

export interface SystemSettings {
  configs: Record<string, SystemConfig>;
  semesters: Semester[];
  currentSemester: Semester | null;
  allowedFileTypes?: AllowedFileType[];
}

// Page Response
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageable?: {
    pageNumber: number;
    pageSize: number;
  };
  last?: boolean;
  first?: boolean;
  empty?: boolean;
}

export const spsoService = {
  // ==================== DASHBOARD ====================
  async getDashboardStats(year?: number): Promise<DashboardStats> {
    const url = year ? `/dashboard/stats?year=${year}` : '/dashboard/stats';
    const response = await apiClient.get<DashboardStats>(url);
    return response.data;
  },

  // ==================== ACCOUNTS ====================
  async getAccounts(
    page = 0,
    size = 20,
    filters?: AccountFilter
  ): Promise<PageResponse<Account>> {
    let url = `/spso/accounts?pageNumber=${page + 1}&pageSize=${size}`;
    if (filters?.keyword) url += `&keyword=${encodeURIComponent(filters.keyword)}`;
    if (filters?.userType) url += `&userType=${filters.userType}`;
    if (filters?.status) url += `&status=${filters.status}`;
    if (filters?.sortBy) url += `&sortBy=${filters.sortBy}`;
    if (filters?.sortDirection) url += `&sortDirection=${filters.sortDirection}`;
    const response = await apiClient.get<PageResponse<Account>>(url);
    return response.data;
  },

  async getAccountDetail(userId: string): Promise<AccountDetail> {
    const response = await apiClient.get<AccountDetail>(`/spso/accounts/${userId}`);
    return response.data;
  },

  async updateAccountStatus(userId: string, status: string, reason?: string): Promise<any> {
    const response = await apiClient.put('/spso/accounts/status', { userId, status, reason });
    return response.data;
  },

  async updateAccountRole(userId: string, newRole: string, reason?: string): Promise<any> {
    const response = await apiClient.put('/spso/accounts/role', { userId, newRole, reason });
    return response.data;
  },

  async allocatePages(studentId: string, a4Pages: number, a3Pages: number = 0, reason?: string): Promise<any> {
    const response = await apiClient.post('/spso/accounts/allocate-pages', { studentId, a4Pages, a3Pages, reason });
    return response.data;
  },

  async createAccount(data: {
    userId: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    userType: string;
    password: string;
  }): Promise<any> {
    const response = await apiClient.post('/spso/accounts', data);
    return response.data;
  },

  async deleteAccount(userId: string): Promise<void> {
    await apiClient.delete(`/spso/accounts/${userId}`);
  },

  async getAccountPrintHistory(
    userId: string,
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<PageResponse<PrintLog>> {
    const response = await apiClient.get<PageResponse<PrintLog>>(
      `/spso/accounts/${userId}/print-history?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // ==================== STUDENTS ====================
  async getStudents(
    page = 0,
    size = 20,
    filters?: StudentFilter
  ): Promise<PageResponse<Student>> {
    let url = `/spso/students?pageNumber=${page + 1}&pageSize=${size}`;
    if (filters?.keyword) url += `&keyword=${encodeURIComponent(filters.keyword)}`;
    if (filters?.status) url += `&status=${filters.status}`;
    if (filters?.sortBy) url += `&sortBy=${filters.sortBy}`;
    if (filters?.sortDirection) url += `&sortDirection=${filters.sortDirection}`;
    const response = await apiClient.get<PageResponse<Student>>(url);
    return response.data;
  },

  async getStudentDetail(studentId: string): Promise<StudentDetail> {
    const response = await apiClient.get<StudentDetail>(`/spso/students/${studentId}`);
    return response.data;
  },

  async allocatePagesToStudent(studentId: string, a4Pages: number, a3Pages: number = 0, reason?: string): Promise<any> {
    const response = await apiClient.post('/spso/students/allocate-pages', { studentId, a4Pages, a3Pages, reason });
    return response.data;
  },

  async updateStudentStatus(studentId: string, status: string, reason?: string): Promise<any> {
    const response = await apiClient.put('/spso/students/status', { studentId, status, reason });
    return response.data;
  },

  async deleteStudent(studentId: string): Promise<void> {
    await apiClient.delete(`/spso/students/${studentId}`);
  },

  async getStudentPrintHistory(
    studentId: string,
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<PageResponse<PrintLog>> {
    const response = await apiClient.get<PageResponse<PrintLog>>(
      `/spso/students/${studentId}/print-history?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // ==================== PRINT LOGS ====================
  async getPrintLogs(
    page = 0,
    size = 20,
    filters?: PrintLogFilter
  ): Promise<PageResponse<PrintLog>> {
    let url = `/print-logs?page=${page}&size=${size}`;
    if (filters?.studentSearch) url += `&studentSearch=${encodeURIComponent(filters.studentSearch)}`;
    if (filters?.printerId) url += `&printerId=${filters.printerId}`;
    if (filters?.status) url += `&status=${filters.status}`;
    if (filters?.startDate) url += `&startDate=${filters.startDate}`;
    if (filters?.endDate) url += `&endDate=${filters.endDate}`;
    if (filters?.documentName) url += `&documentName=${encodeURIComponent(filters.documentName)}`;
    if (filters?.sortBy) url += `&sortBy=${filters.sortBy}`;
    if (filters?.sortDirection) url += `&sortDirection=${filters.sortDirection}`;
    const response = await apiClient.get<PageResponse<PrintLog>>(url);
    return response.data;
  },

  async getPrintLogById(logId: number): Promise<PrintLog> {
    const response = await apiClient.get<PrintLog>(`/print-logs/${logId}`);
    return response.data;
  },

  async getPrintLogStats(filters?: PrintLogFilter): Promise<PrintLogStats> {
    let url = '/print-logs/stats';
    const params: string[] = [];
    if (filters?.studentSearch) params.push(`studentSearch=${encodeURIComponent(filters.studentSearch)}`);
    if (filters?.printerId) params.push(`printerId=${filters.printerId}`);
    if (filters?.status) params.push(`status=${filters.status}`);
    if (filters?.startDate) params.push(`startDate=${filters.startDate}`);
    if (filters?.endDate) params.push(`endDate=${filters.endDate}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    const response = await apiClient.get<PrintLogStats>(url);
    return response.data;
  },

  // ==================== REPORTS ====================
  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const response = await apiClient.get<MonthlyReport>(`/reports/monthly?year=${year}&month=${month}`);
    return response.data;
  },

  async getYearlyReport(year: number): Promise<YearlyReport> {
    const response = await apiClient.get<YearlyReport>(`/reports/yearly?year=${year}`);
    return response.data;
  },

  async generateMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const response = await apiClient.post<MonthlyReport>(`/reports/monthly/generate?year=${year}&month=${month}`);
    return response.data;
  },

  // ==================== TRANSACTIONS ====================
  async getTransactions(
    page = 0,
    size = 20,
    filters?: TransactionFilter
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
    if (filters?.keyword) url += `&keyword=${encodeURIComponent(filters.keyword)}`;
    if (filters?.type) url += `&type=${filters.type}`;
    if (filters?.startDate) url += `&startDate=${filters.startDate}`;
    if (filters?.endDate) url += `&endDate=${filters.endDate}`;
    const response = await apiClient.get<{
      content: Transaction[];
      totalElements: number;
      totalPages: number;
      currentPage: number;
      totalAllocateTransactions: number;
      totalPurchaseTransactions: number;
      totalUseTransactions: number;
    }>(url);
    return response.data;
  },

  async getTransactionDetail(id: number): Promise<Transaction> {
    const response = await apiClient.get<Transaction>(`/admin/transactions/${id}`);
    return response.data;
  },

  // ==================== LOCATIONS ====================
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

  async createRoom(data: { buildingId: number; roomNumber: string; roomName?: string; roomType?: string; capacity?: number; isActive: boolean }): Promise<Room> {
    const response = await apiClient.post<{ data: Room }>('/locations/rooms', data);
    return response.data.data;
  },

  async updateRoom(id: number, data: { buildingId: number; roomNumber: string; roomName?: string; roomType?: string; capacity?: number; isActive: boolean }): Promise<Room> {
    const response = await apiClient.put<{ data: Room }>(`/locations/rooms/${id}`, data);
    return response.data.data;
  },

  async deleteRoom(id: number): Promise<void> {
    await apiClient.delete(`/locations/rooms/${id}`);
  },

  // ==================== SETTINGS ====================
  async getSettings(): Promise<SystemSettings> {
    const response = await apiClient.get<SystemSettings>('/spso/settings');
    return response.data;
  },

  async getConfig(configKey: string): Promise<SystemConfig> {
    const response = await apiClient.get<SystemConfig>(`/spso/settings/config/${configKey}`);
    return response.data;
  },

  async updateConfig(configKey: string, configValue: string, updatedBy: string = 'SPSO'): Promise<SystemConfig> {
    const response = await apiClient.put<SystemConfig>('/spso/settings/config', { configKey, configValue, updatedBy });
    return response.data;
  },

  async updateMultipleConfigs(configs: Record<string, string>, updatedBy: string = 'SPSO'): Promise<Record<string, SystemConfig>> {
    const response = await apiClient.put<Record<string, SystemConfig>>(
      `/spso/settings/configs?updatedBy=${encodeURIComponent(updatedBy)}`,
      configs
    );
    return response.data;
  },

  async getAllSemesters(): Promise<Semester[]> {
    const response = await apiClient.get<Semester[]>('/spso/settings/semesters');
    return response.data;
  },

  async getCurrentSemester(): Promise<Semester> {
    const response = await apiClient.get<Semester>('/spso/settings/semesters/current');
    return response.data;
  },

  async createSemester(data: {
    semesterCode: string;
    semesterName: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    defaultA4Pages: number;
    pageAllocationDate?: string;
    isCurrent?: boolean;
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
    pageAllocationDate?: string;
    isActive?: boolean;
    isCurrent?: boolean;
  }): Promise<Semester> {
    const response = await apiClient.put<Semester>('/spso/settings/semesters', { ...data, updatedBy: 'SPSO' });
    return response.data;
  },

  async setCurrentSemester(semesterId: number, updatedBy: string = 'SPSO'): Promise<Semester> {
    const response = await apiClient.put<Semester>(
      `/spso/settings/semesters/${semesterId}/set-current?updatedBy=${encodeURIComponent(updatedBy)}`
    );
    return response.data;
  },

  async deleteSemester(semesterId: number): Promise<void> {
    await apiClient.delete(`/spso/settings/semesters/${semesterId}`);
  },
};
