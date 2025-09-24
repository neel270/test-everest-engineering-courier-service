// Delivery related types and interfaces
import { BaseEntity } from './common';
import { PackageData } from './package';

export interface IDelivery extends BaseEntity {
  packages: string[]; // Array of package IDs
  vehicles: string[]; // Array of vehicle IDs
  baseDeliveryCost: number;
  results: Array<{
    id: string;
    discount: number;
    totalCost: number;
    originalCost: number;
    estimatedDeliveryTime: number;
  }>;
  optimizationSteps: Array<{
    step: number;
    description: string;
    packagesRemaining: number;
    vehiclesAvailable: number;
    currentTime: number;
    vehicleAssignments: Array<{
      vehicleId: number;
      packages: PackageData[];
      totalWeight: number;
      maxDistance: number;
      deliveryTime: number;
      returnTime: number;
      availableAfter: number;
    }>;
    unassignedPackages: PackageData[];
    assignedPackages?: PackageData[];
  }>;
  totalCost: number;
  totalDiscount: number;
}

export interface CreateDeliveryRequest {
  packages: string[];
  vehicles: string[];
  baseDeliveryCost: number;
}

export interface DeliveryCalculationRequest {
  packages: PackageData[];
  vehicles: Array<{
    id: number;
    name: string;
    maxSpeed: number;
    maxCarriableWeight: number;
    availableTime?: number;
  }>;
  baseDeliveryCost: number;
}

export interface DeliveryResponse {
  id: string;
  packages: string[];
  vehicles: string[];
  baseDeliveryCost: number;
  results: Array<{
    id: string;
    discount: number;
    totalCost: number;
    originalCost: number;
    estimatedDeliveryTime: number;
  }>;
  optimizationSteps: Array<{
    step: number;
    description: string;
    packagesRemaining: number;
    vehiclesAvailable: number;
    currentTime: number;
    vehicleAssignments: Array<{
      vehicleId: number;
      packages: PackageData[];
      totalWeight: number;
      maxDistance: number;
      deliveryTime: number;
      returnTime: number;
      availableAfter: number;
    }>;
    unassignedPackages: PackageData[];
    assignedPackages?: PackageData[];
  }>;
  totalCost: number;
  totalDiscount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryFilters {
  startDate?: Date;
  endDate?: Date;
  minCost?: number;
  maxCost?: number;
  vehicleId?: string;
  search?: string;
  minTime?: number;
  maxTime?: number;
}

export interface DeliveryStats {
  totalDeliveries: number;
  totalCost: number;
  totalDiscount: number;
  averageCost: number;
  averageDiscount: number;
}