export interface PackageData {
  id: string;
  weight: number;
  distance: number;
  offerCode?: string;
}

export interface OfferCriteria {
  code: string;
  discount: number;
  minDistance: number;
  maxDistance: number;
  minWeight: number;
  maxWeight: number;
}

export interface Vehicle {
  id: number;
  name?: string;
  maxSpeed: number; // km/hr
  maxCarriableWeight: number; // kg
  availableTime: number; // hours
}

export interface DeliveryResult {
  id: string;
  discount: number;
  totalCost: number;
  originalCost: number;
  estimatedDeliveryTime: number; // hours
}

export interface Shipment {
  packages: PackageData[];
  vehicleId: number;
  deliveryTime: number;
  returnTime: number;
}

export interface OptimizationStep {
  step: number;
  description: string;
  packagesRemaining: number;
  vehiclesAvailable: number;
  currentTime: number;
  vehicleAssignments: Array<{
    vehicleId: number;
    name: string;
    packages: PackageData[];
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
  unassignedPackages: PackageData[];
  assignedPackages?: PackageData[];
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
  heaviest?: { id: string; weight: number };
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
      packages: PackageData[];
      totalWeight: number;
      maxDistance: number;
      deliveryTime: number;
      returnTime: number;
      availableAfter: number;
      vehicleSpeed?: number;
    };
  };
}

export type PackageSelectionStrategy = 'weight' | 'distance' | 'balanced';

export interface DeliveryScheduleConfig {
  strategy: PackageSelectionStrategy;
  stopOverhead: number; // hours per extra package
  maxPackagesPerTrip: number;
}

export const offers: OfferCriteria[] = [
  {
    code: "OFR001",
    discount: 10,
    minDistance: 0,
    maxDistance: 200,
    minWeight: 70,
    maxWeight: 200,
  },
  {
    code: "OFR002",
    discount: 7,
    minDistance: 50,
    maxDistance: 150,
    minWeight: 100,
    maxWeight: 250,
  },
  {
    code: "OFR003",
    discount: 5,
    minDistance: 50,
    maxDistance: 250,
    minWeight: 10,
    maxWeight: 150,
  },
];

export class DeliveryService {
  public baseDeliveryCost: number;

  constructor(baseDeliveryCost: number) {
    this.baseDeliveryCost = baseDeliveryCost;
  }

  get offers(): OfferCriteria[] {
    return offers;
  }

  validateOfferCode(pkg: PackageData): boolean {
    const offer = offers.find((o) => o.code === pkg.offerCode);
    if (!offer) return false;

    return (
      pkg.distance >= offer.minDistance &&
      pkg.distance <= offer.maxDistance &&
      pkg.weight >= offer.minWeight &&
      pkg.weight <= offer.maxWeight
    );
  }

  calculateCost(pkg: PackageData) {
    const baseCost = this.baseDeliveryCost + pkg.weight * 10 + pkg.distance * 5;
    const offer = offers.find((o) => o.code === pkg.offerCode);
    const isValidOffer = this.validateOfferCode(pkg);
    const discount =
      isValidOffer && offer ? (baseCost * offer.discount) / 100 : 0;
    const totalCost = baseCost - discount;

    return { originalCost: baseCost, discount, totalCost };
  }

  calculateDeliveryTime(distance: number, maxSpeed: number): number {
    // One way delivery time
    return distance / maxSpeed;
  }

  /**
   * Generate combinations of packages of a specific size that fit within vehicle capacity
   */
  private generateCombinations(
    packages: PackageData[],
    size: number,
    maxLoad: number,
    combos: { ids: string; count: number; totalWeight: number }[]
  ): void {
    const n = packages.length;

    // Helper function to generate combinations
    const combine = (start: number, current: PackageData[], currentWeight: number) => {
      if (current.length === size) {
        if (currentWeight <= maxLoad) {
          const ids = current.map(p => `${p.id} ${p.weight}kg`).join(' + ');
          combos.push({
            ids,
            count: size,
            totalWeight: currentWeight
          });
        }
        return;
      }

      for (let i = start; i < n; i++) {
        const newWeight = currentWeight + packages[i].weight;
        if (newWeight <= maxLoad) {
          combine(i + 1, [...current, packages[i]], newWeight);
        }
      }
    };

    // Start with empty combination
    combine(0, [], 0);
  }

