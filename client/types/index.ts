/**
 * Global TypeScript Type Definitions
 * Centralized type definitions for the application
 */

// User Types
export type UserRole = 'superadmin' | 'admin' | 'gudang' | 'user' | 'technician';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  phone: string;  // Primary identifier - WhatsApp number
  name: string;
  username?: string;
  role: UserRole;
  status: UserStatus;
  whatsappNumber?: string;
  avatar?: string;
  lastLogin?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Customer Types
export type CustomerStatus = 'active' | 'inactive' | 'suspended';
export type PackageType = '10mbps' | '20mbps' | '30mbps' | '50mbps' | '100mbps';

export interface Customer {
  id: string;
  name: string;
  phone: string;  // Primary contact - WhatsApp number
  address: string;
  package: PackageType;
  status: CustomerStatus;
  coordinates?: Coordinates;
  installationDate?: Date | string;
  lastPaymentDate?: Date | string;
  balance?: number;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Job Types
export type JobType = 'installation' | 'repair' | 'maintenance' | 'survey';
export type JobStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  customerId: string;
  customer?: Customer;
  technicianId?: string;
  technician?: User;
  scheduledDate?: Date | string;
  completedDate?: Date | string;
  description: string;
  notes?: string;
  materials?: JobMaterial[];
  photos?: string[];
  signature?: string;
  rating?: number;
  feedback?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface JobMaterial {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price?: number;
}

// Inventory Types
export type InventoryCategory = 'modem' | 'router' | 'cable' | 'connector' | 'tool' | 'other';
export type InventoryUnit = 'pcs' | 'meter' | 'box' | 'roll' | 'set';
export type TransactionType = 'in' | 'out' | 'adjustment' | 'return';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  minStock: number;
  unit: InventoryUnit;
  serialNumber?: string;
  supplier?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  location?: string;
  description?: string;
  image?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  item?: InventoryItem;
  type: TransactionType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  reference?: string;
  performedBy: string;
  user?: User;
  createdAt: Date | string;
}

// Notification Types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationChannel = 'whatsapp' | 'email' | 'in_app' | 'push';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel;
  recipientId: string;
  recipient?: User | Customer;
  read: boolean;
  readAt?: Date | string;
  metadata?: Record<string, any>;
  createdAt: Date | string;
}

// WhatsApp Types
export type WhatsAppStatus = 'connected' | 'disconnected' | 'connecting' | 'qr_code';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppSession {
  id: string;
  status: WhatsAppStatus;
  phoneNumber?: string;
  qrCode?: string;
  lastConnected?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  status: MessageStatus;
  type: 'text' | 'image' | 'document' | 'location';
  metadata?: Record<string, any>;
  sentAt?: Date | string;
  deliveredAt?: Date | string;
  readAt?: Date | string;
  createdAt: Date | string;
}

// Common Types
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: Coordinates;
}

export interface DateRange {
  from: Date | string;
  to: Date | string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    pagination?: Pagination;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Form Types
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
}

export interface FilterOption {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte';
  value: any;
}

// Dashboard Types
export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
  totalRevenue: number;
  monthlyRevenue: number;
  inventoryAlerts: number;
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: Date | string;
  value: number;
  label?: string;
}

// Report Types
export type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type ReportFormat = 'pdf' | 'excel' | 'csv';

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  parameters?: Record<string, any>;
  generatedBy: string;
  user?: User;
  fileUrl?: string;
  createdAt: Date | string;
}

// Settings Types
export interface SystemSettings {
  companyName: string;
  companyLogo?: string;
  companyAddress?: Address;
  companyPhone?: string;
  companyEmail?: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    whatsapp: boolean;
    push: boolean;
    inApp: boolean;
  };
  dashboard: {
    widgets: string[];
    layout: 'grid' | 'list';
  };
  table: {
    itemsPerPage: number;
    density: 'compact' | 'normal' | 'comfortable';
  };
}

// Activity Log Types
export type ActivityAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import';

export interface ActivityLog {
  id: string;
  userId: string;
  user?: User;
  action: ActivityAction;
  entity: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date | string;
}
