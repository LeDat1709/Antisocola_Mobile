import { apiClient } from './api';

export interface Printer {
  printerId: number;
  printerName: string;
  brand: string;
  model: string;
  location: string;
  campus: string;
  building: string;
  roomNumber: string;
  paperSizes: string;
  colorPrinting: boolean;
  duplexPrinting: boolean;
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Error' | 'OutOfPaper' | 'OutOfToner';
  statusMessage?: string;
  totalPagesPrinted: number;
  a4PaperRemaining?: number;
  a3PaperRemaining?: number;
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
  status?: string;
  keyword?: string;
}

export const printerService = {
  async getPrinters(
    filters: PrinterFilters = {},
    page: number = 0,
    size: number = 20
  ): Promise<PrinterListResponse> {
    let url = `/printers?page=${page}&size=${size}`;
    if (filters.campus) url += `&campus=${filters.campus}`;
    if (filters.building) url += `&building=${filters.building}`;
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.keyword) url += `&keyword=${filters.keyword}`;

    const response = await apiClient.get<{ data: PrinterListResponse }>(url);
    return response.data.data;
  },

  async getPrinterById(id: number): Promise<Printer> {
    const response = await apiClient.get<{ data: Printer }>(`/printers/${id}`);
    return response.data.data;
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
