/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import BaseService, { ApiResponse } from './baseService';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'gudang' | 'user' | 'technician';
  username?: string;
  status?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  email: string;
  otp: string;
  newPassword: string;
}

class AuthService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>('/api/auth/login', credentials, {
      showSuccess: true,
      successMessage: 'Login successful',
    });
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<ApiResponse<{ user: User }>> {
    return this.post<{ user: User }>('/api/auth/register', data, {
      showSuccess: true,
      successMessage: 'Registration successful',
    });
  }

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse<void>> {
    return this.post<void>('/api/auth/logout', {}, {
      showSuccess: true,
      successMessage: 'Logout successful',
    });
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.get<{ user: User }>('/api/auth/profile', {
      showError: true,
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(data: ProfileUpdateData): Promise<ApiResponse<{ user: User }>> {
    return this.put<{ user: User }>('/api/auth/profile', data, {
      showSuccess: true,
      successMessage: 'Profile updated successfully',
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.post<{ token: string }>('/api/auth/refresh', {}, {
      showError: false,
    });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<ApiResponse<void>> {
    return this.post<void>('/api/auth/forgot-password', data, {
      showSuccess: true,
      successMessage: 'If the email exists, a reset code will be sent',
    });
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(data: PasswordResetData): Promise<ApiResponse<void>> {
    return this.post<void>('/api/auth/reset-password', data, {
      showSuccess: true,
      successMessage: 'Password reset successful',
    });
  }

  /**
   * Verify OTP
   */
  async verifyOTP(otp: string, type: 'login' | 'password_reset'): Promise<ApiResponse<void>> {
    return this.post<void>('/api/auth/verify-otp', { otp, type }, {
      showSuccess: true,
      successMessage: 'OTP verified successfully',
    });
  }

  /**
   * Resend OTP
   */
  async resendOTP(type: 'login' | 'password_reset'): Promise<ApiResponse<void>> {
    return this.post<void>('/api/auth/resend-otp', { type }, {
      showSuccess: true,
      successMessage: 'OTP sent successfully',
    });
  }
}

const authService = new AuthService();
export default authService;
