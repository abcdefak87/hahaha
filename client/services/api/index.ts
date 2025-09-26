/**
 * API Services Export
 * Central export point for all API services
 */

export { default as authService } from './authService';
export { default as customerService } from './customerService';
export { default as BaseService } from './baseService';

// Re-export types
export type { ApiResponse, ApiError, RequestConfig } from './baseService';
export type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  LoginResponse,
  ProfileUpdateData,
  PasswordResetRequest,
  PasswordResetData 
} from './authService';
export type { 
  Customer, 
  CreateCustomerData, 
  UpdateCustomerData, 
  CustomerFilters,
  CustomerStats 
} from './customerService';
