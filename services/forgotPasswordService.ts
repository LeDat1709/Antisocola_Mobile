import { apiClient } from './api';

// Types
export interface ForgotPasswordResponse {
  message: string;
  email: string;
  resetToken: string;
  otpExpirationMinutes: number;
  timestamp: number;
}

export interface ResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
  email: string;
  userId: string;
  timestamp: number;
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

export const forgotPasswordService = {
  /**
   * POST /auth/forgot-password
   * Gửi OTP đến email để reset mật khẩu
   */
  async sendOtp(email: string): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', {
      email,
    });
    return response.data;
  },

  /**
   * POST /auth/verify-password-reset-otp
   * Xác thực OTP và đặt mật khẩu mới
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await apiClient.post<ResetPasswordResponse>('/auth/verify-password-reset-otp', data);
    return response.data;
  },
};
