import { apiClient } from './api';

export interface PrintJobRequest {
  documentId: number;
  printerId: number;
  paperSize: 'A4' | 'A3';
  pageRange?: string;
  duplex: boolean;
  copies: number;
  colorMode?: 'BlackWhite' | 'Color' | 'Grayscale';
  colorPageRange?: string;
}

export interface PrintJob {
  jobId: number;
  documentId: number;
  documentName?: string;
  printerId: string;
  printerName?: string;
  paperSize: string;
  pageRange?: string;
  colorMode: string;
  duplex: boolean;
  numCopies: number;
  totalPagesToPrint: number;
  a4EquivalentPages: number;
  jobStatus: 'Pending' | 'Printing' | 'Completed' | 'Failed' | 'Cancelled';
  submittedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface PrintJobResponse {
  jobId: number;
  documentId: number;
  printerId: number;
  paperSize: string;
  duplex: boolean;
  copies: number;
  totalPages: number;
  pagesA4Equivalent: number;
  status: string;
  submittedAt: string;
}

export const printJobService = {
  async submitPrintJob(request: PrintJobRequest): Promise<PrintJobResponse> {
    const response = await apiClient.post<{ data: PrintJobResponse }>('/print-jobs', request);
    return response.data.data;
  },

  async getMyPrintJobs(): Promise<PrintJob[]> {
    const response = await apiClient.get<PrintJob[]>('/print-jobs');
    return response.data;
  },

  async cancelPrintJob(jobId: number): Promise<void> {
    await apiClient.delete(`/print-jobs/${jobId}`);
  },

  calculatePages(
    documentTotalPages: number,
    paperSize: 'A4' | 'A3',
    duplex: boolean,
    copies: number,
    pageRange?: string
  ): number {
    let pagesToPrint = documentTotalPages;

    if (pageRange?.trim()) {
      pagesToPrint = this.parsePageRange(pageRange, documentTotalPages);
    }

    let a4Equivalent = pagesToPrint;
    if (paperSize === 'A3') a4Equivalent *= 2;
    if (duplex) a4Equivalent *= 0.5;
    a4Equivalent *= copies;

    return Math.ceil(a4Equivalent);
  },

  parsePageRange(pageRange: string, maxPages: number): number {
    const ranges = pageRange.split(',').map((r) => r.trim());
    let totalPages = 0;

    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map((n) => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end) && start > 0 && end <= maxPages && start <= end) {
          totalPages += end - start + 1;
        }
      } else {
        const page = parseInt(range);
        if (!isNaN(page) && page > 0 && page <= maxPages) {
          totalPages += 1;
        }
      }
    }
    return totalPages;
  },
};
