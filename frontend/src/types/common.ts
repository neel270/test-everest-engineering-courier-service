// Common types used across frontend
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterOptions {
  startDate?: Date;
  endDate?: Date;
  minCost?: number;
  maxCost?: number;
  status?: string;
  [key: string]: string | number | Date | undefined;
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

export interface OfferCriteria {
  code: string;
  discount: number;
  minDistance: number;
  maxDistance: number;
  minWeight: number;
  maxWeight: number;
}

export interface PackageData {
  id: string;
  weight: number;
  distance: number;
  offerCode?: string;
}

export interface Vehicle {
  id: number;
  name?: string;
  maxSpeed: number;
  maxCarriableWeight: number;
  availableTime: number;
}

export type PackageSelectionStrategy = 'weight' | 'distance' | 'balanced';

export interface DeliveryScheduleConfig {
  strategy: PackageSelectionStrategy;
  stopOverhead: number;
  maxPackagesPerTrip: number;
}