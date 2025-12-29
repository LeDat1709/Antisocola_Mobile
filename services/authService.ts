import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

// Types
export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  fullName: string;
  role: string;
  requireOtp: boolean;
  message: string;
  otpCode?: string;
}

export interface RegisterRequest {
  email: string;
  fullName: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface InitiateRegistrationResponse {
  message: string;
  registrationToken: string;
  email: string;
  otpSent: boolean;
}

export interface VerifyRegistrationOtpRequest {
  email: string;
  otpCode: string;
  registrationToken: string;
}

export interface VerifyRegistrationOtpResponse {
  message: string;
  userId: string;
  email: string;
  fullName: string;
  userType: string;
  accountCreated: boolean;
}

export interface VerifyOtpRequest {
  email: string;
  otpCode: string;
  deviceId?: string;
  rememberDevice?: boolean;
}

export interface ForgotPasswordResponse {
  message: string;
  email: string;
  resetToken: string;
  otpExpirationMinutes: number;
}

export interface ResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
  confirmPassword: string;
}

// Password validation
export const passwordValidation = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,

  validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.minLength) {
      errors.push(`Ít nhất ${this.minLength} ký tự`);
    }
    if (!this.hasLowercase.test(password)) {
      errors.push('Ít nhất 1 chữ thường (a-z)');
    }
    if (!this.hasUppercase.test(password)) {
      errors.push('Ít nhất 1 chữ hoa (A-Z)');
    }
    if (!this.hasNumber.test(password)) {
      errors.push('Ít nhất 1 chữ số (0-9)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

// Generate device fingerprint
const generateDeviceId = (): string => {
  return `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const authService = {
  // Login
  async login(credentials: LoginRequest) {
    const deviceId = credentials.deviceId || generateDeviceId();
    
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
      deviceId,
    });

    // Nếu cần OTP (202 response)
    if (response.status === 202 || response.data.requireOtp) {
      await AsyncStorage.setItem('deviceId', deviceId);
      return {
        status: 202,
        data: response.data,
        message: response.data.message,
      };
    }

    // Thành công - Lưu tokens
    if (response.data.accessToken) {
      await this.saveTokens(response.data, deviceId);
    }

    return {
      status: 200,
      data: response.data,
    };
  },

  // Verify OTP (Login)
  async verifyOtp(request: VerifyOtpRequest) {
    const response = await apiClient.post<LoginResponse>('/auth/verify-otp', {
      email: request.email,
      otpCode: request.otpCode,
      deviceId: request.deviceId,
      rememberDevice: request.rememberDevice ?? false,
    });

    if (response.data.accessToken) {
      await this.saveTokens(response.data, request.deviceId || '');
    }

    return {
      status: 200,
      data: response.data,
    };
  },

  // Initiate Registration (Step 1)
  async initiateRegistration(data: RegisterRequest) {
    const response = await apiClient.post<InitiateRegistrationResponse>(
      '/auth/initiate-registration',
      data
    );
    return {
      status: 200,
      data: response.data,
    };
  },

  // Verify Registration OTP (Step 2)
  async verifyRegistrationOtp(data: VerifyRegistrationOtpRequest) {
    const response = await apiClient.post<VerifyRegistrationOtpResponse>(
      '/auth/verify-registration-otp',
      data
    );
    return {
      status: 201,
      data: response.data,
    };
  },

  // Forgot Password - Send OTP
  async sendForgotPasswordOtp(email: string) {
    const response = await apiClient.post<ForgotPasswordResponse>(
      '/auth/forgot-password',
      { email }
    );
    return response.data;
  },

  // Reset Password
  async resetPassword(data: ResetPasswordRequest) {
    const response = await apiClient.post('/auth/verify-password-reset-otp', data);
    return response.data;
  },

  // Save tokens to AsyncStorage
  async saveTokens(data: LoginResponse, deviceId: string) {
    await AsyncStorage.multiSet([
      ['accessToken', data.accessToken],
      ['refreshToken', data.refreshToken],
      ['userId', data.userId],
      ['userEmail', data.email],
      ['userRole', data.role],
      ['userFullName', data.fullName || ''],
      ['deviceId', deviceId],
    ]);
  },

  // Logout
  async logout() {
    await AsyncStorage.multiRemove([
      'accessToken',
      'refreshToken',
      'userId',
      'userEmail',
      'userRole',
      'userFullName',
      'deviceId',
    ]);
  },

  // Check if authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  },

  // Get user info
  async getUserInfo() {
    const [userId, email, role, fullName] = await AsyncStorage.multiGet([
      'userId',
      'userEmail',
      'userRole',
      'userFullName',
    ]);
    return {
      userId: userId[1],
      email: email[1],
      role: role[1],
      fullName: fullName[1],
    };
  },
};
