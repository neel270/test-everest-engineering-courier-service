// Vehicle related types and interfaces

export interface IVehicle {
  id: number;
  name: string;
  maxSpeed: number;
  maxCarriableWeight: number;
  availableTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleRequest {
  id: number;
  name: string;
  maxSpeed: number;
  maxCarriableWeight: number;
  availableTime?: number;
}

export interface UpdateVehicleRequest {
  id?: number;
  name?: string;
  maxSpeed?: number;
  maxCarriableWeight?: number;
  availableTime?: number;
}

export interface VehicleResponse {
  id: number;
  name: string;
  maxSpeed: number;
  maxCarriableWeight: number;
  availableTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleFilters {
  minSpeed?: number;
  maxSpeed?: number;
  minWeight?: number;
  maxWeight?: number;
  available?: boolean;
  search?: string;
}

export interface VehicleAvailabilityUpdate {
  availableTime: number;
}