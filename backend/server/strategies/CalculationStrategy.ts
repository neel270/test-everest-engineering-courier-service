import { PackageData, Vehicle } from '../lib/delivery-service';

export interface CalculationStrategy {
  calculate(packages: PackageData[], vehicles: Vehicle[]): {
    results: any[];
    optimizationSteps: any[];
    vehicles: Vehicle[];
  };
}

export class WeightBasedStrategy implements CalculationStrategy {
  calculate(packages: PackageData[], vehicles: Vehicle[]): {
    results: any[];
    optimizationSteps: any[];
    vehicles: Vehicle[];
  } {
    // Sort packages by weight (heaviest first)
    const sortedPackages = [...packages].sort((a, b) => b.weight - a.weight);
    const sortedVehicles = [...vehicles].sort((a, b) => b.maxCarriableWeight - a.maxCarriableWeight);

    // Simple greedy assignment - heaviest packages to largest vehicles
    const assignments: any[] = [];
    const remainingPackages = [...sortedPackages];
    const updatedVehicles = [...sortedVehicles];

    for (const vehicle of updatedVehicles) {
      const vehiclePackages: PackageData[] = [];
      let currentWeight = 0;

      for (let i = remainingPackages.length - 1; i >= 0; i--) {
        const pkg = remainingPackages[i];
        if (currentWeight + pkg.weight <= vehicle.maxCarriableWeight) {
          vehiclePackages.push(pkg);
          currentWeight += pkg.weight;
          remainingPackages.splice(i, 1);
        }
      }

      if (vehiclePackages.length > 0) {
        assignments.push({
          vehicleId: vehicle.id,
          packages: vehiclePackages,
          totalWeight: currentWeight,
        });
      }
    }

    return {
      results: assignments,
      optimizationSteps: [],
      vehicles: updatedVehicles,
    };
  }
}

export class DistanceBasedStrategy implements CalculationStrategy {
  calculate(packages: PackageData[], vehicles: Vehicle[]): {
    results: any[];
    optimizationSteps: any[];
    vehicles: Vehicle[];
  } {
    // Sort packages by distance (longest first)
    const sortedPackages = [...packages].sort((a, b) => b.distance - a.distance);
    const sortedVehicles = [...vehicles].sort((a, b) => b.maxSpeed - a.maxSpeed);

    // Assign packages to fastest vehicles first
    const assignments: any[] = [];
    const remainingPackages = [...sortedPackages];
    const updatedVehicles = [...sortedVehicles];

    for (const vehicle of updatedVehicles) {
      const vehiclePackages: PackageData[] = [];
      let currentWeight = 0;

      for (let i = remainingPackages.length - 1; i >= 0; i--) {
        const pkg = remainingPackages[i];
        if (currentWeight + pkg.weight <= vehicle.maxCarriableWeight) {
          vehiclePackages.push(pkg);
          currentWeight += pkg.weight;
          remainingPackages.splice(i, 1);
        }
      }

      if (vehiclePackages.length > 0) {
        assignments.push({
          vehicleId: vehicle.id,
          packages: vehiclePackages,
          totalWeight: currentWeight,
        });
      }
    }

    return {
      results: assignments,
      optimizationSteps: [],
      vehicles: updatedVehicles,
    };
  }
}

export class BalancedStrategy implements CalculationStrategy {
  calculate(packages: PackageData[], vehicles: Vehicle[]): {
    results: any[];
    optimizationSteps: any[];
    vehicles: Vehicle[];
  } {
    // Sort packages by weight * distance ratio
    const sortedPackages = [...packages].sort((a, b) => {
      const ratioA = a.weight * a.distance;
      const ratioB = b.weight * b.distance;
      return ratioB - ratioA; // Higher ratio first
    });

    const sortedVehicles = [...vehicles].sort((a, b) => {
      const ratioA = a.maxCarriableWeight * a.maxSpeed;
      const ratioB = b.maxCarriableWeight * b.maxSpeed;
      return ratioB - ratioA; // Higher capacity*speed first
    });

    // Balanced assignment considering both weight and distance
    const assignments: any[] = [];
    const remainingPackages = [...sortedPackages];
    const updatedVehicles = [...sortedVehicles];

    for (const vehicle of updatedVehicles) {
      const vehiclePackages: PackageData[] = [];
      let currentWeight = 0;

      for (let i = remainingPackages.length - 1; i >= 0; i--) {
        const pkg = remainingPackages[i];
        if (currentWeight + pkg.weight <= vehicle.maxCarriableWeight) {
          vehiclePackages.push(pkg);
          currentWeight += pkg.weight;
          remainingPackages.splice(i, 1);
        }
      }

      if (vehiclePackages.length > 0) {
        assignments.push({
          vehicleId: vehicle.id,
          packages: vehiclePackages,
          totalWeight: currentWeight,
        });
      }
    }

    return {
      results: assignments,
      optimizationSteps: [],
      vehicles: updatedVehicles,
    };
  }
}

export class StrategyFactory {
  static create(strategy: 'weight' | 'distance' | 'balanced'): CalculationStrategy {
    switch (strategy) {
      case 'weight':
        return new WeightBasedStrategy();
      case 'distance':
        return new DistanceBasedStrategy();
      case 'balanced':
        return new BalancedStrategy();
      default:
        return new BalancedStrategy(); // Default strategy
    }
  }
}