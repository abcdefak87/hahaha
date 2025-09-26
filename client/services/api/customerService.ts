/**
 * Customer API Service
 * Handles all customer-related API calls
 */

import BaseService, { ApiResponse } from './baseService';

// Types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  package: string;
  status: 'active' | 'inactive' | 'suspended';
  coordinates?: {
    lat: number;
    lng: number;
  };
  installationDate?: string;
  lastPaymentDate?: string;
  balance?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone: string;
  address: string;
  package: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  notes?: string;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  status?: 'active' | 'inactive' | 'suspended';
}

export interface CustomerFilters {
  search?: string;
  status?: string;
  package?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  byPackage: {
    package: string;
    count: number;
  }[];
}

class CustomerService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Get all customers with filters
   */
  async getCustomers(filters?: CustomerFilters): Promise<ApiResponse<Customer[]>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    return this.get<Customer[]>(`/api/customers?${params.toString()}`);
  }

  /**
   * Get customer by ID
   */
  async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    return this.get<Customer>(`/api/customers/${id}`);
  }

  /**
   * Create new customer
   */
  async createCustomer(data: CreateCustomerData): Promise<ApiResponse<Customer>> {
    return this.post<Customer>('/api/customers', data, {
      showSuccess: true,
      successMessage: 'Customer created successfully',
    });
  }

  /**
   * Update customer
   */
  async updateCustomer(id: string, data: UpdateCustomerData): Promise<ApiResponse<Customer>> {
    return this.put<Customer>(`/api/customers/${id}`, data, {
      showSuccess: true,
      successMessage: 'Customer updated successfully',
    });
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/customers/${id}`, {
      showSuccess: true,
      successMessage: 'Customer deleted successfully',
    });
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(): Promise<ApiResponse<CustomerStats>> {
    return this.get<CustomerStats>('/api/customers/stats');
  }

  /**
   * Search customers
   */
  async searchCustomers(query: string): Promise<ApiResponse<Customer[]>> {
    return this.get<Customer[]>(`/api/customers/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * Export customers to CSV
   */
  async exportCustomers(filters?: CustomerFilters): Promise<void> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    return this.download(
      `/api/customers/export?${params.toString()}`,
      `customers_${new Date().toISOString().split('T')[0]}.csv`
    );
  }

  /**
   * Import customers from CSV
   */
  async importCustomers(file: File): Promise<ApiResponse<{ imported: number; failed: number }>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.upload<{ imported: number; failed: number }>(
      '/api/customers/import',
      formData,
      {
        showSuccess: true,
        successMessage: 'Customers imported successfully',
      }
    );
  }

  /**
   * Send notification to customer
   */
  async sendNotification(
    customerId: string,
    notification: {
      type: 'payment_reminder' | 'maintenance' | 'custom';
      message: string;
      channel: 'whatsapp' | 'email' | 'both';
    }
  ): Promise<ApiResponse<void>> {
    return this.post<void>(`/api/customers/${customerId}/notify`, notification, {
      showSuccess: true,
      successMessage: 'Notification sent successfully',
    });
  }

  /**
   * Get customer payment history
   */
  async getPaymentHistory(customerId: string): Promise<ApiResponse<any[]>> {
    return this.get<any[]>(`/api/customers/${customerId}/payments`);
  }

  /**
   * Get customer service history
   */
  async getServiceHistory(customerId: string): Promise<ApiResponse<any[]>> {
    return this.get<any[]>(`/api/customers/${customerId}/services`);
  }
}

const customerService = new CustomerService();
export default customerService;
