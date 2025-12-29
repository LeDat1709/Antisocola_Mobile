import { apiClient } from './api';

export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  userType: string;
  status: string;
  createdAt: string;
  lastLogin: string | null;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/profile');
    return response.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await apiClient.post<UserProfile>('/profile', data);
    return response.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/profile/change-password', data);
    return response.data;
  },
};
