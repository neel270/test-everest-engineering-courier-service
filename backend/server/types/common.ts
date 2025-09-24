// Common types used across backend
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface FilterOptions {
  startDate?: Date;
  endDate?: Date;
  minCost?: number;
  maxCost?: number;
  status?: string;
  [key: string]: any;
}

export type UserRole = 'admin' | 'user';
export type PackagePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TimeWindow {
  start: Date;
  end: Date;
}

export interface OptimizationStep {
  step: number;
  description: string;
  packagesRemaining: number;
  vehiclesAvailable: number;
  currentTime: number;
  vehicleAssignments?: Array<{
    vehicleId: number;
    name: string;
    packages: Array<{
      id: string;
      weight: number;
      distance: number;
      offerCode?: string;
    }>;
    totalWeight: number;
    maxDistance: number;
    deliveryTime: number;
    returnTime: number;
    availableAfter: number;
    vehicleSpeed?: number;
    perPackageTimes?: Array<{
      id: string;
      distance: number;
      deliveryTime: number;
    }>;
  }>;
  unassignedPackages: Array<{
    id: string;
    weight: number;
    distance: number;
    offerCode?: string;
  }>;
  assignedPackages?: Array<{
    id: string;
    weight: number;
    distance: number;
    offerCode?: string;
  }>;
  meta?: {
    maxSpeed: number;
    maxLoad: number;
  };
  combos?: Array<{
    packageIds: string[];
    packageWeights: number[];
    total: number;
    count: number;
  }>;
  heaviest?: {
    id: string;
    weight: number;
  };
  availability?: {
    vehicleReturns: Array<{
      vehicleId: number;
      name: string;
      returningIn: number;
    }>;
    firstAvailable?: {
      vehicleId: number;
      name: string;
      delta: number;
      expression: string;
      packages: Array<{
        id: string;
        weight: number;
        distance: number;
        offerCode?: string;
      }>;
      totalWeight: number;
      maxDistance: number;
      deliveryTime: number;
      returnTime: number;
      availableAfter: number;
      vehicleSpeed?: number;
    };
  };
}

export interface DeliveryResult {
  id: string;
  discount: number;
  totalCost: number;
  originalCost: number;
  estimatedDeliveryTime: number;
}

export interface Shipment {
  packages: Array<{
    id: string;
    weight: number;
    distance: number;
    offerCode?: string;
  }>;
  vehicleId: number;
  deliveryTime: number;
  returnTime: number;
}