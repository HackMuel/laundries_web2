export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  orders?: Order[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedTime: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  serviceId: string;
  service?: Service;
  quantity: number;
  price?: number;
  total?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  note?: string;
  paymentMethod?: string;
  isPaid: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; user?: User; error?: string }>;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
