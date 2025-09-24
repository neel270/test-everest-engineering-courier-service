// Package related types and interfaces
import { BaseEntity, PackagePriority, TimeWindow } from './common';

export interface IPackage extends BaseEntity {
  id: string;
  weight: number;
  distance: number;
  offerCode?: string;
  estimatedDeliveryTime?: number;
  deliveryTimeWindow?: TimeWindow;
  priority: PackagePriority;
}

export interface CreatePackageRequest {
  id: string;
  weight: number;
  distance: number;
  offerCode?: string;
  estimatedDeliveryTime?: number;
  deliveryTimeWindow?: {
    start: string;
    end: string;
  };
  priority?: PackagePriority;
}

export interface UpdatePackageRequest {
  id?: string;
  weight?: number;
  distance?: number;
  offerCode?: string;
  estimatedDeliveryTime?: number;
  deliveryTimeWindow?: {
    start: string;
    end: string;
  };
  priority?: PackagePriority;
}

export interface PackageResponse {
  id: string;
  weight: number;
  distance: number;
  offerCode?: string;
  estimatedDeliveryTime?: number;
  deliveryTimeWindow?: TimeWindow;
  priority: PackagePriority;
  createdAt: Date;
  updatedAt: Date;
}

export interface PackageFilters {
  offerCode?: string;
  minWeight?: number;
  maxWeight?: number;
  minDistance?: number;
  maxDistance?: number;
  priority?: PackagePriority;
  search?: string;
}

export interface PackageData {
  id: string;
  weight: number;
  distance: number;
  offerCode?: string;
}