import { apiClient, API_BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Document {
  id: number;
  fileName: string;
  fileExtension: string;
  fileSizeKB: number;
  uploadDate: string;
  totalPages?: number;
  isDeleted: boolean;
}

export interface DocumentListResponse {
  content: Document[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export const documentService = {
  async uploadDocument(
    fileUri: string,
    fileName: string,
    mimeType: string,
    onProgress?: (progress: number) => void
  ): Promise<{ id: number; fileName: string; message: string }> {
    const token = await AsyncStorage.getItem('accessToken');

    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve({
            id: response.data?.documentId,
            fileName: response.data?.originalFileName,
            message: response.message || 'Upload thành công',
          });
        } else {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Upload thất bại'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));

      xhr.open('POST', `${API_BASE_URL}/documents/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  },

  async getDocuments(
    page: number = 0,
    size: number = 10,
    fileType?: string
  ): Promise<DocumentListResponse> {
    let url = `/documents?page=${page}&size=${size}&sortBy=uploadDate&sortDirection=DESC`;
    if (fileType) url += `&fileType=${fileType}`;

    const response = await apiClient.get<{ data: any }>(url);
    const data = response.data.data;

    return {
      content: (data.content || []).map((item: any) => ({
        id: item.documentId,
        fileName: item.originalFileName,
        fileExtension: item.fileExtension?.toUpperCase(),
        fileSizeKB: item.fileSizeKB,
        uploadDate: item.uploadDate,
        totalPages: item.totalPages,
        isDeleted: item.isDeleted,
      })),
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      currentPage: data.currentPage,
      pageSize: data.pageSize,
    };
  },

  async getDocumentById(id: number): Promise<Document> {
    const response = await apiClient.get<{ data: any }>(`/documents/${id}`);
    const data = response.data.data;
    return {
      id: data.documentId,
      fileName: data.originalFileName,
      fileExtension: data.fileExtension,
      fileSizeKB: data.fileSizeKB,
      uploadDate: data.uploadDate,
      totalPages: data.totalPages,
      isDeleted: data.isDeleted,
    };
  },

  async deleteDocument(id: number): Promise<void> {
    await apiClient.post(`/documents/${id}/delete`, {});
  },
};