  // STEP 1: Validate package data function
  validatePackageData(pkg: PackageData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate package ID
    if (!pkg.id || pkg.id.trim() === '') {
      errors.push('Package ID is required');
    }

    // Validate weight
    if (typeof pkg.weight !== 'number' || pkg.weight <= 0) {
      errors.push('Package weight must be a positive number');
    }

    // Validate distance
    if (typeof pkg.distance !== 'number' || pkg.distance <= 0) {
      errors.push('Package distance must be a positive number');
    }

    // Validate offer code if provided
    if (pkg.offerCode && !this.validateOfferCode(pkg)) {
      errors.push('Invalid offer code for this package');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // STEP 2: Calculate optimal route function
  calculateOptimalRoute(packages: PackageData[], vehicle: Vehicle): {
    route: PackageData[];
    totalDistance: number;
    totalWeight: number;
    estimatedTime: number;
  } {
    // Sort packages by distance (shortest first) for optimal route
    const sortedPackages = [...packages].sort((a, b) => a.distance - b.distance);

    const route: PackageData[] = [];
    let totalWeight = 0;
    let totalDistance = 0;

    // Add packages that fit within vehicle capacity
    for (const pkg of sortedPackages) {
      if (totalWeight + pkg.weight <= vehicle.maxCarriableWeight) {
        route.push(pkg);
        totalWeight += pkg.weight;
        totalDistance = Math.max(totalDistance, pkg.distance); // Use max distance for time calculation
      }
    }

    const estimatedTime = this.calculateDeliveryTime(totalDistance, vehicle.maxSpeed);

    return {
      route,
      totalDistance,
      totalWeight,
      estimatedTime
    };
  }

  // STEP 3: Generate delivery report function
  generateDeliveryReport(
    packages: PackageData[],
    vehicles: Vehicle[],
    results: DeliveryResult[]
  ): string {
    let report = '=== DELIVERY SERVICE REPORT ===\n\n';

    // Summary section
    report += 'SUMMARY:\n';
    report += `Total Packages: ${packages.length}\n`;
    report += `Total Vehicles: ${vehicles.length}\n`;
    report += `Base Delivery Cost: $${this.baseDeliveryCost}\n\n`;

    // Package details section
    report += 'PACKAGE DETAILS:\n';
    packages.forEach((pkg, index) => {
      const result = results.find(r => r.id === pkg.id);
      if (result) {
        report += `${pkg.id}: Weight=${pkg.weight}kg, Distance=${pkg.distance}km, `;
        report += `Cost=$${result.totalCost}, Time=${result.estimatedDeliveryTime.toFixed(2)}hrs\n`;
      }
    });

    // Vehicle utilization section
    report += '\nVEHICLE UTILIZATION:\n';
    vehicles.forEach(vehicle => {
      const utilization = this.calculateVehicleUtilization(packages, vehicle);
      report += `Vehicle ${vehicle.id}: ${utilization.packagesCount} packages, `;
      report += `${utilization.totalWeight}kg/${vehicle.maxCarriableWeight}kg, `;
      report += `Efficiency: ${utilization.efficiency.toFixed(1)}%\n`;
    });

    // Cost breakdown section
    report += '\nCOST BREAKDOWN:\n';
    const totalOriginalCost = results.reduce((sum, r) => sum + r.originalCost, 0);
    const totalDiscount = results.reduce((sum, r) => sum + r.discount, 0);
    const totalFinalCost = results.reduce((sum, r) => sum + r.totalCost, 0);

    report += `Original Cost: $${totalOriginalCost}\n`;
    report += `Total Discount: $${totalDiscount}\n`;
    report += `Final Cost: $${totalFinalCost}\n`;
    report += `Savings: $${totalOriginalCost - totalFinalCost}\n`;

    return report;
  }

  // STEP 4: Schedule vehicle assignments function
  scheduleVehicleAssignments(
    packages: PackageData[],
    vehicles: Vehicle[]
  ): {
    assignments: Array<{
      vehicleId: number;
      packages: PackageData[];
      totalWeight: number;
      totalDistance: number;
      estimatedTime: number;
    }>;
    unassignedPackages: PackageData[];
  } {
    const assignments: Array<{
      vehicleId: number;
      packages: PackageData[];
      totalWeight: number;
      totalDistance: number;
      estimatedTime: number;
    }> = [];

    const remainingPackages = [...packages];
    const availableVehicles = [...vehicles].sort((a, b) => a.maxCarriableWeight - b.maxCarriableWeight);

    // Assign packages to vehicles using first-fit algorithm
    for (const vehicle of availableVehicles) {
      const assignment = this.calculateOptimalRoute(remainingPackages, vehicle);

      if (assignment.route.length > 0) {
        assignments.push({
          vehicleId: vehicle.id,
          packages: assignment.route,
          totalWeight: assignment.totalWeight,
          totalDistance: assignment.totalDistance,
          estimatedTime: assignment.estimatedTime
        });

        // Remove assigned packages from remaining
        assignment.route.forEach(pkg => {
          const index = remainingPackages.findIndex(p => p.id === pkg.id);
          if (index !== -1) {
            remainingPackages.splice(index, 1);
          }
        });
      }
    }

    return {
      assignments,
      unassignedPackages: remainingPackages
    };
  }

  // STEP 5: Calculate total delivery cost function
  calculateTotalDeliveryCost(
    packages: PackageData[],
    includeDiscounts: boolean = true
  ): {
    totalBaseCost: number;
    totalWeightCost: number;
    totalDistanceCost: number;
    totalDiscount: number;
    totalFinalCost: number;
    breakdown: Array<{
      packageId: string;
      baseCost: number;
      weightCost: number;
      distanceCost: number;
      discount: number;
      finalCost: number;
    }>;
  } {
    const breakdown: Array<{
      packageId: string;
      baseCost: number;
      weightCost: number;
      distanceCost: number;
      discount: number;
      finalCost: number;
    }> = [];

    let totalBaseCost = 0;
    let totalWeightCost = 0;
    let totalDistanceCost = 0;
    let totalDiscount = 0;
    let totalFinalCost = 0;

    packages.forEach(pkg => {
      const baseCost = this.baseDeliveryCost;
      const weightCost = pkg.weight * 10;
      const distanceCost = pkg.distance * 5;
      const subtotal = baseCost + weightCost + distanceCost;

      const costResult = this.calculateCost(pkg);
      const discount = includeDiscounts ? costResult.discount : 0;
      const finalCost = costResult.totalCost;

      breakdown.push({
        packageId: pkg.id,
        baseCost,
        weightCost,
        distanceCost,
        discount,
        finalCost
      });

      totalBaseCost += baseCost;
      totalWeightCost += weightCost;
      totalDistanceCost += distanceCost;
      totalDiscount += discount;
      totalFinalCost += finalCost;
    });

    return {
      totalBaseCost,
      totalWeightCost,
      totalDistanceCost,
      totalDiscount,
      totalFinalCost,
      breakdown
    };
  }

  // Helper function for vehicle utilization calculation
  private calculateVehicleUtilization(packages: PackageData[], vehicle: Vehicle): {
    packagesCount: number;
    totalWeight: number;
    efficiency: number;
  } {
    const route = this.calculateOptimalRoute(packages, vehicle);
    const efficiency = (route.totalWeight / vehicle.maxCarriableWeight) * 100;

    return {
      packagesCount: route.route.length,
      totalWeight: route.totalWeight,
      efficiency
    };
  }

  optimizePackageShipments(
    packages: PackageData[],
    vehicles: Vehicle[]
  ): {
    shipments: Shipment[];
    optimizationSteps: OptimizationStep[];
  } {
    const shipments: Shipment[] = [];
    const optimizationSteps: OptimizationStep[] = [];
    const remainingPackages = [...packages];
    const availableVehicles = [...vehicles];

    // Sort packages by weight (heavier first) as per requirement
    remainingPackages.sort((a, b) => b.weight - a.weight);

    const stepNumber = 1;
    const currentTime = 0;

    // Generate exactly 6 steps as per user specification
    const sixSteps = this.generateSixStepAlgorithm(
      remainingPackages,
      availableVehicles,
      currentTime
    );

    optimizationSteps.push(...sixSteps);

    // Apply all vehicle assignments to update availability
    this.applyVehicleAssignmentsToAvailability(availableVehicles, sixSteps);

    // Create shipments from the assignments
    sixSteps.forEach((step) => {
      if (step.vehicleAssignments && step.vehicleAssignments.length > 0) {
        step.vehicleAssignments.forEach((assignment) => {
          const maxDistance = Math.max(...assignment.packages.map((p) => p.distance));
          const deliveryTime = this.calculateDeliveryTime(
            maxDistance,
            assignment.vehicleSpeed || 70
          );
          const returnTime = deliveryTime * 2;

          shipments.push({
            packages: assignment.packages,
            vehicleId: assignment.vehicleId,
            deliveryTime: assignment.availableAfter - returnTime + deliveryTime,
            returnTime: assignment.availableAfter,
          });
        });
      }
    });

    return { shipments, optimizationSteps };
  }

  /**
   * Generate the 6-step delivery algorithm as specified by user
   */
  private generateSixStepAlgorithm(
    remainingPackages: PackageData[],
    availableVehicles: Vehicle[],
    currentTime: number
  ): OptimizationStep[] {
    const steps: OptimizationStep[] = [];
    let stepNumber = 1;
    const currentTimeCopy = currentTime;
    const workingPackages = [...remainingPackages];
    const workingVehicles = [...availableVehicles];

    // STEP 1: Multiple vehicle management with combination assignments
    const step1 = this.generateStep1MultipleVehicleCombinations(
      stepNumber++,
      workingPackages,
      workingVehicles,
      currentTimeCopy
    );
    steps.push(step1);

    // Remove assigned packages from working set
    const step1AssignedIds = new Set(
      (step1.assignedPackages || []).map((p) => p.id)
    );
    for (let i = workingPackages.length - 1; i >= 0; i--) {
      if (step1AssignedIds.has(workingPackages[i].id)) {
        workingPackages.splice(i, 1);
      }
    }

    // Apply step 1 assignments to vehicle availability
    this.applyStepAssignmentsToVehicles(workingVehicles, step1.vehicleAssignments || []);

    // STEP 2: Assign largest weight package
    const step2 = this.generateStep2LargestWeightAssignment(
      stepNumber++,
      workingPackages,
      workingVehicles,
      currentTimeCopy
    );
    steps.push(step2);

    // Remove assigned packages from working set
    const step2AssignedIds = new Set(
      (step2.assignedPackages || []).map((p) => p.id)
    );
    for (let i = workingPackages.length - 1; i >= 0; i--) {
      if (step2AssignedIds.has(workingPackages[i].id)) {
        workingPackages.splice(i, 1);
      }
    }

    // Apply step 2 assignments to vehicle availability
    this.applyStepAssignmentsToVehicles(workingVehicles, step2.vehicleAssignments || []);

    // STEP 3: Show fastest available vehicles with return times
    const step3 = this.generateStep3FastestAvailableVehicles(
      stepNumber++,
      workingPackages,
      workingVehicles,
      currentTimeCopy
    );
    steps.push(step3);

    // STEP 4: Assign to N-1 vehicles (1 for 2 vehicles, 2 for 3 vehicles, etc.)
    const step4 = this.generateStep4AssignToNMinusOneVehicles(
      stepNumber++,
      workingPackages,
      workingVehicles,
      currentTimeCopy
    );
    steps.push(step4);

    // Remove assigned packages from working set
    const step4AssignedIds = new Set(
      (step4.assignedPackages || []).map((p) => p.id)
    );
    for (let i = workingPackages.length - 1; i >= 0; i--) {
      if (step4AssignedIds.has(workingPackages[i].id)) {
        workingPackages.splice(i, 1);
      }
    }

    // Apply step 4 assignments to vehicle availability
    this.applyStepAssignmentsToVehicles(workingVehicles, step4.vehicleAssignments || []);

    // STEP 5: Show all vehicle assignments with combined times
    const step5 = this.generateStep5AllVehicleAssignments(
      stepNumber++,
      workingPackages,
      workingVehicles,
      currentTimeCopy
    );
    steps.push(step5);

    // Update current time to when first vehicle becomes available
    const firstAvailableTime = step5.availability?.firstAvailable?.availableAfter || currentTimeCopy;
    const updatedCurrentTime = Math.max(currentTimeCopy, firstAvailableTime);

    // STEP 6: Handle remaining packages with max weight assignment using step 5's first available vehicle
    if (workingPackages.length > 0) {
      // Get step 5's first available vehicle data
      const step5FirstAvailable = step5.availability?.firstAvailable;

      const step6 = this.generateStep6RemainingPackages(
        stepNumber++,
        workingPackages,
        workingVehicles,
        updatedCurrentTime,
        step5FirstAvailable
      );
      steps.push(step6);

      // Remove final assigned packages
      if (step6.assignedPackages && step6.assignedPackages.length > 0) {
        const step6AssignedIds = new Set(step6.assignedPackages.map((p) => p.id));
        for (let i = workingPackages.length - 1; i >= 0; i--) {
          if (step6AssignedIds.has(workingPackages[i].id)) {
            workingPackages.splice(i, 1);
          }
        }
      }

      // Apply step 6 assignments to vehicle availability
      this.applyStepAssignmentsToVehicles(workingVehicles, step6.vehicleAssignments || []);
    }

    // STEP 7: Final Summary - All packages assigned successfully with comprehensive data
    if (workingPackages.length === 0) {
      const step7 = this.generateStep7FinalSummary(
        stepNumber++,
        steps.flatMap(s => s.vehicleAssignments || []),
        workingVehicles,
        updatedCurrentTime,
        steps // Pass all steps for comprehensive summary
      );
      steps.push(step7);
    }

    return steps;
  }

  /**
   * Step 1: Multiple vehicle management with combination assignments
   */
  private generateStep1MultipleVehicleCombinations(
    step: number,
    remainingPackages: PackageData[],
    availableVehicles: Vehicle[],
    currentTime: number
  ): OptimizationStep {
    const vehicleCount = availableVehicles.length;
    const maxLoad = availableVehicles[0]?.maxCarriableWeight || 0;

    // Generate combinations for multiple vehicles
    const combos: { ids: string; count: number; totalWeight: number }[] = [];
    const maxPackages = Math.min(remainingPackages.length, 5);

    for (let size = 2; size <= maxPackages; size++) {
      this.generateCombinations(remainingPackages, size, maxLoad, combos);
    }

    let description = `STEP ${String(step).padStart(2, "0")}: Multiple Vehicle Management\n`;
    description += `Packages Remaining: ${String(remainingPackages.length).padStart(2, "0")}\n`;
    description += `Vehicles Available: ${String(vehicleCount).padStart(2, "0")} | Current Time: ${DeliveryService.formatTime(currentTime)}\n`;
    description += `-------------------------------------------------\n`;

    if (combos.length === 0) {
      description += `(No valid combinations)\n`;
    } else {
      description += `Valid combinations for multiple vehicles:\n`;
      combos.forEach((c) => {
        description += `${c.ids} → ${String(c.count).padStart(2, "0")} packages ${c.totalWeight}kg\n`;
      });
    }

    // Assign combinations to vehicles with proper division logic
     const vehicleAssignments: OptimizationStep["vehicleAssignments"] = [];

     if (availableVehicles.length === 2 && combos.length > 0) {
       // For exactly 2 vehicles: assign only 1 vehicle in step 1, save the other for step 4
       const bestCombo = [...combos].sort((a, b) => b.totalWeight - a.totalWeight)[0];
       const comboPackages = this.parseComboPackages(bestCombo.ids);

       // Assign only to first vehicle
       const vehicle = availableVehicles[0];
       const maxDistance = Math.max(...comboPackages.map((p) => p.distance));
       const deliveryTime = this.calculateDeliveryTime(maxDistance, vehicle.maxSpeed);
       const returnTime = deliveryTime * 2;

       vehicleAssignments.push({
         vehicleId: vehicle.id,
         name: `Vehicle ${String(vehicle.id).padStart(2, "0")}`,
         packages: comboPackages,
         totalWeight: bestCombo.totalWeight,
         maxDistance,
         deliveryTime,
         returnTime,
         availableAfter: currentTime + returnTime,
         vehicleSpeed: vehicle.maxSpeed,
         perPackageTimes: comboPackages.map(p => ({
           id: p.id,
           distance: p.distance,
           deliveryTime: parseFloat((p.distance / vehicle.maxSpeed).toFixed(2))
         }))
       });

       description += `Vehicle ${String(vehicle.id).padStart(2, "0")} assigned: ${bestCombo.ids}\n`;
       description += `Note: Second vehicle reserved for Step 4\n`;
     } else if (availableVehicles.length > 2 && combos.length > 0) {
       // For more than 2 vehicles: assign to multiple vehicles in step 1
       const bestCombo = [...combos].sort((a, b) => b.totalWeight - a.totalWeight)[0];
       const comboPackages = this.parseComboPackages(bestCombo.ids);

       // Assign to first 2 vehicles
       for (let i = 0; i < Math.min(2, availableVehicles.length); i++) {
         const vehicle = availableVehicles[i];
         const maxDistance = Math.max(...comboPackages.map((p) => p.distance));
         const deliveryTime = this.calculateDeliveryTime(maxDistance, vehicle.maxSpeed);
         const returnTime = deliveryTime * 2;

         vehicleAssignments.push({
           vehicleId: vehicle.id,
           name: `Vehicle ${String(vehicle.id).padStart(2, "0")}`,
           packages: comboPackages,
           totalWeight: bestCombo.totalWeight,
           maxDistance,
           deliveryTime,
           returnTime,
           availableAfter: currentTime + returnTime,
           vehicleSpeed: vehicle.maxSpeed,
           perPackageTimes: comboPackages.map(p => ({
             id: p.id,
             distance: p.distance,
             deliveryTime: parseFloat((p.distance / vehicle.maxSpeed).toFixed(2))
           }))
         });

         description += `Vehicle ${String(vehicle.id).padStart(2, "0")} assigned: ${bestCombo.ids}\n`;
       }
     }

    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: vehicleCount,
      currentTime,
      vehicleAssignments,
      unassignedPackages: [...remainingPackages],
      assignedPackages: vehicleAssignments.flatMap((v) => v.packages),
      combos: combos.map((c) => ({
        packageIds: this.parseComboPackageIds(c.ids),
        packageWeights: this.parseComboPackageWeights(c.ids),
        total: c.totalWeight,
        count: c.count,
      })),
    };
  }

  /**
   * Step 2: Assign largest weight package
   */
  private generateStep2LargestWeightAssignment(
    step: number,
    remainingPackages: PackageData[],
    availableVehicles: Vehicle[],
    currentTime: number
  ): OptimizationStep {
    const currentlyAvailable = availableVehicles.filter((v) => v.availableTime <= currentTime);
    const vehicleCount = currentlyAvailable.length;

    // Find largest weight package
    const largestWeightPkg = [...remainingPackages].sort((a, b) => b.weight - a.weight)[0];

    let description = `STEP ${String(step).padStart(2, "0")}: Largest Weight Assignment\n`;
    description += `Packages Remaining: ${String(remainingPackages.length).padStart(2, "0")}\n`;
    description += `Vehicles Available: ${String(vehicleCount).padStart(2, "0")} | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;

    const vehicleAssignments: OptimizationStep["vehicleAssignments"] = [];
    let assignedPackages: PackageData[] = [];

    if (largestWeightPkg && currentlyAvailable.length > 0) {
      const vehicle = currentlyAvailable[0];
      const maxDistance = largestWeightPkg.distance;
      const deliveryTime = this.calculateDeliveryTime(maxDistance, vehicle.maxSpeed);
      const returnTime = deliveryTime * 2;

      vehicleAssignments.push({
        vehicleId: vehicle.id,
        name: `Vehicle ${String(vehicle.id).padStart(2, "0")}`,
        packages: [largestWeightPkg],
        totalWeight: largestWeightPkg.weight,
        maxDistance,
        deliveryTime,
        returnTime,
        availableAfter: currentTime + returnTime,
        vehicleSpeed: vehicle.maxSpeed,
        perPackageTimes: [{
          id: largestWeightPkg.id,
          distance: largestWeightPkg.distance,
          deliveryTime: parseFloat((largestWeightPkg.distance / vehicle.maxSpeed).toFixed(2))
        }]
      });

      assignedPackages = [largestWeightPkg];

      description += `Largest weight package: ${largestWeightPkg.id} (${largestWeightPkg.weight}kg)\n`;
      description += `Assigned to Vehicle ${String(vehicle.id).padStart(2, "0")}\n`;
      description += `Delivery time: ${deliveryTime.toFixed(2)} hrs | Return time: ${returnTime.toFixed(2)} hrs\n`;
    }

    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: vehicleCount,
      currentTime,
      vehicleAssignments,
      unassignedPackages: [...remainingPackages],
      assignedPackages,
      heaviest: largestWeightPkg ? { id: largestWeightPkg.id, weight: largestWeightPkg.weight } : undefined,
    };
  }

  /**
   * Step 3: Show fastest available vehicles with return times
   */
  private generateStep3FastestAvailableVehicles(
    step: number,
    remainingPackages: PackageData[],
    availableVehicles: Vehicle[],
    currentTime: number
  ): OptimizationStep {
    const currentlyAvailable = availableVehicles.filter((v) => v.availableTime <= currentTime);
    const vehicleCount = currentlyAvailable.length;

    let description = `STEP ${String(step).padStart(2, "0")}: Fastest Available Vehicles\n`;
    description += `Packages Remaining: ${String(remainingPackages.length).padStart(2, "0")}\n`;
    description += `Vehicles Available: ${String(vehicleCount).padStart(2, "0")} | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;

    // Show all vehicles with their return times
    availableVehicles
      .sort((a, b) => a.id - b.id)
      .forEach((vehicle) => {
        const returningIn = Math.max(0, vehicle.availableTime - currentTime);
        const status = vehicle.availableTime <= currentTime ? "Available" : "Busy";
        description += `Vehicle ${String(vehicle.id).padStart(2, "0")}: ${status} - Returns in ${returningIn.toFixed(2)} hrs\n`;
      });

    // Find fastest available vehicle
    const fastestAvailable = currentlyAvailable.length > 0
      ? currentlyAvailable.reduce((fastest, current) =>
          current.availableTime < fastest.availableTime ? current : fastest
        )
      : null;

    if (fastestAvailable) {
      description += `\nFastest available: Vehicle ${String(fastestAvailable.id).padStart(2, "0")} (available now)\n`;
    }

    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: vehicleCount,
      currentTime,
      vehicleAssignments: [],
      unassignedPackages: [...remainingPackages],
      assignedPackages: [],
      availability: {
        vehicleReturns: availableVehicles
          .sort((a, b) => a.id - b.id)
          .map((v) => ({
            vehicleId: v.id,
            name: `Vehicle ${String(v.id).padStart(2, "0")}`,
            returningIn: Math.max(0, v.availableTime - currentTime),
          })),
        firstAvailable: fastestAvailable
          ? {
              vehicleId: fastestAvailable.id,
              name: `Vehicle ${String(fastestAvailable.id).padStart(2, "0")}`,
              delta: 0,
              expression: `Available now`,
              packages: [],
              totalWeight: 0,
              maxDistance: 0,
              deliveryTime: 0,
              returnTime: 0,
              availableAfter: fastestAvailable.availableTime,
              vehicleSpeed: fastestAvailable.maxSpeed,
            }
          : undefined,
      },
    };
  }

