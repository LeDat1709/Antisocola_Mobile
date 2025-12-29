import { apiClient } from './api';

export interface Printer {
  printerId: number;
  printerName: string;
  brand: string;
  brandId?: number;
  model: string;
  modelId?: number;
  location: string;
  campus: string;
  building: string;
  roomNumber: string;
  roomId?: number;
  paperSizes: string;
  colorPrinting: boolean;
  duplexPrinting: boolean;
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Error' | 'OutOfPaper' | 'OutOfToner';
  statusMessage?: string;
  totalPagesPrinted: number;
  a4PaperRemaining?: number;
  a3PaperRemaining?: number;
  ipAddress?: string;
  lastMaintenanceDate?: string;
}

export interface PrinterListResponse {
  content: Printer[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface PrinterFilters {
  campus?: string;
  building?: string;
  room?: string;
  brand?: string;
  model?: string;
  status?: string;
  keyword?: string;
  colorPrinting?: boolean;
  duplexPrinting?: boolean;
  lastMaintenanceDate?: string;
}

export interface PrinterSupplies {
  a4PaperRemaining: number;
  a3PaperRemaining: number;
  tonerBlackRemaining: number;
  tonerCyanRemaining?: number;
  tonerMagentaRemaining?: number;
  tonerYellowRemaining?: number;
}

export interface RefillSuppliesRequest {
  a4PaperToAdd?: number;
  a3PaperToAdd?: number;
  tonerBlackToAdd?: number;
  tonerCyanToAdd?: number;
  tonerMagentaToAdd?: number;
  tonerYellowToAdd?: number;
}

export interface CreatePrinterRequest {
  printerName: string;
  brandId: number;
  modelId: number;
  roomId: number;
  ipAddress?: string;
  paperSizes: string;
  colorPrinting: boolean;
  duplexPrinting: boolean;
  lastMaintenanceDate?: string;
}

export interface UpdatePrinterRequest extends CreatePrinterRequest {
  status: string;
}

export const printerService = {
  /**
   * GET /api/printers - Lấy danh sách máy in
   */
  async getPrinters(
    filters: PrinterFilters = {},
    page: number = 0,
    size: number = 20,
    sortBy: string = 'printerName',
    sortDir: 'ASC' | 'DESC' = 'ASC'
  ): Promise<PrinterListResponse> {
    let url = `/printers?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`;
    if (filters.campus) url += `&campus=${encodeURIComponent(filters.campus)}`;
    if (filters.building) url += `&building=${encodeURIComponent(filters.building)}`;
    if (filters.room) url += `&room=${encodeURIComponent(filters.room)}`;
    if (filters.brand) url += `&brand=${encodeURIComponent(filters.brand)}`;
    if (filters.model) url += `&model=${encodeURIComponent(filters.model)}`;
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.keyword) url += `&keyword=${encodeURIComponent(filters.keyword)}`;
    if (filters.colorPrinting !== undefined) url += `&colorPrinting=${filters.colorPrinting}`;
    if (filters.duplexPrinting !== undefined) url += `&duplexPrinting=${filters.duplexPrinting}`;
    if (filters.lastMaintenanceDate) url += `&lastMaintenanceDate=${filters.lastMaintenanceDate}`;

    const response = await apiClient.get<{ data: PrinterListResponse }>(url);
    return response.data.data;
  },

  /**
   * GET /api/printers/{id} - Lấy chi tiết máy in
   */
  async getPrinterById(id: number): Promise<Printer> {
    const response = await apiClient.get<{ data: Printer }>(`/printers/${id}`);
    return response.data.data;
  },

  /**
   * POST /api/printers - Thêm máy in mới (SPSO)
   */
  async addPrinter(data: CreatePrinterRequest): Promise<any> {
    const response = await apiClient.post('/printers', data);
    return response.data;
  },

  /**
   * PUT /api/printers/{id} - Cập nhật máy in (SPSO)
   */
  async updatePrinter(id: number, data: UpdatePrinterRequest): Promise<any> {
    const response = await apiClient.put(`/printers/${id}`, data);
    return response.data;
  },

  /**
   * PATCH /api/printers/{id}/toggle - Bật/Tắt máy in (SPSO)
   */
  async togglePrinter(id: number): Promise<any> {
    const response = await apiClient.patch(`/printers/${id}/toggle`);
    return response.data;
  },

  /**
   * DELETE /api/printers/{id} - Xóa máy in (SPSO)
   */
  async deletePrinter(id: number): Promise<any> {
    const response = await apiClient.delete(`/printers/${id}`);
    return response.data;
  },

  /**
   * Bulk delete printers
   */
  async deletePrinters(ids: number[]): Promise<void> {
    await Promise.all(ids.map(id => apiClient.delete(`/printers/${id}`)));
  },

  /**
   * Bulk toggle printers
   */
  async togglePrinters(ids: number[]): Promise<void> {
    await Promise.all(ids.map(id => apiClient.patch(`/printers/${id}/toggle`)));
  },

  /**
   * GET /api/printers/{id}/supplies - Lấy thông tin giấy/mực
   */
  async getPrinterSupplies(id: number): Promise<PrinterSupplies> {
    const response = await apiClient.get<{ data: PrinterSupplies }>(`/printers/${id}/supplies`);
    return response.data.data;
  },

  /**
   * POST /api/printers/{id}/refill - Nạp giấy/mực (SPSO)
   */
  async refillSupplies(id: number, data: RefillSuppliesRequest): Promise<any> {
    const response = await apiClient.post(`/printers/${id}/refill`, data);
    return response.data;
  },

  getAvailableCampuses(): string[] {
    return ['Dĩ An', 'Thành phố'];
  },

  getAvailableBuildings(campus?: string): string[] {
    if (campus === 'Dĩ An') return ['H1', 'H2', 'H3', 'H6'];
    if (campus === 'Thành phố') return ['A', 'B', 'C'];
    return [];
  },
};
