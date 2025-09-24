import { DeliveryRepository } from '../repositories/DeliveryRepository';
import { PackageRepository } from '../repositories/PackageRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { DeliveryService } from '../services/DeliveryService';
import { PackageService } from '../services/PackageService';
import { VehicleService } from '../services/VehicleService';
import { UserService } from '../services/UserService';
import { DeliveryService as SharedDeliveryService } from '../lib/delivery-service';

interface ServiceContainer {
  deliveryRepository: DeliveryRepository;
  packageRepository: PackageRepository;
  vehicleRepository: VehicleRepository;
  deliveryService: DeliveryService;
  packageService: PackageService;
  vehicleService: VehicleService;
  userService: UserService;
  sharedDeliveryService: SharedDeliveryService;
}

class DIContainer {
  private static instance: DIContainer;
  private container: Partial<ServiceContainer> = {};

  private constructor() {}

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  register<T extends keyof ServiceContainer>(
    key: T,
    factory: () => ServiceContainer[T]
  ): void {
    this.container[key] = factory();
  }

  resolve<T extends keyof ServiceContainer>(key: T): ServiceContainer[T] {
    const service = this.container[key];
    if (!service) {
      throw new Error(`Service ${String(key)} not registered in container`);
    }
    return service;
  }

  // Helper method to register all core services
  registerCoreServices(): void {
    // Register repositories
    this.register('deliveryRepository', () => new DeliveryRepository());
    this.register('packageRepository', () => new PackageRepository());
    this.register('vehicleRepository', () => new VehicleRepository());

    // Register shared business logic service
    this.register('sharedDeliveryService', () => new SharedDeliveryService(100)); // Default base cost

    // Register application services
    this.register('deliveryService', () => new DeliveryService());
    this.register('packageService', () => new PackageService());
    this.register('vehicleService', () => new VehicleService());
    this.register('userService', () => new UserService());
  }

  // Helper method to get all registered services
  getAllServices(): Partial<ServiceContainer> {
    return this.container;
  }

  // Helper method to check if a service is registered
  isRegistered(key: keyof ServiceContainer): boolean {
    return this.container[key] !== undefined;
  }

  // Helper method to clear all services (useful for testing)
  clear(): void {
    this.container = {};
  }
}

export { DIContainer, ServiceContainer };