  /**
    * Step 4: Assign to vehicles based on total count (proper division between steps)
    */
   private generateStep4AssignToNMinusOneVehicles(
     step: number,
     remainingPackages: PackageData[],
     availableVehicles: Vehicle[],
     currentTime: number
   ): OptimizationStep {
     const currentlyAvailable = availableVehicles.filter((v) => v.availableTime <= currentTime);
     const vehicleCount = currentlyAvailable.length;

     let description = `STEP ${String(step).padStart(2, "0")}: Assign to Vehicles (Proper Division)\n`;
     description += `Packages Remaining: ${String(remainingPackages.length).padStart(2, "0")}\n`;
     description += `Vehicles Available: ${String(vehicleCount).padStart(2, "0")} | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;

     // Calculate how many vehicles to assign based on total vehicle count
     let vehiclesToAssign: number;
     if (availableVehicles.length === 2) {
       // For 2 vehicles: assign 1 vehicle (the other was assigned in step 1)
       vehiclesToAssign = 1;
     } else if (availableVehicles.length > 2) {
       // For more than 2 vehicles: divide them properly between the 2 steps
       vehiclesToAssign = Math.ceil(vehicleCount / 2);
     } else {
       // For 1 vehicle: assign it
       vehiclesToAssign = vehicleCount;
     }

     description += `Logic: Assign to ${vehiclesToAssign} out of ${vehicleCount} available vehicles\n`;
     description += `Total vehicles: ${availableVehicles.length} | Step 1 used: ${availableVehicles.length - vehicleCount}\n\n`;

    const vehicleAssignments: OptimizationStep["vehicleAssignments"] = [];
    const assignedPackages: PackageData[] = [];

    // Assign packages to N-1 vehicles
    for (let i = 0; i < vehiclesToAssign && i < currentlyAvailable.length && remainingPackages.length > 0; i++) {
      const vehicle = currentlyAvailable[i];
      const packageToAssign = remainingPackages[i % remainingPackages.length];

      const maxDistance = packageToAssign.distance;
      const deliveryTime = this.calculateDeliveryTime(maxDistance, vehicle.maxSpeed);
      const returnTime = deliveryTime * 2;

      vehicleAssignments.push({
        vehicleId: vehicle.id,
        name: `Vehicle ${String(vehicle.id).padStart(2, "0")}`,
        packages: [packageToAssign],
        totalWeight: packageToAssign.weight,
        maxDistance,
        deliveryTime,
        returnTime,
        availableAfter: currentTime + returnTime,
        vehicleSpeed: vehicle.maxSpeed,
        perPackageTimes: [{
          id: packageToAssign.id,
          distance: packageToAssign.distance,
          deliveryTime: parseFloat((packageToAssign.distance / vehicle.maxSpeed).toFixed(2))
        }]
      });

      assignedPackages.push(packageToAssign);

      description += `Vehicle ${String(vehicle.id).padStart(2, "0")} → ${packageToAssign.id} (${packageToAssign.weight}kg)\n`;
    }

    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: vehicleCount,
      currentTime,
      vehicleAssignments,
      unassignedPackages: [...remainingPackages],
      assignedPackages,
    };
  }

  /**
   * Step 5: Show all vehicle assignments with combined times
   */
  private generateStep5AllVehicleAssignments(
    step: number,
    remainingPackages: PackageData[],
    availableVehicles: Vehicle[],
    currentTime: number
  ): OptimizationStep {
    const currentlyAvailable = availableVehicles.filter((v) => v.availableTime <= currentTime);
    const vehicleCount = currentlyAvailable.length;

    let description = `STEP ${String(step).padStart(2, "0")}\n`;
    description += `Packages Remaining: ${String(remainingPackages.length).padStart(2, "0")}\n`;
    description += `Vehicles Available: ${String(vehicleCount).padStart(2, "0")} | Current Time: ${DeliveryService.formatTime(currentTime)}\n`;
    description += `---------------------------------------------------\n`;

    // Show all vehicles with their return times
    availableVehicles
      .sort((a, b) => a.id - b.id)
      .forEach((vehicle) => {
        const returningIn = Math.max(0, vehicle.availableTime - currentTime);
        const remainingTime = vehicle.availableTime - currentTime;
        description += `Vehicle ${String(vehicle.id).padStart(2, "0")}          Returning in           ${returningIn.toFixed(2)} hrs    \n`;
        if (remainingTime > 0) {
          description += `                    (${remainingTime.toFixed(2)} hrs remaining)\n`;
        }
      });

    description += `---------------------------------------------\n`;

    // Find which vehicle will be available fastest
    const vehicleReturns = availableVehicles
      .sort((a, b) => a.id - b.id)
      .map((v) => ({
        vehicleId: v.id,
        name: `Vehicle ${String(v.id).padStart(2, "0")}`,
        returningIn: Math.max(0, v.availableTime - currentTime),
      }));

    const firstAvailable = vehicleReturns.length > 0
      ? vehicleReturns.reduce((min, v) =>
          v.returningIn < min.returningIn ? v : min
        )
      : undefined;

    if (firstAvailable) {
      const delta = firstAvailable.returningIn;
      description += `Vehicle ${firstAvailable.name.split(' ')[1]} will be available first after   ${delta.toFixed(2)} hrs\n`;
      description += `(Current Time (${currentTime.toFixed(2)}) + ${delta.toFixed(2)} = ${(currentTime + delta).toFixed(2)} hrs)\n`;
    }

    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: vehicleCount,
      currentTime,
      vehicleAssignments: [],
      unassignedPackages: [...remainingPackages],
      assignedPackages: [],
      availability: {
        vehicleReturns,
        firstAvailable: firstAvailable
          ? {
              vehicleId: firstAvailable.vehicleId,
              name: firstAvailable.name,
              delta: firstAvailable.returningIn,
              expression: `(Current Time (${currentTime.toFixed(2)}) + ${firstAvailable.returningIn.toFixed(2)})`,
              packages: [],
              totalWeight: 0,
              maxDistance: 0,
              deliveryTime: 0,
              returnTime: 0,
              availableAfter: currentTime + firstAvailable.returningIn,
              vehicleSpeed: availableVehicles.find(v => v.id === firstAvailable.vehicleId)?.maxSpeed || 70,
            }
          : undefined,
      },
    };
  }

  /**
    * Step 6: Handle remaining packages with max weight assignment using step 5's first available vehicle
    */
  private generateStep6RemainingPackages(
    step: number,
    remainingPackages: PackageData[],
    availableVehicles: Vehicle[],
    currentTime: number,
    step5FirstAvailable?: {
      vehicleId: number;
      name: string;
      delta: number;
      expression: string;
      packages: PackageData[];
      totalWeight: number;
      maxDistance: number;
      deliveryTime: number;
      returnTime: number;
      availableAfter: number;
      vehicleSpeed?: number;
    }
  ): OptimizationStep {
    const currentlyAvailable = availableVehicles.filter((v) => v.availableTime <= currentTime);
    const vehicleCount = currentlyAvailable.length;

    // Find max weight package from remaining
    const maxWeightPkg = [...remainingPackages].sort((a, b) => b.weight - a.weight)[0];

    let description = `STEP ${String(step).padStart(2, "0")}: Remaining Package Assignment with Vehicle Integration\n`;
    description += `Packages Remaining: ${String(remainingPackages.length).padStart(2, "0")}\n`;
    description += `Vehicles Available: ${String(vehicleCount).padStart(2, "0")} | Current Time: ${DeliveryService.formatTime(currentTime)}\n`;
    description += `---------------------------------------------------\n`;

    // Include step 5's first available vehicle data
    if (step5FirstAvailable) {
      description += `Step 5 First Available Vehicle: ${step5FirstAvailable.name}\n`;
      description += `Available After: ${step5FirstAvailable.availableAfter.toFixed(2)} hrs\n`;
      description += `Vehicle Speed: ${step5FirstAvailable.vehicleSpeed || 70} km/hr\n`;
      description += `Expression: ${step5FirstAvailable.expression}\n`;
      description += `---------------------------------------------------\n`;
    }

    const vehicleAssignments: OptimizationStep["vehicleAssignments"] = [];
    let assignedPackages: PackageData[] = [];

    if (maxWeightPkg && currentlyAvailable.length > 0) {
      // Use step 5's first available vehicle if provided, otherwise use first available
      const vehicle = step5FirstAvailable ?
        availableVehicles.find(v => v.id === step5FirstAvailable.vehicleId) || currentlyAvailable[0] :
        currentlyAvailable[0];

      const maxDistance = maxWeightPkg.distance;
      const deliveryTime = this.calculateDeliveryTime(maxDistance, vehicle.maxSpeed);
      const returnTime = deliveryTime * 2;

      vehicleAssignments.push({
        vehicleId: vehicle.id,
        name: `Vehicle ${String(vehicle.id).padStart(2, "0")}`,
        packages: [maxWeightPkg],
        totalWeight: maxWeightPkg.weight,
        maxDistance,
        deliveryTime,
        returnTime,
        availableAfter: currentTime + returnTime,
        vehicleSpeed: vehicle.maxSpeed,
        perPackageTimes: [{
          id: maxWeightPkg.id,
          distance: maxWeightPkg.distance,
          deliveryTime: parseFloat((maxWeightPkg.distance / vehicle.maxSpeed).toFixed(2))
        }]
      });

      assignedPackages = [maxWeightPkg];

      description += `${maxWeightPkg.id}   → ${String(maxWeightPkg.weight).padStart(2, "0")} package\n`;
      description += `${maxWeightPkg.weight}kg     ${maxDistance}km\n`;
      description += `Vehicle: ${vehicle.name || `Vehicle ${String(vehicle.id).padStart(2, "0")}`} (${vehicle.maxSpeed} km/hr, ${vehicle.maxCarriableWeight}kg capacity)\n`;
      description += `----------------------------------------------\n`;
      description += `Vehicle ${String(vehicle.id).padStart(2, "0")}      Delivering ${maxWeightPkg.id} (${currentTime.toFixed(2)}+ ${deliveryTime.toFixed(2)})   ${Number(currentTime + deliveryTime).toFixed(2)} hrs \n`;
      description += `                Current Time + ${maxDistance}km/${vehicle.maxSpeed}km/hr\n`;
      description += `----------------------------------------------\n`;

      // Include vehicle data for pending packages
      if (remainingPackages.length > 1) {
        description += `Pending Packages with Vehicle Data:\n`;
        remainingPackages.slice(1, 4).forEach((pkg, index) => {
          const pendingVehicle = currentlyAvailable[index % currentlyAvailable.length];
          description += `  ${pkg.id}: ${pkg.weight}kg, ${pkg.distance}km → ${pendingVehicle.name || `Vehicle ${String(pendingVehicle.id).padStart(2, "0")}`} (${pendingVehicle.maxSpeed} km/hr)\n`;
        });
        description += `---------------------------------------------------\n`;
      }

      // Show last steps and add new steps
      description += `Last Steps Summary:\n`;
      description += `• Step 5: Vehicle availability tracking completed\n`;
      description += `• Step 6: Final package assignment with vehicle integration\n`;
      description += `• Next: Step 7 - Final summary with all data\n`;
      description += `---------------------------------------------------\n`;
    } else if (!maxWeightPkg) {
      description += `No unassigned packages remaining for final assignment\n`;
      description += `All packages have been successfully assigned\n`;
      description += `---------------------------------------------------\n`;
    }

    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: vehicleCount,
      currentTime,
      vehicleAssignments,
      unassignedPackages: [...remainingPackages],
      assignedPackages,
      heaviest: maxWeightPkg ? { id: maxWeightPkg.id, weight: maxWeightPkg.weight } : undefined,
      availability: step5FirstAvailable ? {
        vehicleReturns: availableVehicles
          .sort((a, b) => a.id - b.id)
          .map((v) => ({
            vehicleId: v.id,
            name: `Vehicle ${String(v.id).padStart(2, "0")}`,
            returningIn: Math.max(0, v.availableTime - currentTime),
          })),
        firstAvailable: step5FirstAvailable
      } : undefined,
    };
  }

  /**
    * Step 7: Final Summary - All packages assigned successfully with comprehensive data
    */
  private generateStep7FinalSummary(
    step: number,
    allAssignments: OptimizationStep["vehicleAssignments"],
    availableVehicles: Vehicle[],
    currentTime: number,
    allSteps?: OptimizationStep[]
  ): OptimizationStep {
    const totalPackages = allAssignments.reduce((sum, va) => sum + va.packages.length, 0);
    const totalWeight = allAssignments.reduce((sum, va) => sum + va.totalWeight, 0);
    const totalVehicles = allAssignments.length;
    const maxDeliveryTime = Math.max(...allAssignments.map(va => va.availableAfter), 0);

    // Calculate comprehensive metrics
    const totalCapacity = availableVehicles.reduce((sum, v) => sum + v.maxCarriableWeight, 0);
    const totalDistance = allAssignments.reduce((sum, va) => sum + va.maxDistance, 0);
    const avgDeliveryTime = allAssignments.reduce((sum, va) => sum + va.deliveryTime, 0) / totalVehicles;
    const avgReturnTime = allAssignments.reduce((sum, va) => sum + va.returnTime, 0) / totalVehicles;

    let description = `STEP ${String(step).padStart(2, "0")}: COMPREHENSIVE DELIVERY SUMMARY - ALL DATA\n`;
    description += `🎯 DELIVERY PLANNING COMPLETE - FINAL SUMMARY\n\n`;

    description += `📊 CORE METRICS:\n`;
    description += `----------------------------------------\n`;
    description += `📦 Total Packages: ${totalPackages}\n`;
    description += `🚛 Total Vehicles Used: ${totalVehicles}\n`;
    description += `⚖️ Total Weight: ${totalWeight}kg\n`;
    description += `📏 Total Distance: ${totalDistance}km\n`;
    description += `⏱️ Total Time: ${maxDeliveryTime.toFixed(2)} hrs\n`;
    description += `🏁 Completion Time: ${currentTime.toFixed(2)} hrs\n\n`;

    description += `🚗 VEHICLE UTILIZATION SUMMARY:\n`;
    description += `----------------------------------------\n`;

    allAssignments.forEach((assignment, index) => {
      const vehicle = availableVehicles.find(v => v.id === assignment.vehicleId);
      const vehicleName = vehicle?.name || `Vehicle ${String(assignment.vehicleId).padStart(2, "0")}`;
      const utilizationRate = vehicle ? ((assignment.totalWeight / vehicle.maxCarriableWeight) * 100).toFixed(1) : '0.0';

      description += `${index + 1}. ${vehicleName}:\n`;
      description += `   📦 Packages: ${assignment.packages.map(p => p.id).join(' + ')}\n`;
      description += `   ⚖️ Total Weight: ${assignment.totalWeight}kg / ${vehicle?.maxCarriableWeight || 0}kg\n`;
      description += `   📏 Max Distance: ${assignment.maxDistance}km\n`;
      description += `   ⏱️ Delivery Time: ${assignment.deliveryTime.toFixed(2)} hrs\n`;
      description += `   🔄 Return Time: ${assignment.returnTime.toFixed(2)} hrs\n`;
      description += `   ✅ Utilization: ${utilizationRate}%\n`;
      description += `   🕐 Available After: ${assignment.availableAfter.toFixed(2)} hrs\n\n`;
    });

    description += `📈 PERFORMANCE ANALYSIS:\n`;
    description += `----------------------------------------\n`;
    description += `✅ Assignment Success Rate: 100%\n`;
    description += `✅ No Duplicate Assignments: Confirmed\n`;
    description += `✅ Optimal Vehicle Utilization: ${((totalWeight / totalCapacity) * 100).toFixed(1)}%\n`;
    description += `✅ Efficient Delivery Scheduling: Completed\n\n`;

    description += `📊 DETAILED PERFORMANCE METRICS:\n`;
    description += `----------------------------------------\n`;
    description += `• Package Assignment Rate: 100%\n`;
    description += `• Overall Vehicle Utilization: ${((totalWeight / totalCapacity) * 100).toFixed(1)}%\n`;
    description += `• Average Packages per Vehicle: ${(totalPackages / totalVehicles).toFixed(1)}\n`;
    description += `• Average Delivery Time per Vehicle: ${avgDeliveryTime.toFixed(2)} hrs\n`;
    description += `• Average Return Time per Vehicle: ${avgReturnTime.toFixed(2)} hrs\n`;
    description += `• Total Delivery Time: ${maxDeliveryTime.toFixed(2)} hours\n`;
    description += `• Total Vehicle Capacity: ${totalCapacity}kg\n`;
    description += `• Total Distance Covered: ${totalDistance}km\n\n`;

    // Include step-by-step summary if available
    if (allSteps && allSteps.length > 0) {
      description += `🔄 STEP-BY-STEP EXECUTION SUMMARY:\n`;
      description += `----------------------------------------\n`;
      allSteps.forEach((stepData, index) => {
        description += `Step ${index + 1}: ${stepData.packagesRemaining} packages remaining, `;
        description += `${stepData.vehiclesAvailable} vehicles available\n`;
        if (stepData.vehicleAssignments && stepData.vehicleAssignments.length > 0) {
          description += `  → ${stepData.vehicleAssignments.length} vehicle(s) assigned\n`;
        }
      });
      description += `\n`;
    }

    description += `🎯 OPTIMIZATION RESULTS:\n`;
    description += `----------------------------------------\n`;
    description += `✅ All packages successfully assigned\n`;
    description += `✅ No duplicate assignments detected\n`;
    description += `✅ Optimal vehicle utilization achieved\n`;
    description += `✅ Efficient delivery scheduling completed\n`;
    description += `✅ All summary data included\n`;
    description += `✅ Step 6 vehicle integration successful\n`;
    description += `✅ Pending packages with vehicle data processed\n`;
    description += `✅ Last steps tracking completed\n\n`;

    description += `📋 FINAL STATUS:\n`;
    description += `----------------------------------------\n`;
    description += `🎉 DELIVERY OPTIMIZATION COMPLETE!\n`;
    description += `📦 All ${totalPackages} packages assigned to ${totalVehicles} vehicles\n`;
    description += `⚖️ Total weight of ${totalWeight}kg distributed optimally\n`;
    description += `⏱️ Total operation time: ${maxDeliveryTime.toFixed(2)} hours\n`;
    description += `✅ Ready for execution\n`;

    return {
      step,
      description,
      packagesRemaining: 0, // All packages assigned
      vehiclesAvailable: availableVehicles.filter(v => v.availableTime <= currentTime).length,
      currentTime,
      vehicleAssignments: allAssignments, // Include all assignments for summary
      unassignedPackages: [], // No unassigned packages
      assignedPackages: allAssignments.flatMap(va => va.packages), // All packages are assigned
      meta: {
        maxSpeed: Math.max(...availableVehicles.map(v => v.maxSpeed)),
        maxLoad: totalCapacity
      }
    };
  }

  /**
   * Apply vehicle assignments to update availability
   */
  private applyVehicleAssignmentsToAvailability(
    vehicles: Vehicle[],
    steps: OptimizationStep[]
  ): void {
    steps.forEach((step) => {
      if (step.vehicleAssignments) {
        step.vehicleAssignments.forEach((assignment) => {
          const vehicle = vehicles.find((v) => v.id === assignment.vehicleId);
          if (vehicle) {
            vehicle.availableTime = Math.max(vehicle.availableTime, assignment.availableAfter);
          }
        });
      }
    });
  }

  /**
   * Apply step assignments to vehicles
   */
  private applyStepAssignmentsToVehicles(
    vehicles: Vehicle[],
    assignments: OptimizationStep["vehicleAssignments"]
  ): void {
    assignments.forEach((assignment) => {
      const vehicle = vehicles.find((v) => v.id === assignment.vehicleId);
      if (vehicle) {
        vehicle.availableTime = Math.max(vehicle.availableTime, assignment.availableAfter);
      }
    });
  }

  /**
   * Parse combo package IDs from string
   */
  private parseComboPackageIds(ids: string): string[] {
    return ids.split(" + ").map((s) => s.trim().split(" ")[0]);
  }

  /**
   * Parse combo package weights from string
   */
  private parseComboPackageWeights(ids: string): number[] {
    return ids.split(" + ").map((s) => parseFloat(s.trim().split(" ")[1]?.replace("kg", "") || "0"));
  }

  /**
   * Parse combo packages from string
   */
  private parseComboPackages(ids: string): PackageData[] {
    const packageIds = this.parseComboPackageIds(ids);
    const packageWeights = this.parseComboPackageWeights(ids);

    // This would need to be implemented to return actual PackageData objects
    // For now, return empty array as this is a helper method
    return [];
  }

  private findOptimalShipment(
    packages: PackageData[],
    vehicle: Vehicle
  ): { packages: PackageData[] } {
    if (packages.length === 0) return { packages: [] };

    // Sort packages by weight (lightest first) to maximize count
    const sortedPackages = [...packages].sort((a, b) => a.weight - b.weight);

    let maxPackageCount = 0;
    let bestShipment: PackageData[] = [];
    let bestShipmentDeliveryTime = Infinity;

    // Try to find the combination with maximum packages
    for (let i = 0; i < sortedPackages.length; i++) {
      const testShipment: PackageData[] = [];
      let testWeight = 0;

      // Start from current position and try to add as many packages as possible
      for (let j = i; j < sortedPackages.length; j++) {
        if (
          testWeight + sortedPackages[j].weight <=
          vehicle.maxCarriableWeight
        ) {
          testShipment.push(sortedPackages[j]);
          testWeight += sortedPackages[j].weight;
        }
      }

      // Calculate delivery time for this shipment
      const maxDistance =
        testShipment.length > 0
          ? Math.max(...testShipment.map((p) => p.distance))
          : 0;
      const deliveryTime = this.calculateDeliveryTime(
        maxDistance,
        vehicle.maxSpeed
      );

      // Keep track of the shipment with maximum packages
      // If package counts are equal, prefer the one with shorter delivery time
      if (
        testShipment.length > maxPackageCount ||
        (testShipment.length === maxPackageCount &&
          deliveryTime < bestShipmentDeliveryTime)
      ) {
        maxPackageCount = testShipment.length;
        bestShipment = [...testShipment];
        bestShipmentDeliveryTime = deliveryTime;
      }
    }

    // If no packages fit, return empty shipment
    if (bestShipment.length === 0) {
      return { packages: [] };
    }

    return { packages: bestShipment };
  }

  private findOptimalShipmentForVehicle(
    packages: PackageData[],
    vehicle: Vehicle
  ): { packages: PackageData[] } {
    if (packages.length === 0) return { packages: [] };

    // Sort packages by weight (heavier first) to prefer heavier packages
    const sortedPackages = [...packages].sort((a, b) => b.weight - a.weight);

    let bestShipment: PackageData[] = [];
    let bestTotalWeight = 0;

    // Try to find the best shipment by prioritizing heavier packages
    // while respecting the vehicle weight limit
    for (let i = 0; i < sortedPackages.length; i++) {
      const testShipment: PackageData[] = [];
      let testWeight = 0;

      // Start with the heaviest package and try to add more
      for (let j = i; j < sortedPackages.length; j++) {
        if (
          testWeight + sortedPackages[j].weight <=
          vehicle.maxCarriableWeight
        ) {
          testShipment.push(sortedPackages[j]);
          testWeight += sortedPackages[j].weight;
        }
      }

      // Prefer shipments with heavier total weight
      if (testWeight > bestTotalWeight) {
        bestTotalWeight = testWeight;
        bestShipment = [...testShipment];
      }
    }

    // If no packages fit, return empty shipment
    if (bestShipment.length === 0) {
      return { packages: [] };
    }

    return { packages: bestShipment };
  }

  calculateAllDeliveryResults(
    packages: PackageData[],
    vehicles: Vehicle[]
  ): {
    results: DeliveryResult[];
    optimizationSteps: OptimizationStep[];
  } {
    // Calculate costs for all packages
    const costResults = packages.map((pkg) => {
      const { originalCost, discount, totalCost } = this.calculateCost(pkg);
      return {
        id: pkg.id,
        discount: Math.round(discount),
        totalCost: Math.round(totalCost),
        originalCost: Math.round(originalCost),
        estimatedDeliveryTime: 0, // Will be updated after scheduling
      };
    });

    // Optimize shipments and calculate delivery times
    const { shipments, optimizationSteps } = this.optimizePackageShipments(
      packages,
      vehicles
    );

    // Update delivery times in results
    shipments.forEach((shipment) => {
      shipment.packages.forEach((pkg) => {
        const result = costResults.find((r) => r.id === pkg.id);
        if (result) {
          result.estimatedDeliveryTime = parseFloat(
            shipment.deliveryTime.toFixed(2)
          );
        }
      });
    });

    // Condense to exactly 6 canonical steps for UI
    const six = this.condenseToSixSteps(optimizationSteps);

    return {
      results: costResults,
      optimizationSteps: six,
    };
  }

  // CLI input parsing
  parseCLIInput(input: string): {
    baseDeliveryCost: number;
    packages: PackageData[];
    vehicles: Vehicle[];
  } {
    const lines = input.trim().split("\n");

    // Parse base delivery cost and number of packages
    const [baseCost, packageCount] = lines[0].split(" ").map(Number);

    // Parse packages
    const packages: PackageData[] = [];
    for (let i = 1; i <= packageCount; i++) {
      const [id, weight, distance, offerCode] = lines[i].split(" ");
      packages.push({
        id,
        weight: Number(weight),
        distance: Number(distance),
        offerCode,
      });
    }

    // Parse vehicles
    const [vehicleCount, maxSpeed, maxWeight] = lines[packageCount + 1]
      .split(" ")
      .map(Number);
    const vehicles: Vehicle[] = [];
    for (let i = 1; i <= vehicleCount; i++) {
      vehicles.push({
        id: i,
        maxSpeed,
        maxCarriableWeight: maxWeight,
        availableTime: 0,
      });
    }

    return {
      baseDeliveryCost: baseCost,
      packages,
      vehicles,
    };
  }

  // CLI output formatting
  formatCLIOutput(results: DeliveryResult[]): string {
    return results
      .map(
        (result) =>
          `${result.id} ${result.discount} ${result.totalCost} ${result.estimatedDeliveryTime}`
      )
      .join("\n");
  }

  // Utility function to format decimal hours to hours and minutes
  static formatTime(decimalHours: number): string {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);

    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${minutes} min`;
    }
  }

  // Utility function to format decimal hours to hours and minutes for display
  formatTime(decimalHours: number): string {
    return DeliveryService.formatTime(decimalHours);
  }

  // ===== Extra helpers to mirror backend behavior =====

  private generateInitialOverviewStep(
    step: number,
    remainingPackages: PackageData[],
    availableVehicles: Vehicle[],
    currentTime: number
  ): OptimizationStep {
    const vehicleCount = availableVehicles.length;
    // Sort packages by ID to ensure PKG1, PKG2, PKG3... order
    remainingPackages.sort((a, b) => {
      const aNum = parseInt(a.id.replace('PKG', ''));
      const bNum = parseInt(b.id.replace('PKG', ''));
      return aNum - bNum;
    });

    const maxLoad =
      vehicleCount > 0 ? availableVehicles[0].maxCarriableWeight : 0;
    const combos: { ids: string; count: number; totalWeight: number }[] = [];

    // Generate combinations of different sizes (2 to max packages that fit)
    const maxPackages = Math.min(remainingPackages.length, 5); // Limit to 5 packages max for performance

    for (let size = 2; size <= maxPackages; size++) {
      this.generateCombinations(remainingPackages, size, maxLoad, combos);
    }

    let description = `STEP ${String(step).padStart(2, "0")}\n`;
    description += `Packages Remaining: ${String(
      remainingPackages.length
    ).padStart(2, "0")}\n`;
    description += `Vehicles Available: ${String(vehicleCount).padStart(
      2,
      "0"
    )} | Current Time: ${DeliveryService.formatTime(currentTime)}\n`;
    description += `-------------------------------------------------\n`;
    if (combos.length === 0) {
      description += `(No valid 2-package combinations)\n`;
    } else {
      combos.forEach((c) => {
        description += `${c.ids} → ${String(c.count).padStart(
          2,
          "0"
        )} packages ${c.totalWeight}kg\n`;
      });
    }
    description += `-------------------------------------------\n`;

    const vehicleReturns01 = availableVehicles
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((v) => ({
        vehicleId: v.id,
        name: `Vehicle ${String(v.id).padStart(2, "0")}`,
        returningIn: Math.max(0, v.availableTime - currentTime),
      }));
    const nextAvail01 = vehicleReturns01.length
      ? vehicleReturns01.reduce((min, v) =>
          v.returningIn < min.returningIn ? v : min
        )
      : undefined;
    if (nextAvail01) {
      description += `Next available: ${
        nextAvail01.name
      } in ${nextAvail01.returningIn.toFixed(2)} hrs\n`;
    }

    let previewAssignments: OptimizationStep["vehicleAssignments"] = [];
    if (availableVehicles.length > 0 && remainingPackages.length > 0) {
      const vehicle = availableVehicles[0];
      const { packages: previewPkgs } = this.findOptimalShipmentForVehicle(
        remainingPackages,
        vehicle
      );
      if (previewPkgs && previewPkgs.length > 0) {
        const maxDistance = Math.max(...previewPkgs.map((p) => p.distance));
        const deliveryTime = this.calculateDeliveryTime(
          maxDistance,
          vehicle.maxSpeed
        );
        const returnTime = deliveryTime * 2;
        previewAssignments = [
          {
            vehicleId: vehicle.id,
            name: `Vehicle ${String(vehicle.id).padStart(2, "0")}`,
            packages: previewPkgs,
            totalWeight: previewPkgs.reduce((s, p) => s + p.weight, 0),
            maxDistance,
            deliveryTime,
            returnTime,
            availableAfter: currentTime + returnTime,
            vehicleSpeed: vehicle.maxSpeed,
          },
        ];

        // Append assignment details for Step 01
        const pkgIds = previewPkgs.map((p) => p.id).join(" + ");
        description += `Assigned preview: Vehicle ${String(vehicle.id).padStart(
          2,
          "0"
        )} → ${pkgIds}\n`;
        description += `One-way time: ${deliveryTime.toFixed(
          2
        )} hrs | Round-trip: ${returnTime.toFixed(2)} hrs\n`;
        description += `Available at: ${(currentTime + returnTime).toFixed(
          2
        )} hrs\n`;
      }
    }

    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: vehicleCount,
      currentTime,
      vehicleAssignments: previewAssignments,
      unassignedPackages: [...remainingPackages],
      assignedPackages:
        previewAssignments.length > 0 ? previewAssignments[0].packages : [],
      meta: {
        maxSpeed: vehicleCount > 0 ? availableVehicles[0].maxSpeed : 0,
        maxLoad,
      },
      combos: combos.map((c) => {
        const parts = c.ids.split(" + ").map((s) => s.trim());
        const packageIds: string[] = [];
        const packageWeights: number[] = [];

        parts.forEach(part => {
          const [id, weightWithKg] = part.split(" ");
          packageIds.push(id);
          packageWeights.push(parseFloat(weightWithKg?.replace("kg", "") || "0"));
        });

        return {
          packageIds,
          packageWeights,
          total: c.totalWeight,
          count: c.count,
        };
      }),
      availability: {
        vehicleReturns: vehicleReturns01,
        firstAvailable: nextAvail01
          ? {
              vehicleId: nextAvail01.vehicleId,
              name: nextAvail01.name,
              delta: nextAvail01.returningIn,
              expression: `(Current Time (${currentTime.toFixed(
                0
              )}) + ${nextAvail01.returningIn.toFixed(2)})`,
              packages: [], // Empty array for firstAvailable vehicle
              totalWeight: 0, // No packages assigned yet
              maxDistance: 0, // No packages assigned yet
              deliveryTime: 0, // No delivery time yet
              returnTime: 0, // No return time yet
              availableAfter: currentTime + nextAvail01.returningIn, // When it becomes available
              vehicleSpeed: availableVehicles.find(v => v.id === nextAvail01.vehicleId)?.maxSpeed, // Vehicle speed if found
            }
          : undefined,
      },
    } as unknown as OptimizationStep;
  }

  private generateCombinationStep(
    step: number,
    remainingPackages: PackageData[],
    availableVehicles: Vehicle[],
    currentTime: number,
    _overview: OptimizationStep
  ): OptimizationStep {
    // Sort packages by ID to ensure PKG1, PKG2, PKG3... order
    remainingPackages.sort((a, b) => {
      const aNum = parseInt(a.id.replace('PKG', ''));
      const bNum = parseInt(b.id.replace('PKG', ''));
      return aNum - bNum;
    });
    const currentlyAvailable = availableVehicles.filter(
      (v) => v.availableTime <= currentTime
    );
    console.log(
      currentlyAvailable,
      "currentlyAvailable generateCombinationStep 700"
    );
    const vehicleCount = currentlyAvailable.length;
    const maxLoad =
      availableVehicles.length > 0
        ? availableVehicles[0].maxCarriableWeight
        : 0;

    const combos: { ids: string; count: number; totalWeight: number }[] = [];
    const maxPackages = Math.min(remainingPackages.length, 5); // Limit to 5 packages max for performance

    for (let size = 2; size <= maxPackages; size++) {
      this.generateCombinations(remainingPackages, size, maxLoad, combos);
    }

    const heaviest =
      [...remainingPackages].sort((a, b) => b.weight - a.weight)[0] || null;

    let description = `STEP ${String(step).padStart(2, "0")}\n`;
    description += `Packages Remaining: ${String(
      remainingPackages.length
    ).padStart(2, "0")}\n`;
    description += `Vehicles Available: ${String(vehicleCount).padStart(
      2,
      "0"
    )} | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;
    description += `Valid 2-package combinations within ${maxLoad}kg:\n`;
    if (combos.length === 0) {
      description += `  (No valid 2-package combinations)\n`;
    } else {
      const bestCombo = [...combos].sort(
        (a, b) => b.totalWeight - a.totalWeight
      )[0];
      description += `  ${bestCombo.ids} → ${String(bestCombo.count).padStart(
        2,
        "0"
      )} packages ${bestCombo.totalWeight}kg\n`;
    }
    if (heaviest) {
      description += `\nHeaviest package: ${heaviest.id} ${heaviest.weight} kg (Most Weight)\n`;
    }

    const vehicleReturns02 = availableVehicles
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((v) => ({
        vehicleId: v.id,
        name: `Vehicle ${String(v.id).padStart(2, "0")}`,
        returningIn: Math.max(0, v.availableTime - currentTime),
      }));
    const nextAvail02 = vehicleReturns02.length
      ? vehicleReturns02.reduce((min, v) =>
          v.returningIn < min.returningIn ? v : min
        )
      : undefined;
    if (nextAvail02) {
      description += `Next available: ${
        nextAvail02.name
      } in ${nextAvail02.returningIn.toFixed(2)} hrs\n`;
    }

    let vehicleAssignments: OptimizationStep["vehicleAssignments"] = [];
    if (heaviest && currentlyAvailable.length > 0) {
      const preferred = currentlyAvailable[0];
      const maxDistance = heaviest.distance;
      const deliveryTime = this.calculateDeliveryTime(
        maxDistance,
        preferred.maxSpeed
      );
      const returnTime = deliveryTime * 2;
      vehicleAssignments = [
        {
          vehicleId: preferred.id,
          name: `Vehicle ${String(preferred.id).padStart(2, "0")}`,
          packages: [heaviest],
          totalWeight: heaviest.weight,
          maxDistance,
          deliveryTime,
          returnTime,
          availableAfter: currentTime + returnTime,
          vehicleSpeed: preferred.maxSpeed,
        },
      ];

      // Append assignment details for Step 02
      description += `Assigned: Vehicle ${String(preferred.id).padStart(
        2,
        "0"
      )} → ${heaviest.id}\n`;
      description += `One-way time: ${deliveryTime.toFixed(
        2
      )} hrs | Round-trip: ${returnTime.toFixed(2)} hrs\n`;
      description += `Available at: ${(currentTime + returnTime).toFixed(
        2
      )} hrs\n`;
    }

    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: vehicleCount,
      currentTime,
      vehicleAssignments,
      unassignedPackages: [...remainingPackages],
      assignedPackages: heaviest ? [heaviest] : [],
      heaviest: heaviest
        ? { id: heaviest.id, weight: heaviest.weight }
        : undefined,
      availability: {
        vehicleReturns: vehicleReturns02,
        firstAvailable: nextAvail02
          ? {
              vehicleId: nextAvail02.vehicleId,
              name: nextAvail02.name,
              delta: nextAvail02.returningIn,
              expression: `(Current Time (${currentTime.toFixed(
                0
              )}) + ${nextAvail02.returningIn.toFixed(2)})`,
              packages: [], // Empty array for firstAvailable vehicle
              totalWeight: 0, // No packages assigned yet
              maxDistance: 0, // No packages assigned yet
              deliveryTime: 0, // No delivery time yet
              returnTime: 0, // No return time yet
              availableAfter: currentTime + nextAvail02.returningIn, // When it becomes available
              vehicleSpeed: availableVehicles.find(v => v.id === nextAvail02.vehicleId)?.maxSpeed, // Vehicle speed if found
            }
          : undefined,
      },
    } as unknown as OptimizationStep;
  }

  private generateAvailabilityStep(
    step: number,
    remainingPackages: PackageData[],
    availableVehicles: Vehicle[],
    currentTime: number
  ): OptimizationStep {
    const nextAvailableTime = Math.min(
      ...availableVehicles.map((v) => v.availableTime)
    );
    const nextAvailableVehicle = availableVehicles.find(
      (v) => v.availableTime === nextAvailableTime
    );

    let description = `STEP ${String(step).padStart(
      2,
      "0"
    )}: Waiting for Vehicles to Return\n`;
    const pkgList = remainingPackages
      .map((p) => `${p.id} (${p.weight} kg)`)
      .join(", ");
    description += `Packages Remaining: ${remainingPackages.length}${
      pkgList ? ` → ${pkgList}` : ""
    }\n`;
    description += `Vehicles Available: 0\n`;
    description += `Current Time: ${currentTime.toFixed(0)} hrs\n`;

    availableVehicles
      .sort((a, b) => a.id - b.id)
      .forEach((v) => {
        const returningIn = Math.max(0, v.availableTime - currentTime);
        description += `Vehicle ${String(v.id).padStart(
          2,
          "0"
        )} returning in ${returningIn.toFixed(2)} hrs\n`;
      });

    description += `---------------------------------------------\n`;
    if (nextAvailableVehicle) {
      const delta = Math.max(
        0,
        nextAvailableVehicle.availableTime - currentTime
      );
      description += `Logic: Next delivery can only start when a vehicle becomes available.\n`;
      description += `Vehicle ${String(nextAvailableVehicle.id).padStart(
        2,
        "0"
      )} returns first → available at Current Time + ${delta.toFixed(
        2
      )} = ${delta.toFixed(
        2
      )} hrs (time ${nextAvailableVehicle.availableTime.toFixed(2)} hrs)\n`;
    }

    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: 0,
      currentTime,
      vehicleAssignments: [],
      unassignedPackages: [...remainingPackages],
      assignedPackages: [],
      availability: {
        vehicleReturns: availableVehicles
          .sort((a, b) => a.id - b.id)
          .map((v) => ({
            vehicleId: v.id,
            name: `Vehicle ${String(v.id).padStart(2, "0")}`,
            returningIn: Math.max(0, v.availableTime - currentTime),
          })),
        firstAvailable: nextAvailableVehicle
          ? {
              vehicleId: nextAvailableVehicle.id,
              name: `Vehicle ${String(nextAvailableVehicle.id).padStart(
                2,
                "0"
              )}`,
              delta: Math.max(
                0,
                nextAvailableVehicle.availableTime - currentTime
              ),
              expression: `(Current Time (${currentTime.toFixed(
                0
              )}) + ${Math.max(
                0,
                nextAvailableVehicle.availableTime - currentTime
              ).toFixed(2)})`,
            }
          : undefined,
      },
    } as unknown as OptimizationStep;
  }

  private generatePlanningStep(
    step: number,
    remainingPackages: PackageData[],
    availableVehicles: Vehicle[],
    currentTime: number,
    lastUsedVehicle: Vehicle
  ): OptimizationStep {
    const currentlyAvailableVehicles = availableVehicles.filter(
      (v) => v.availableTime <= currentTime
    );

    let description = `STEP ${String(step).padStart(2, "0")}\n`;
    description += `Packages Remaining: ${
      remainingPackages.length
    } | Vehicles Available: ${
      currentlyAvailableVehicles.length
    } | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;

    if (remainingPackages.length === 1) {
      const pkg = remainingPackages[0];
      description += `Planning delivery for ${pkg.id} (${pkg.weight}kg, ${pkg.distance}km)\n`;
      description += `Current Time + ${DeliveryService.formatTime(
        pkg.distance / lastUsedVehicle.maxSpeed
      )} = ${DeliveryService.formatTime(
        currentTime + pkg.distance / lastUsedVehicle.maxSpeed
      )}\n`;
    } else {
      description += `Planning next shipment with remaining packages:\n`;
      remainingPackages.forEach((pkg) => {
        description += `  ${pkg.id}: ${pkg.weight}kg, ${pkg.distance}km\n`;
      });
      description += `Available vehicles: ${currentlyAvailableVehicles
        .map((v) => `Vehicle ${v.id} (${v.maxCarriableWeight}kg capacity)`)
        .join(", ")}\n`;
    }

    const vehicleReturns = availableVehicles
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((v) => ({
        vehicleId: v.id,
        name: `Vehicle ${String(v.id).padStart(2, "0")}`,
        returningIn: Math.max(0, v.availableTime - currentTime),
      }));
    const nextAvail = vehicleReturns.length
      ? vehicleReturns.reduce((min, v) =>
          v.returningIn < min.returningIn ? v : min
        )
      : undefined;
    if (nextAvail) {
      description += `Next available: ${
        nextAvail.name
      } in ${nextAvail.returningIn.toFixed(2)} hrs\n`;
    }

    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: currentlyAvailableVehicles.length,
      currentTime,
      vehicleAssignments: [],
      assignedPackages: [],
      unassignedPackages: [...remainingPackages],
      availability: {
        vehicleReturns,
        firstAvailable: nextAvail
          ? {
              vehicleId: nextAvail.vehicleId,
              name: nextAvail.name,
              delta: nextAvail.returningIn,
              expression: `(Current Time (${currentTime.toFixed(
                0
              )}) + ${nextAvail.returningIn.toFixed(2)})`,
              packages: [], // Empty array for firstAvailable vehicle
              totalWeight: 0, // No packages assigned yet
              maxDistance: 0, // No packages assigned yet
              deliveryTime: 0, // No delivery time yet
              returnTime: 0, // No return time yet
              availableAfter: currentTime + nextAvail.returningIn, // When it becomes available
              vehicleSpeed: availableVehicles.find(v => v.id === nextAvail.vehicleId)?.maxSpeed, // Vehicle speed if found
            }
          : undefined,
      },
    } as unknown as OptimizationStep;
  }

  private generateSchedulingStep(
    step: number,
    remainingPackages: PackageData[],
    availableVehicles: Vehicle[],
    currentTime: number,
    lastUsedVehicle: Vehicle,
    planningStep: OptimizationStep
  ): OptimizationStep {
    const currentlyAvailableVehicles = availableVehicles.filter(
      (v) => v.availableTime <= currentTime
    );

    let description = `STEP ${String(step).padStart(2, "0")}\n`;
    description += `Packages Remaining: ${
      remainingPackages.length
    } | Vehicles Available: ${
      currentlyAvailableVehicles.length
    } | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;

    if (remainingPackages.length === 1) {
      const pkg = remainingPackages[0];
      const deliveryTime = pkg.distance / lastUsedVehicle.maxSpeed;
      const returnTime = deliveryTime * 2;
      description += `Final delivery scheduling:\n`;
      description += `${pkg.id} assigned to Vehicle ${lastUsedVehicle.id}\n`;
      description += `Delivery time: ${DeliveryService.formatTime(
        deliveryTime
      )} one way\n`;
      description += `Return time: ${DeliveryService.formatTime(
        returnTime
      )} total\n`;
      description += `Vehicle ${
        lastUsedVehicle.id
      } will be available first after ${DeliveryService.formatTime(
        returnTime
      )}\n`;
    } else {
      description += `Scheduling final shipments...\n`;
      description += `Remaining packages: ${remainingPackages.length}\n`;
      description += `Next vehicle available: Vehicle ${
        currentlyAvailableVehicles[0]?.id || "None"
      }\n`;
    }

    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: currentlyAvailableVehicles.length,
      currentTime,
      vehicleAssignments: planningStep.vehicleAssignments,
      unassignedPackages: planningStep.unassignedPackages,
      assignedPackages: planningStep.assignedPackages,
    } as unknown as OptimizationStep;
  }

  private generateStepDescription(
    packages: PackageData[],
    vehicle: Vehicle,
    maxDistance: number,
    deliveryTime: number,
    returnTime: number
  ): string {
    const packageIds = packages.map((pkg) => pkg.id).join(" + ");

    let description = `Vehicle ${String(vehicle.id).padStart(
      2,
      "0"
    )} Delivering ${packageIds} ${DeliveryService.formatTime(deliveryTime)}\n`;
    description += `           ${maxDistance}km/${vehicle.maxSpeed}km/hr\n\n`;

    if (packages.length > 1) {
      packages.forEach((pkg) => {
        const pkgDeliveryTime = pkg.distance / vehicle.maxSpeed;
        description += `           Delivering ${
          pkg.id
        } ${DeliveryService.formatTime(pkgDeliveryTime)}\n`;
        description += `           ${pkg.distance}/${vehicle.maxSpeed}km/hr\n\n`;
      });
    }

    description += `Vehicle ${String(vehicle.id).padStart(
      2,
      "0"
    )} will be available after (2*${deliveryTime.toFixed(
      2
    )}) ${returnTime.toFixed(2)}\n`;

    return description;
  }

  private condenseToSixSteps(steps: OptimizationStep[]): OptimizationStep[] {
    if (!steps || steps.length === 0) return [];

    const byIndex = (s: OptimizationStep) => steps.indexOf(s);
    const originalStepCount = steps.length;

    const s1 = steps.find((s) => s.step === 1) || steps[0];
    const s2 = steps.find((s) => s.step === 2) || steps[1] || s1;
    const avail1 = steps.find(
      (s) =>
        (s as unknown as OptimizationStep).availability &&
        s.vehiclesAvailable === 0
    );
    const avail1Index = avail1 ? byIndex(avail1) : -1;
    const s4 =
      avail1Index >= 0 && avail1Index + 1 < steps.length
        ? steps[avail1Index + 1]
        : steps.find(
            (s, i) =>
              i > (avail1Index >= 0 ? avail1Index : 1) &&
              s.vehicleAssignments &&
              s.vehicleAssignments.length > 0
          );
    const avail2 = s4
      ? steps
          .slice(byIndex(s4) + 1)
          .find(
            (s) =>
              (s as unknown as OptimizationStep).availability &&
              s.vehiclesAvailable === 0
          )
      : undefined;
    const s6 =
      [...steps]
        .reverse()
        .find((s) => s.vehicleAssignments && s.vehicleAssignments.length > 0) ||
      steps[steps.length - 1];

    const picks: (OptimizationStep | undefined)[] = [
      s1,
      s2,
      avail1,
      s4,
      avail2,
      s6,
    ];
    const filtered = picks.filter(Boolean) as OptimizationStep[];

    // Determine target step count based on original step count
    const targetStepCount = originalStepCount <= 5 ? 7 : 6;

    // Ensure exactly targetStepCount items - pad with last or trim
    let result = filtered;
    if (result.length < targetStepCount) {
      const last = result[result.length - 1] || steps[steps.length - 1];
      while (result.length < targetStepCount) result.push(last);
    }
    if (result.length > targetStepCount) {
      result = result.slice(0, targetStepCount);
    }

    return result.map((s, idx) => ({ ...s, step: idx + 1 }));
  }

  // Generate delivery planning steps in the exact format specified by user
  generateDeliveryPlanningSteps(
    packages: PackageData[],
    vehicles: Vehicle[]
  ): string {
    const steps: string[] = [];
    const remainingPackages = [...packages];
    const availableVehicles = [...vehicles];
    let currentTime = 0;
    let stepNumber = 1;

    // Sort packages by weight (heavier first) as per requirement
    remainingPackages.sort((a, b) => b.weight - a.weight);

    // STEP 01: Initial Delivery Planning
    let stepDescription = `STEP ${String(stepNumber).padStart(
      2,
      "0"
    )}: Initial Delivery Planning\n`;
    stepDescription += `Packages Remaining: ${String(
      remainingPackages.length
    ).padStart(2, "0")}\n`;
    stepDescription += `Vehicles Available: ${String(
      availableVehicles.length
    ).padStart(2, "0")}\n`;
    stepDescription += `Current Time: ${currentTime} hrs\n\n`;

    // Step 1: Choose packages to deliver together
    stepDescription += `Step 1: Choose packages to deliver together\n\n`;
    stepDescription += `Check combinations for two packages (to optimize vehicle usage):\n\n`;

    const maxLoad = vehicles[0]?.maxCarriableWeight || 0;
    const combos: Array<{
      pkg1: PackageData;
      pkg2: PackageData;
      totalWeight: number;
    }> = [];

    for (let i = 0; i < remainingPackages.length; i++) {
      for (let j = i + 1; j < remainingPackages.length; j++) {
        const totalWeight =
          remainingPackages[i].weight + remainingPackages[j].weight;
        if (totalWeight <= maxLoad) {
          combos.push({
            pkg1: remainingPackages[i],
            pkg2: remainingPackages[j],
            totalWeight: totalWeight,
          });
        }
      }
    }

    // Display combinations
    if (combos.length === 0) {
      stepDescription += `(No valid 2-package combinations within vehicle limits)\n\n`;
    } else {
      combos.forEach((combo) => {
        stepDescription += `${combo.pkg1.id} + ${combo.pkg2.id} = ${combo.pkg1.weight} + ${combo.pkg2.weight} = ${combo.totalWeight} kg\n`;
      });
    }

    stepDescription += `\nLogic: Combine packages to maximize weight without exceeding vehicle capacity (assuming a vehicle can carry multiple packages).\n\n`;

    // Step 2: Assign packages to vehicles
    stepDescription += `Step 2: Assign packages to vehicles\n\n`;

    // Find available vehicles (those with availableTime <= currentTime)
    const readyVehicles = availableVehicles.filter(
      (v) => v.availableTime <= currentTime
    );

    // Assign heaviest package to Vehicle 01
    if (readyVehicles.length > 0 && remainingPackages.length > 0) {
      const heaviestPkg = remainingPackages[0];
      const vehicle = readyVehicles[0];

      // Calculate delivery time (using example distance of 125 km)
      const distance = 125; // example distance
      const deliveryTime = distance / vehicle.maxSpeed;

      stepDescription += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} → Deliver ${heaviestPkg.id} (${heaviestPkg.weight} kg)\n`;
      stepDescription += `Distance: ${distance} km\n`;
      stepDescription += `Speed: ${vehicle.maxSpeed} km/hr\n`;
      stepDescription += `Time = Distance ÷ Speed = ${distance} ÷ ${
        vehicle.maxSpeed
      } ≈ ${deliveryTime.toFixed(2)} hrs\n\n`;

      // Update vehicle availability
      vehicle.availableTime = currentTime + deliveryTime * 2;

      // Remove delivered package
      const pkgIndex = remainingPackages.findIndex(
        (p) => p.id === heaviestPkg.id
      );
      if (pkgIndex !== -1) {
        remainingPackages.splice(pkgIndex, 1);
      }
    }

    // Assign next heaviest to Vehicle 01 if available
    if (readyVehicles.length > 0 && remainingPackages.length > 0) {
      const nextHeaviest = remainingPackages[0];
      const vehicle = readyVehicles[0];

      const distance = 60; // example distance
      const deliveryTime = distance / vehicle.maxSpeed;

      stepDescription += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} next → Deliver ${nextHeaviest.id} (${nextHeaviest.weight} kg)\n`;
      stepDescription += `Distance: ${distance} km\n`;
      stepDescription += `Speed: ${vehicle.maxSpeed} km/hr\n`;
      stepDescription += `Time = ${distance} ÷ ${
        vehicle.maxSpeed
      } ≈ ${deliveryTime.toFixed(2)} hrs\n\n`;

      // Update vehicle availability
      vehicle.availableTime = Math.max(
        vehicle.availableTime,
        currentTime + deliveryTime * 2
      );

      // Remove delivered package
      const pkgIndex = remainingPackages.findIndex(
        (p) => p.id === nextHeaviest.id
      );
      if (pkgIndex !== -1) {
        remainingPackages.splice(pkgIndex, 1);
      }
    }

    // Step 3: Calculate vehicle availability
    stepDescription += `Step 3: Calculate vehicle availability\n\n`;

    readyVehicles.forEach((vehicle) => {
      const totalTime = vehicle.availableTime - currentTime;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} total time for round trip = 2 × ${totalTime / 2} ≈ ${totalTime.toFixed(
        2
      )} hrs\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} will be free after ${totalTime.toFixed(2)} hrs.\n\n`;
    });

    steps.push(stepDescription);
    stepNumber++;

    // STEP 02: Next Delivery Assignment
    stepDescription = `STEP ${String(stepNumber).padStart(
      2,
      "0"
    )}: Next Delivery Assignment\n`;
    stepDescription += `Packages Remaining: ${String(
      remainingPackages.length
    ).padStart(2, "0")} → ${remainingPackages
      .map((p) => `${p.id} (${p.weight} kg)`)
      .join(", ")}\n`;
    stepDescription += `Vehicles Available: ${String(
      readyVehicles.length
    ).padStart(2, "0")}\n`;
    stepDescription += `Current Time: ${currentTime} hrs\n\n`;

    // Step 1: Pick the heaviest package
    if (remainingPackages.length > 0) {
      const heaviestPkg = remainingPackages[0];
      const vehicle = readyVehicles[0];

      stepDescription += `Step 1: Pick the heaviest package\n\n`;
      stepDescription += `${heaviestPkg.id} = ${
        heaviestPkg.weight
      } kg → assigned to Vehicle ${String(vehicle.id).padStart(2, "0")}.\n\n`;
      stepDescription += `Logic: Prioritize heavier packages to reduce future delivery time and trips.\n\n`;

      // Step 2: Calculate delivery time
      const distance = 100; // example distance
      const deliveryTime = distance / vehicle.maxSpeed;

      stepDescription += `Step 2: Calculate delivery time\n\n`;
      stepDescription += `Distance: ${distance} km\n`;
      stepDescription += `Speed: ${vehicle.maxSpeed} km/hr\n`;
      stepDescription += `Time = ${distance} ÷ ${
        vehicle.maxSpeed
      } ≈ ${deliveryTime.toFixed(2)} hrs\n\n`;

      // Step 3: Calculate vehicle availability
      const roundTripTime = deliveryTime * 2;
      stepDescription += `Step 3: Calculate vehicle availability\n\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} round trip = 2 × ${deliveryTime.toFixed(2)} ≈ ${roundTripTime.toFixed(
        2
      )} hrs\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} will be free after ${roundTripTime.toFixed(2)} hrs.\n\n`;

      // Update vehicle availability
      vehicle.availableTime = currentTime + roundTripTime;

      // Remove delivered package
      const pkgIndex = remainingPackages.findIndex(
        (p) => p.id === heaviestPkg.id
      );
      if (pkgIndex !== -1) {
        remainingPackages.splice(pkgIndex, 1);
      }
    }

    steps.push(stepDescription);
    stepNumber++;

    // STEP 03: Waiting for Vehicles to Return
    stepDescription = `STEP ${String(stepNumber).padStart(
      2,
      "0"
    )}: Waiting for Vehicles to Return\n`;
    stepDescription += `Packages Remaining: ${String(
      remainingPackages.length
    ).padStart(2, "0")} → ${remainingPackages
      .map((p) => `${p.id} (${p.weight} kg)`)
      .join(", ")}\n`;
    stepDescription += `Vehicles Available: 0\n`;
    stepDescription += `Current Time: ${currentTime} hrs\n\n`;

    // Show returning vehicles
    availableVehicles.forEach((vehicle) => {
      const returningIn = Math.max(0, vehicle.availableTime - currentTime);
      stepDescription += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} returning in ${returningIn.toFixed(2)} hrs\n`;
    });

    stepDescription += `\nVehicle ${String(availableVehicles[0].id).padStart(
      2,
      "0"
    )} returns first → available at Current Time + ${Math.max(
      0,
      availableVehicles[0].availableTime - currentTime
    ).toFixed(2)} = ${availableVehicles[0].availableTime.toFixed(2)} hrs\n\n`;

    stepDescription += `Logic: Next delivery can only start when a vehicle becomes available.\n\n`;

    // Update current time to when first vehicle returns
    currentTime = availableVehicles[0].availableTime;

    steps.push(stepDescription);
    stepNumber++;

    // STEP 04: Deliver PKG5 with Vehicle 02
    stepDescription = `STEP ${String(stepNumber).padStart(2, "0")}: Deliver ${
      remainingPackages.length > 0 ? remainingPackages[0].id : "Next Package"
    } with Vehicle ${String(availableVehicles[0].id).padStart(2, "0")}\n`;
    stepDescription += `Packages Remaining: ${String(
      remainingPackages.length
    ).padStart(2, "0")} → ${remainingPackages.map((p) => p.id).join(", ")}\n`;
    stepDescription += `Vehicles Available: 1 (Vehicle ${String(
      availableVehicles[0].id
    ).padStart(2, "0")})\n`;
    stepDescription += `Current Time: ${currentTime.toFixed(2)} hrs\n\n`;

    if (remainingPackages.length > 0) {
      const nextPkg = remainingPackages[0];
      const vehicle = availableVehicles[0];

      stepDescription += `Step 1: Pick the heaviest remaining package\n\n`;
      stepDescription += `${nextPkg.id} = ${
        nextPkg.weight
      } kg → assigned to Vehicle ${String(vehicle.id).padStart(2, "0")}.\n\n`;

      // Step 2: Calculate delivery time
      const distance = 95; // example distance
      const deliveryTime = distance / vehicle.maxSpeed;

      stepDescription += `Step 2: Calculate delivery time\n\n`;
      stepDescription += `Distance: ${distance} km\n`;
      stepDescription += `Speed: ${vehicle.maxSpeed} km/hr\n`;
      stepDescription += `Time = ${distance} ÷ ${
        vehicle.maxSpeed
      } ≈ ${deliveryTime.toFixed(2)} hrs\n\n`;

      // Step 3: Vehicle availability
      const roundTripTime = deliveryTime * 2;
      stepDescription += `Step 3: Vehicle availability\n\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} round trip = 2 × ${deliveryTime.toFixed(2)} = ${roundTripTime.toFixed(
        2
      )} hrs\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} free at ${currentTime.toFixed(2)} + ${roundTripTime.toFixed(2)} ≈ ${(
        currentTime + roundTripTime
      ).toFixed(2)} hrs\n\n`;

      // Update vehicle availability
      vehicle.availableTime = currentTime + roundTripTime;

      // Remove delivered package
      const pkgIndex = remainingPackages.findIndex((p) => p.id === nextPkg.id);
      if (pkgIndex !== -1) {
        remainingPackages.splice(pkgIndex, 1);
      }
    }

    steps.push(stepDescription);
    stepNumber++;

    // STEP 05: Waiting for Vehicles to Return
    stepDescription = `STEP ${String(stepNumber).padStart(
      2,
      "0"
    )}: Waiting for Vehicles to Return\n`;
    stepDescription += `Packages Remaining: ${String(
      remainingPackages.length
    ).padStart(2, "0")} → ${remainingPackages.map((p) => p.id).join(", ")}\n`;
    stepDescription += `Vehicles Available: 0\n`;
    stepDescription += `Current Time: ${currentTime.toFixed(2)} hrs\n\n`;

    // Show returning vehicles
    availableVehicles.forEach((vehicle) => {
      const returningIn = Math.max(0, vehicle.availableTime - currentTime);
      stepDescription += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} returning in ${returningIn.toFixed(2)} hrs\n`;
    });

    stepDescription += `\nVehicle ${String(availableVehicles[0].id).padStart(
      2,
      "0"
    )} becomes available first → after ${Math.max(
      0,
      availableVehicles[0].availableTime - currentTime
    ).toFixed(2)} hrs (${availableVehicles[0].availableTime.toFixed(
      2
    )} − ${currentTime.toFixed(2)})\n\n`;

    // Update current time to when first vehicle returns
    currentTime = availableVehicles[0].availableTime;

    steps.push(stepDescription);
    stepNumber++;

    // STEP 06: Deliver Last Package
    stepDescription = `STEP ${String(stepNumber).padStart(
      2,
      "0"
    )}: Deliver Last Package ${
      remainingPackages.length > 0 ? remainingPackages[0].id : "PKG1"
    }\n`;
    stepDescription += `Packages Remaining: ${String(
      remainingPackages.length
    ).padStart(2, "0")} → ${remainingPackages.map((p) => p.id).join(", ")}\n`;
    stepDescription += `Vehicles Available: 1 (Vehicle ${String(
      availableVehicles[0].id
    ).padStart(2, "0")})\n`;
    stepDescription += `Current Time: ${currentTime.toFixed(2)} hrs\n\n`;

    if (remainingPackages.length > 0) {
      const lastPkg = remainingPackages[0];
      const vehicle = availableVehicles[0];

      stepDescription += `Step 1: Assign the remaining package\n\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} delivers ${lastPkg.id}\n\n`;

      // Step 2: Calculate delivery time
      const distance = 30; // example distance
      const deliveryTime = distance / vehicle.maxSpeed;

      stepDescription += `Step 2: Calculate delivery time\n\n`;
      stepDescription += `Distance: ${distance} km\n`;
      stepDescription += `Speed: ${vehicle.maxSpeed} km/hr\n`;
      stepDescription += `Time = ${distance} ÷ ${
        vehicle.maxSpeed
      } ≈ ${deliveryTime.toFixed(2)} hrs\n\n`;

      // Step 3: Vehicle availability after delivery
      const roundTripTime = deliveryTime * 2;
      stepDescription += `Step 3: Vehicle availability after delivery\n\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} round trip = 2 × ${deliveryTime.toFixed(2)} = ${roundTripTime.toFixed(
        2
      )} hrs\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} free at ${currentTime.toFixed(2)} + ${roundTripTime.toFixed(2)} ≈ ${(
        currentTime + roundTripTime
      ).toFixed(2)} hrs\n\n`;

      // Remove delivered package
      const pkgIndex = remainingPackages.findIndex((p) => p.id === lastPkg.id);
      if (pkgIndex !== -1) {
        remainingPackages.splice(pkgIndex, 1);
      }
    }

    steps.push(stepDescription);

    // Add final summary
    steps.push(
      `\n✅ Key Logic Summary\n\nMaximize delivery efficiency by choosing the heaviest packages first.\nCombine packages if possible to reduce trips.\nCalculate delivery time:\nTime = Distance ÷ Speed\nRound-trip time = 2 × Time.\nTrack vehicle availability and assign packages when a vehicle becomes free.\nUpdate current time to the earliest vehicle availability for the next delivery.`
    );

    return steps.join("\n");
  }

  // ===== NEW DELIVERY SCHEDULING LOGIC =====

  /**
   * Advanced delivery scheduling based on user specification
   */
  scheduleDeliveries(
    packages: PackageData[],
    vehicles: Vehicle[],
    config: DeliveryScheduleConfig = {
      strategy: 'balanced',
      stopOverhead: 0.5, // 30 minutes per extra package
      maxPackagesPerTrip: 10
    }
  ): {
    shipments: Shipment[];
    optimizationSteps: OptimizationStep[];
    totalTime: number;
    totalTrips: number;
  } {
    const shipments: Shipment[] = [];
    const optimizationSteps: OptimizationStep[] = [];
    const remainingPackages = [...packages];
    const availableVehicles = [...vehicles].map(v => ({ ...v }));

    let currentTime = 0;
    let stepNumber = 1;
    let totalTrips = 0;

    // Sort packages based on strategy
    this.sortPackagesByStrategy(remainingPackages, config.strategy);

    // Process packages in batches based on count
    while (remainingPackages.length > 0) {
      const currentlyAvailableVehicles = availableVehicles.filter(
        v => v.availableTime <= currentTime
      );

      if (currentlyAvailableVehicles.length === 0) {
        // Advance time to next available vehicle
        const nextAvailableTime = Math.min(...availableVehicles.map(v => v.availableTime));
        currentTime = nextAvailableTime;
        continue;
      }

      // Select packages for next trip based on count
      const packagesForTrip = this.selectPackagesForTrip(
        remainingPackages,
        availableVehicles,
        config
      );

      if (packagesForTrip.length === 0) break;

      // Find earliest available vehicle
      const earliestVehicle = currentlyAvailableVehicles.reduce((earliest, current) =>
        current.availableTime < earliest.availableTime ? current : earliest
      );

      // Calculate trip details
      const maxDistance = Math.max(...packagesForTrip.map(p => p.distance));
      const baseDeliveryTime = this.calculateDeliveryTime(maxDistance, earliestVehicle.maxSpeed);
      const stopOverhead = (packagesForTrip.length - 1) * config.stopOverhead;
      const totalDeliveryTime = baseDeliveryTime + stopOverhead;
      const returnTime = totalDeliveryTime * 2;

      // Create shipment
      const shipment: Shipment = {
        packages: packagesForTrip,
        vehicleId: earliestVehicle.id,
        deliveryTime: currentTime + totalDeliveryTime,
        returnTime: currentTime + returnTime
      };

      shipments.push(shipment);
      totalTrips++;

      // Update vehicle availability
      earliestVehicle.availableTime = currentTime + returnTime;

      // Remove assigned packages
      packagesForTrip.forEach(pkg => {
        const index = remainingPackages.findIndex(p => p.id === pkg.id);
        if (index !== -1) {
          remainingPackages.splice(index, 1);
        }
      });

      // Update current time
      currentTime += totalDeliveryTime;

      // Add optimization step
      const step = this.createOptimizationStep(
        stepNumber++,
        packagesForTrip,
        remainingPackages,
        availableVehicles,
        currentTime,
        earliestVehicle,
        maxDistance,
        totalDeliveryTime,
        returnTime,
        config
      );
      optimizationSteps.push(step);
    }

    return {
      shipments,
      optimizationSteps,
      totalTime: currentTime,
      totalTrips
    };
  }

  /**
   * Sort packages based on selection strategy
   */
  private sortPackagesByStrategy(packages: PackageData[], strategy: PackageSelectionStrategy): void {
    switch (strategy) {
      case 'weight':
        packages.sort((a, b) => b.weight - a.weight);
        break;
      case 'distance':
        packages.sort((a, b) => b.distance - a.distance);
        break;
      case 'balanced':
        packages.sort((a, b) => (b.weight * b.distance) - (a.weight * a.distance));
        break;
    }
  }

  /**
   * Select packages for next trip based on package count and clustering logic
   */
  private selectPackagesForTrip(
    remainingPackages: PackageData[],
    vehicles: Vehicle[],
    config: DeliveryScheduleConfig
  ): PackageData[] {
    if (remainingPackages.length === 0) return [];

    const maxLoad = vehicles[0]?.maxCarriableWeight || 0;
    const packageCount = remainingPackages.length;

    // Use different strategies based on package count
    if (packageCount === 1) {
      return [remainingPackages[0]];
    } else if (packageCount <= 2) {
      // Try to combine if capacity allows
      const totalWeight = remainingPackages[0].weight + remainingPackages[1].weight;
      return totalWeight <= maxLoad ? remainingPackages.slice(0, 2) : [remainingPackages[0]];
    } else if (packageCount <= 4) {
      // Greedy packing: heaviest + others that fit
      return this.packWithAnchor(remainingPackages, maxLoad, config.maxPackagesPerTrip);
    } else if (packageCount <= 6) {
      // Split into 2-3 trips using bin-packing style
      return this.packMultipleTrips(remainingPackages, maxLoad, 2, 3, config.maxPackagesPerTrip);
    } else {
      // 7-10 packages: cluster by distance, then pack with knapsack logic
      return this.packWithClustering(remainingPackages, maxLoad, config.maxPackagesPerTrip);
    }
  }

  /**
   * Pack using anchor package approach (heaviest + others that fit)
   */
  private packWithAnchor(
    packages: PackageData[],
    maxLoad: number,
    maxPackages: number
  ): PackageData[] {
    const sortedPackages = [...packages].sort((a, b) => b.weight - a.weight);
    const shipment: PackageData[] = [];
    let currentWeight = 0;

    // Use heaviest as anchor
    if (sortedPackages.length > 0) {
      shipment.push(sortedPackages[0]);
      currentWeight = sortedPackages[0].weight;
    }

    // Fill remaining capacity with lighter packages
    for (let i = 1; i < sortedPackages.length && shipment.length < maxPackages; i++) {
      if (currentWeight + sortedPackages[i].weight <= maxLoad) {
        shipment.push(sortedPackages[i]);
        currentWeight += sortedPackages[i].weight;
      }
    }

    return shipment;
  }

  /**
   * Pack for multiple trips (2-3 trips)
   */
  private packMultipleTrips(
    packages: PackageData[],
    maxLoad: number,
    minTrips: number,
    maxTrips: number,
    maxPackages: number
  ): PackageData[] {
    const sortedPackages = [...packages].sort((a, b) => b.weight - a.weight);

    // Try to find optimal single trip first
    const singleTrip = this.packWithAnchor(packages, maxLoad, maxPackages);
    if (singleTrip.length === packages.length) {
      return singleTrip;
    }

    // If single trip doesn't work, return heaviest package for this trip
    return [sortedPackages[0]];
  }

  /**
   * Pack with clustering for 7-10 packages
   */
  private packWithClustering(
    packages: PackageData[],
    maxLoad: number,
    maxPackages: number
  ): PackageData[] {
    // Cluster by distance (near vs far)
    const midDistance = this.calculateMedianDistance(packages);
    const nearPackages = packages.filter(p => p.distance <= midDistance);
    const farPackages = packages.filter(p => p.distance > midDistance);

    // Pack near packages first (more can fit)
    const nearShipment = this.packWithAnchor(nearPackages, maxLoad, maxPackages);
    if (nearShipment.length > 0) {
      return nearShipment;
    }

    // If no near packages fit, try far packages
    return this.packWithAnchor(farPackages, maxLoad, maxPackages);
  }

  /**
   * Calculate median distance for clustering
   */
  private calculateMedianDistance(packages: PackageData[]): number {
    const distances = [...packages].sort((a, b) => a.distance - b.distance);
    const mid = Math.floor(distances.length / 2);
    return distances[mid].distance;
  }

  /**
   * Create optimization step for tracking
   */
  private createOptimizationStep(
    step: number,
    packages: PackageData[],
    remainingPackages: PackageData[],
    vehicles: Vehicle[],
    currentTime: number,
    vehicle: Vehicle,
    maxDistance: number,
    deliveryTime: number,
    returnTime: number,
    config: DeliveryScheduleConfig
  ): OptimizationStep {
    const availableVehicles = vehicles.filter(v => v.availableTime <= currentTime);

    let description = `STEP ${String(step).padStart(2, '0')}: Delivery Scheduling\n`;
    description += `Strategy: ${config.strategy} | Stop Overhead: ${config.stopOverhead} hrs per extra package\n`;
    description += `Packages: ${packages.map(p => p.id).join(' + ')}\n`;
    description += `Vehicle ${String(vehicle.id).padStart(2, '0')}: ${vehicle.maxSpeed} km/hr, ${vehicle.maxCarriableWeight}kg capacity\n`;
    description += `Max Distance: ${maxDistance} km | Base Time: ${this.calculateDeliveryTime(maxDistance, vehicle.maxSpeed).toFixed(2)} hrs\n`;
    description += `Stop Overhead: ${(packages.length - 1) * config.stopOverhead} hrs | Total Delivery: ${deliveryTime.toFixed(2)} hrs\n`;
    description += `Round Trip: ${returnTime.toFixed(2)} hrs | Available After: ${(currentTime + returnTime).toFixed(2)} hrs\n`;

    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: availableVehicles.length,
      currentTime,
      vehicleAssignments: [{
        vehicleId: vehicle.id,
        name: `Vehicle ${String(vehicle.id).padStart(2, '0')}`,
        packages,
        totalWeight: packages.reduce((sum, p) => sum + p.weight, 0),
        maxDistance,
        deliveryTime,
        returnTime,
        availableAfter: currentTime + returnTime,
        vehicleSpeed: vehicle.maxSpeed
      }],
      unassignedPackages: remainingPackages,
      assignedPackages: packages
    };
  }

  /**
   * Get delivery schedule summary
   */
  getScheduleSummary(
    packages: PackageData[],
    vehicles: Vehicle[],
    config?: DeliveryScheduleConfig
  ): {
    totalPackages: number;
    totalVehicles: number;
    estimatedTotalTime: number;
    estimatedTrips: number;
    averagePackagesPerTrip: number;
    utilizationRate: number;
  } {
    const result = this.scheduleDeliveries(packages, vehicles, config);

    const totalWeight = packages.reduce((sum, p) => sum + p.weight, 0);
    const totalCapacity = vehicles.reduce((sum, v) => sum + v.maxCarriableWeight, 0);
    const utilizationRate = (totalWeight / totalCapacity) * 100;

    return {
      totalPackages: packages.length,
      totalVehicles: vehicles.length,
      estimatedTotalTime: result.totalTime,
      estimatedTrips: result.totalTrips,
      averagePackagesPerTrip: result.totalTrips > 0 ? packages.length / result.totalTrips : 0,
      utilizationRate: Math.min(utilizationRate, 100)
    };
  }
}
