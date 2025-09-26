/**
 * Base API Service
 * Provides base configuration and methods for API calls
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: any;
}

// Request configuration
export interface RequestConfig extends AxiosRequestConfig {
  showError?: boolean;
  showSuccess?: boolean;
  successMessage?: string;
}

class BaseService {
  protected api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor(baseURL?: string) {
    this.api = axios.create({
      baseURL: baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = Cookies.get('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as RequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.api(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken = Cookies.get('refreshToken');

          if (!refreshToken) {
            this.isRefreshing = false;
            this.handleLogout();
            return Promise.reject(error);
          }

          try {
            const response = await axios.post(
              `${this.api.defaults.baseURL}/api/auth/refresh`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${refreshToken}`,
                },
                withCredentials: true,
              }
            );

            const { token } = response.data.data;
            Cookies.set('token', token);
            this.processQueue(null, token);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }

            return this.api(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.handleLogout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        if (originalRequest.showError !== false) {
          this.handleError(error);
        }

        return Promise.reject(error);
      }
    );
  }

  private handleLogout() {
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    window.location.href = '/login';
  }

  private handleError(error: AxiosError<ApiError>) {
    let message = 'An unexpected error occurred';

    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }

    // Network errors
    if (!error.response) {
      message = 'Network error. Please check your connection.';
    }

    // Specific status codes
    switch (error.response?.status) {
      case 400:
        message = error.response.data?.message || 'Bad request';
        break;
      case 403:
        message = 'You do not have permission to perform this action';
        break;
      case 404:
        message = 'Resource not found';
        break;
      case 429:
        message = 'Too many requests. Please try again later.';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
    }

    toast.error(message);
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.get<ApiResponse<T>>(url, config);
    if (config?.showSuccess && config?.successMessage) {
      toast.success(config.successMessage);
    }
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.post<ApiResponse<T>>(url, data, config);
    if (config?.showSuccess !== false && response.data.message) {
      toast.success(config?.successMessage || response.data.message);
    }
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.put<ApiResponse<T>>(url, data, config);
    if (config?.showSuccess !== false && response.data.message) {
      toast.success(config?.successMessage || response.data.message);
    }
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.patch<ApiResponse<T>>(url, data, config);
    if (config?.showSuccess !== false && response.data.message) {
      toast.success(config?.successMessage || response.data.message);
    }
    return response.data;
  }

  async delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.delete<ApiResponse<T>>(url, config);
    if (config?.showSuccess !== false && response.data.message) {
      toast.success(config?.successMessage || response.data.message);
    }
    return response.data;
  }

  // File upload
  async upload<T = any>(
    url: string,
    formData: FormData,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.api.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });

    if (config?.showSuccess !== false) {
      toast.success(config?.successMessage || 'File uploaded successfully');
    }

    return response.data;
  }

  // Download file
  async download(url: string, filename?: string, config?: RequestConfig): Promise<void> {
    try {
      const response = await this.api.get(url, {
        ...config,
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      if (config?.showSuccess !== false) {
        toast.success(config?.successMessage || 'File downloaded successfully');
      }
    } catch (error) {
      if (config?.showError !== false) {
        toast.error('Failed to download file');
      }
      throw error;
    }
  }
}

export default BaseService;
