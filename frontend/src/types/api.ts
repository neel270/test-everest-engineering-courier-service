// API related types and interfaces for frontend
import { PaginationParams, PaginatedResponse, ApiResponse, PaginationInfo } from './common';
import { CreateUserRequest, UpdateUserRequest, UserResponse, LoginRequest, LoginResponse, ChangePasswordRequest, UserFilters } from './user';
import { CreatePackageRequest, UpdatePackageRequest, PackageResponse, PackageFilters } from './package';
import { CreateVehicleRequest, UpdateVehicleRequest, VehicleResponse, VehicleFilters, VehicleAvailabilityUpdate } from './vehicle';
import { CreateDeliveryRequest, DeliveryCalculationRequest, DeliveryResponse, DeliveryFilters, DeliveryStats } from './delivery';

// Re-export common types for easier access
export type { PaginationInfo, PaginatedResponse, ApiResponse } from './common';

// Generic API response types
export type UserApiResponse = ApiResponse<UserResponse>;
export type UsersApiResponse = ApiResponse<UserResponse[]>;
export type PaginatedUsersResponse = ApiResponse<PaginatedResponse<UserResponse>>;

export type PackageApiResponse = ApiResponse<PackageResponse>;
export type PackagesApiResponse = ApiResponse<PackageResponse[]>;
export type PaginatedPackagesResponse = ApiResponse<PaginatedResponse<PackageResponse>>;

export type VehicleApiResponse = ApiResponse<VehicleResponse>;
export type VehiclesApiResponse = ApiResponse<VehicleResponse[]>;
export type PaginatedVehiclesResponse = ApiResponse<PaginatedResponse<VehicleResponse>>;

export type DeliveryApiResponse = ApiResponse<DeliveryResponse>;
export type DeliveriesApiResponse = ApiResponse<DeliveryResponse[]>;
export type PaginatedDeliveriesResponse = ApiResponse<PaginatedResponse<DeliveryResponse>>;
export type DeliveryStatsResponse = ApiResponse<DeliveryStats>;

// Request/Response types for each endpoint
export interface AuthApi {
  register(data: CreateUserRequest): Promise<UserApiResponse>;
  login(data: LoginRequest): Promise<ApiResponse<LoginResponse>>;
  getProfile(): Promise<UserApiResponse>;
  getUsers(params?: PaginationParams & UserFilters): Promise<PaginatedUsersResponse>;
  getUserById(id: string): Promise<UserApiResponse>;
  updateUser(id: string, data: UpdateUserRequest): Promise<UserApiResponse>;
  deleteUser(id: string): Promise<ApiResponse>;
  changePassword(data: ChangePasswordRequest): Promise<ApiResponse>;
  toggleUserStatus(id: string): Promise<UserApiResponse>;
  getUsersByRole(role: 'admin' | 'user'): Promise<UsersApiResponse>;
}

export interface PackageApi {
  getPackages(params?: PaginationParams & PackageFilters): Promise<PaginatedPackagesResponse>;
  getPackageById(id: string): Promise<PackageApiResponse>;
  createPackage(data: CreatePackageRequest): Promise<PackageApiResponse>;
  updatePackage(id: string, data: UpdatePackageRequest): Promise<PackageApiResponse>;
  deletePackage(id: string): Promise<ApiResponse>;
  getPackagesByOfferCode(offerCode: string): Promise<PackagesApiResponse>;
  getPackagesByWeightRange(minWeight: number, maxWeight: number): Promise<PackagesApiResponse>;
}

export interface VehicleApi {
  getVehicles(params?: PaginationParams & VehicleFilters): Promise<PaginatedVehiclesResponse>;
  getVehicleById(id: string): Promise<VehicleApiResponse>;
  createVehicle(data: CreateVehicleRequest): Promise<VehicleApiResponse>;
  updateVehicle(id: string, data: UpdateVehicleRequest): Promise<VehicleApiResponse>;
  deleteVehicle(id: string): Promise<ApiResponse>;
  getAvailableVehicles(): Promise<VehiclesApiResponse>;
  getAllVehiclesForDelivery(): Promise<VehiclesApiResponse>;
  getVehiclesBySpeedRange(minSpeed: number, maxSpeed: number): Promise<VehiclesApiResponse>;
  getVehiclesByWeightCapacity(minWeight: number, maxWeight: number): Promise<VehiclesApiResponse>;
  updateVehicleAvailability(id: string, data: VehicleAvailabilityUpdate): Promise<VehicleApiResponse>;
}

export interface DeliveryApi {
  calculateDeliveryCosts(data: DeliveryCalculationRequest): Promise<DeliveryApiResponse>;
  getDeliveryHistory(params?: PaginationParams & DeliveryFilters): Promise<PaginatedDeliveriesResponse>;
  getDeliveryById(id: string): Promise<DeliveryApiResponse>;
  getDeliveryStats(): Promise<DeliveryStatsResponse>;
  deleteDelivery(id: string): Promise<ApiResponse>;
  getDeliveriesByDateRange(startDate: string, endDate: string): Promise<DeliveriesApiResponse>;
  getDeliveriesByCostRange(minCost: number, maxCost: number): Promise<DeliveriesApiResponse>;
  getDeliveriesByVehicle(vehicleId: string): Promise<DeliveriesApiResponse>;
  getDeliveriesWithFilters(filters: PaginationParams & DeliveryFilters): Promise<PaginatedDeliveriesResponse>;
}

// API client configuration
export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// API error types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Hook return types
export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export interface UsePaginatedApiReturn<T> {
  data: T[] | null;
  pagination: PaginationInfo | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}