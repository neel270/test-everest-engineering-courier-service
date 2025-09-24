import { PackageData, Vehicle, DeliveryResult } from '../lib/delivery-service';

export class PackageFactory {
  static createPackage(data: Partial<PackageData>): PackageData {
    return {
      id: data.id || this.generateId(),
      weight: data.weight || 0,
      distance: data.distance || 0,
      offerCode: data.offerCode,
    };
  }

  static createMultiplePackages(data: Partial<PackageData>[]): PackageData[] {
    return data.map(pkg => this.createPackage(pkg));
  }

  static generateId(): string {
    return `PKG${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  static createFromInput(input: string): PackageData[] {
    const lines = input.trim().split('\n');
    const packages: PackageData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const [id, weight, distance, offerCode] = lines[i].split(' ');
      packages.push(this.createPackage({
        id,
        weight: parseFloat(weight),
        distance: parseFloat(distance),
        offerCode: offerCode || undefined,
      }));
    }

    return packages;
  }
}

export class VehicleFactory {
  static createVehicle(data: Partial<Vehicle>): Vehicle {
    return {
      id: data.id || this.generateId(),
      name: data.name || `Vehicle ${data.id || this.generateId()}`,
      maxSpeed: data.maxSpeed || 70,
      maxCarriableWeight: data.maxCarriableWeight || 200,
      availableTime: data.availableTime || 0,
    };
  }

  static createMultipleVehicles(data: Partial<Vehicle>[]): Vehicle[] {
    return data.map(vehicle => this.createVehicle(vehicle));
  }

  static generateId(): number {
    return Math.floor(Math.random() * 10000) + 1;
  }

  static createFromInput(input: string): Vehicle[] {
    const lines = input.trim().split('\n');
    const [vehicleCount, maxSpeed, maxWeight] = lines[lines.length - 1].split(' ').map(Number);

    const vehicles: Vehicle[] = [];
    for (let i = 1; i <= vehicleCount; i++) {
      vehicles.push(this.createVehicle({
        id: i,
        maxSpeed,
        maxCarriableWeight: maxWeight,
      }));
    }

    return vehicles;
  }

  static createOptimizedVehicles(count: number): Vehicle[] {
    const vehicles: Vehicle[] = [];

    // Create a mix of different vehicle types for optimization
    const vehicleTypes = [
      { name: 'Small Van', maxSpeed: 80, maxWeight: 150 },
      { name: 'Medium Truck', maxSpeed: 70, maxWeight: 200 },
      { name: 'Large Truck', maxSpeed: 60, maxWeight: 300 },
      { name: 'Express Van', maxSpeed: 90, maxWeight: 120 },
    ];

    for (let i = 0; i < count; i++) {
      const type = vehicleTypes[i % vehicleTypes.length];
      vehicles.push(this.createVehicle({
        id: i + 1,
        name: type.name,
        maxSpeed: type.maxSpeed,
        maxCarriableWeight: type.maxWeight,
      }));
    }

    return vehicles;
  }
}

export class DeliveryResultFactory {
  static createDeliveryResult(data: Partial<DeliveryResult>): DeliveryResult {
    return {
      id: data.id || '',
      discount: data.discount || 0,
      totalCost: data.totalCost || 0,
      originalCost: data.originalCost || 0,
      estimatedDeliveryTime: data.estimatedDeliveryTime || 0,
    };
  }

  static createMultipleResults(data: Partial<DeliveryResult>[]): DeliveryResult[] {
    return data.map(result => this.createDeliveryResult(result));
  }

  static createFromCalculation(
    packageData: PackageData,
    baseCost: number,
    discount: number = 0
  ): DeliveryResult {
    const originalCost = baseCost + (packageData.weight * 10) + (packageData.distance * 5);
    const totalCost = originalCost - discount;

    return this.createDeliveryResult({
      id: packageData.id,
      discount,
      totalCost,
      originalCost,
      estimatedDeliveryTime: 0, // Will be calculated later
    });
  }
}

export class DeliveryFactory {
  static createDeliveryRequest(
    packages: PackageData[],
    vehicles: Vehicle[],
    baseDeliveryCost: number = 100
  ): any {
    return {
      packages,
      vehicles,
      baseDeliveryCost,
      timestamp: new Date(),
    };
  }

  static createDeliveryCalculationInput(
    packages: PackageData[],
    vehicles: Vehicle[],
    baseCost: number = 100
  ): string {
    let input = `${baseCost} ${packages.length}\n`;

    packages.forEach(pkg => {
      input += `${pkg.id} ${pkg.weight} ${pkg.distance} ${pkg.offerCode || ''}\n`;
    });

    input += `${vehicles.length} ${vehicles[0]?.maxSpeed || 70} ${vehicles[0]?.maxCarriableWeight || 200}`;

    return input;
  }
}