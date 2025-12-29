import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Android emulator: 10.0.2.2, iOS simulator: localhost, Real device: your IP
const getBaseUrl = () => {
  // Đổi IP này thành IP máy tính của bạn khi test trên thiết bị thật
  // Chạy 'ipconfig' trên Windows để lấy IP
  const LOCAL_IP = '192.168.1.81'; // <-- Đổi IP của bạn ở đây
  
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Real device: dùng IP máy tính, Emulator: dùng 10.0.2.2
      return `http://${LOCAL_IP}:8081/api`;
    }
    return 'http://localhost:8081/api';
  }
  return 'https://your-production-api.com/api';
};

export const API_BASE_URL = getBaseUrl();

export interface ApiResponse<T> {
  data: T;
  status: number;
}

export interface ApiError {
  error: string;
  message?: string;
  timestamp?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async post<T>(endpoint: string, data?: object): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseData = await response.json();

    if (!response.ok && response.status !== 202) {
      throw new Error(responseData.error || responseData.message || 'Request failed');
    }

    return {
      data: responseData,
      status: response.status,
    };
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: await this.getHeaders(),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || responseData.message || 'Request failed');
    }

    return {
      data: responseData,
      status: response.status,
    };
  }

  async put<T>(endpoint: string, data?: object): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: await this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || responseData.message || 'Request failed');
    }

    return {
      data: responseData,
      status: response.status,
    };
  }

  async patch<T>(endpoint: string, data?: object): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: await this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || responseData.message || 'Request failed');
    }

    return {
      data: responseData,
      status: response.status,
    };
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });

    if (response.status === 204) {
      return { data: {} as T, status: 204 };
    }

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || responseData.message || 'Request failed');
    }

    return {
      data: responseData,
      status: response.status,
    };
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
