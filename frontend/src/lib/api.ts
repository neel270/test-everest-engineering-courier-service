import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: PaginationInfo;
  };
  message?: string;
  error?: string;
}

// Auth API
export const authApi = {
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role?: 'admin' | 'user';
  }) => {
    const response = await api.post<ApiResponse>('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post<ApiResponse>('/auth/login', credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get<ApiResponse>('/auth/profile');
    return response.data;
  },

  getUsers: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse>('/auth/users', { params });
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get<ApiResponse>(`/auth/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, userData: {
    name?: string;
    email?: string;
    role?: 'admin' | 'user';
    isActive?: boolean;
  }) => {
    const response = await api.put<ApiResponse>(`/auth/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/auth/users/${id}`);
    return response.data;
  },

  changePassword: async (passwordData: {
    oldPassword: string;
    newPassword: string;
  }) => {
    const response = await api.put<ApiResponse>('/auth/change-password', passwordData);
    return response.data;
  },

  toggleUserStatus: async (id: string) => {
    const response = await api.put<ApiResponse>(`/auth/users/${id}/status`);
    return response.data;
  },

  getUsersByRole: async (role: 'admin' | 'user') => {
    const response = await api.get<ApiResponse>(`/auth/users/role/${role}`);
    return response.data;
  },
};

// Package API
export const packageApi = {
  getPackages: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse>('/packages', { params });
    return response.data;
  },

  getPackageById: async (id: string) => {
    const response = await api.get<ApiResponse>(`/packages/${id}`);
    return response.data;
  },

  createPackage: async (packageData: {
    id: string;
    weight: number;
    distance: number;
    offerCode?: string;
    estimatedDeliveryTime?: number;
    deliveryTimeWindow?: {
      start: string;
      end: string;
    };
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) => {
    const response = await api.post<ApiResponse>('/packages', packageData);
    return response.data;
  },

  updatePackage: async (id: string, packageData: {
    id?: string;
    weight?: number;
    distance?: number;
    offerCode?: string;
    estimatedDeliveryTime?: number;
    deliveryTimeWindow?: {
      start: string;
      end: string;
    };
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) => {
    const response = await api.put<ApiResponse>(`/packages/${id}`, packageData);
    return response.data;
  },

  deletePackage: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/packages/${id}`);
    return response.data;
  },

  getPackagesByOfferCode: async (offerCode: string) => {
    const response = await api.get<ApiResponse>(`/packages/offer/${offerCode}`);
    return response.data;
  },

  getPackagesByWeightRange: async (minWeight: number, maxWeight: number) => {
    const response = await api.get<ApiResponse>('/packages/weight-range/search', {
      params: { minWeight, maxWeight }
    });
    return response.data;
  },
};

// Vehicle API
export const vehicleApi = {
  getVehicles: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse>('/vehicles', { params });
    return response.data;
  },

  getVehicleById: async (id: string) => {
    const response = await api.get<ApiResponse>(`/vehicles/${id}`);
    return response.data;
  },

  createVehicle: async (vehicleData: {
    id: number;
    maxSpeed: number;
    maxCarriableWeight: number;
    availableTime?: number;
  }) => {
    const response = await api.post<ApiResponse>('/vehicles', vehicleData);
    return response.data;
  },

  updateVehicle: async (id: string, vehicleData: {
    id?: number;
    maxSpeed?: number;
    maxCarriableWeight?: number;
    availableTime?: number;
  }) => {
    const response = await api.put<ApiResponse>(`/vehicles/${id}`, vehicleData);
    return response.data;
  },

  deleteVehicle: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/vehicles/${id}`);
    return response.data;
  },

  getAvailableVehicles: async () => {
    const response = await api.get<ApiResponse>('/vehicles/available/all');
    return response.data;
  },

  getAllVehiclesForDelivery: async () => {
    const response = await api.get<ApiResponse>('/vehicles/delivery/all');
    return response.data;
  },

  getVehiclesBySpeedRange: async (minSpeed: number, maxSpeed: number) => {
    const response = await api.get<ApiResponse>('/vehicles/speed-range/search', {
      params: { minSpeed, maxSpeed }
    });
    return response.data;
  },

  getVehiclesByWeightCapacity: async (minWeight: number, maxWeight: number) => {
    const response = await api.get<ApiResponse>('/vehicles/weight-range/search', {
      params: { minWeight, maxWeight }
    });
    return response.data;
  },

  updateVehicleAvailability: async (id: string, availableTime: number) => {
    const response = await api.put<ApiResponse>(`/vehicles/${id}/availability`, {
      availableTime
    });
    return response.data;
  },
};

// Delivery API
export const deliveryApi = {
  calculateDeliveryCosts: async (deliveryData: {
    packages: Array<{
      id: string;
      weight: number;
      distance: number;
      offerCode?: string;
    }>;
    vehicles: Array<{
      id: number;
      maxSpeed: number;
      maxCarriableWeight: number;
      availableTime?: number;
    }>;
    baseDeliveryCost: number;
  }) => {
    const response = await api.post<ApiResponse>('/delivery/calculate', deliveryData);
    return response.data;
  },

  getDeliveryHistory: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse>('/delivery/history', { params });
    return response.data;
  },

  getDeliveryById: async (id: string) => {
    const response = await api.get<ApiResponse>(`/delivery/${id}`);
    return response.data;
  },

  getDeliveryStats: async () => {
    const response = await api.get<ApiResponse>('/delivery/stats/all');
    return response.data;
  },

  deleteDelivery: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/delivery/${id}`);
    return response.data;
  },

  getDeliveriesByDateRange: async (startDate: string, endDate: string) => {
    const response = await api.get<ApiResponse>('/delivery/date-range/search', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  getDeliveriesByCostRange: async (minCost: number, maxCost: number) => {
    const response = await api.get<ApiResponse>('/delivery/cost-range/search', {
      params: { minCost, maxCost }
    });
    return response.data;
  },
};

export default api;