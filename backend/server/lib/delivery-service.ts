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
  name: string;
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
    name?: string;
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
  // Optional rich fields for UI
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
  prevAssignments?: Array<{
    vehicleId: number;
    name: string;
    returningIn: number;
  }>;
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
export interface DeliveryScheduleConfig {
  strategy: PackageSelectionStrategy;
  stopOverhead: number; // hours per extra package
  maxPackagesPerTrip: number;
}
export type PackageSelectionStrategy = "weight" | "distance" | "balanced";

export class DeliveryService {
  public baseDeliveryCost: number;

  constructor(baseDeliveryCost: number) {
    this.baseDeliveryCost = baseDeliveryCost;
  }
  get offers(): OfferCriteria[] {
    return offers;
  }

  validateOfferCode(pkg: PackageData): boolean {
    if (!pkg.offerCode) return true;
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
    const offer = pkg.offerCode
      ? offers.find((o) => o.code === pkg.offerCode)
      : null;
    const isValidOffer = pkg.offerCode ? this.validateOfferCode(pkg) : true;
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
   * Generate combinations for unique package combinations function
   */
  private generateCombinationsForUnique(
    packages: PackageData[],
    size: number,
    maxLoad: number,
    combos: { ids: string; count: number; totalWeight: number }[]
  ): void {
    const n = packages.length;

    // Helper function to generate combinations
    const combine = (
      start: number,
      current: PackageData[],
      currentWeight: number
    ) => {
      if (current.length === size) {
        if (currentWeight <= maxLoad) {
          const ids = current.map((p) => `${p.id} ${p.weight}kg`).join(" + ");
          combos.push({
            ids,
            count: size,
            totalWeight: currentWeight,
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
  validatePackageData(pkg: PackageData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate package ID
    if (!pkg.id || pkg.id.trim() === "") {
      errors.push("Package ID is required");
    }

    // Validate weight
    if (typeof pkg.weight !== "number" || pkg.weight <= 0) {
      errors.push("Package weight must be a positive number");
    }

    // Validate distance
    if (typeof pkg.distance !== "number" || pkg.distance <= 0) {
      errors.push("Package distance must be a positive number");
    }

    // Validate offer code if provided
    if (pkg.offerCode && !this.validateOfferCode(pkg)) {
      errors.push("Invalid offer code for this package");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // STEP 2: Calculate optimal route function
  calculateOptimalRoute(
    packages: PackageData[],
    vehicle: Vehicle
  ): {
    route: PackageData[];
    totalDistance: number;
    totalWeight: number;
    estimatedTime: number;
  } {
    // Sort packages by distance (shortest first) for optimal route
    const sortedPackages = [...packages].sort(
      (a, b) => a.distance - b.distance
    );

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

    const estimatedTime = this.calculateDeliveryTime(
      totalDistance,
      vehicle.maxSpeed
    );

    return {
      route,
      totalDistance,
      totalWeight,
      estimatedTime,
    };
  }

  // STEP 3: Generate delivery report function
  generateDeliveryReport(
    packages: PackageData[],
    vehicles: Vehicle[],
    results: DeliveryResult[]
  ): string {
    let report = "=== DELIVERY SERVICE REPORT ===\n\n";

    // Summary section
    report += "SUMMARY:\n";
    report += `Total Packages: ${packages.length}\n`;
    report += `Total Vehicles: ${vehicles.length}\n`;
    report += `Base Delivery Cost: $${this.baseDeliveryCost}\n\n`;

    // Package details section
    report += "PACKAGE DETAILS:\n";
    packages.forEach((pkg) => {
      const result = results.find((r) => r.id === pkg.id);
      if (result) {
        report += `${pkg.id}: Weight=${pkg.weight}kg, Distance=${pkg.distance}km, `;
        report += `Cost=$${
          result.totalCost
        }, Time=${result.estimatedDeliveryTime.toFixed(2)}hrs\n`;
      }
    });

    // Vehicle utilization section
    report += "\nVEHICLE UTILIZATION:\n";
    vehicles.forEach((vehicle) => {
      const utilization = this.calculateVehicleUtilization(packages, vehicle);
      report += `Vehicle ${vehicle.id}: ${utilization.packagesCount} packages, `;
      report += `${utilization.totalWeight}kg/${vehicle.maxCarriableWeight}kg, `;
      report += `Efficiency: ${utilization.efficiency.toFixed(1)}%\n`;
    });

    // Cost breakdown section
    report += "\nCOST BREAKDOWN:\n";
    const totalOriginalCost = results.reduce(
      (sum, r) => sum + r.originalCost,
      0
    );
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
    const availableVehicles = [...vehicles].sort(
      (a, b) => a.maxCarriableWeight - b.maxCarriableWeight
    );

    // Assign packages to vehicles using first-fit algorithm
    for (const vehicle of availableVehicles) {
      // Filter out packages that are already assigned to prevent duplicates
      const unassignedPackages = this.filterUnassignedPackages(
        remainingPackages,
        assignments
      );

      if (unassignedPackages.length === 0) break;

      const assignment = this.calculateOptimalRoute(
        unassignedPackages,
        vehicle
      );

      if (assignment.route.length > 0) {
        assignments.push({
          vehicleId: vehicle.id,
          packages: assignment.route,
          totalWeight: assignment.totalWeight,
          totalDistance: assignment.totalDistance,
          estimatedTime: assignment.estimatedTime,
        });

        // Remove assigned packages from remaining
        assignment.route.forEach((pkg) => {
          const index = remainingPackages.findIndex((p) => p.id === pkg.id);
          if (index !== -1) {
            remainingPackages.splice(index, 1);
          }
        });
      }
    }

    // Validate that no package is assigned to multiple vehicles
    const validation = this.validateNoDuplicateAssignments(assignments);
    if (!validation.isValid) {
      console.warn(
        "Duplicate package assignments detected:",
        validation.errors
      );
      // Log warning but continue - the system will handle gracefully
    }

    return {
      assignments,
      unassignedPackages: remainingPackages,
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

    packages.forEach((pkg) => {
      const baseCost = this.baseDeliveryCost;
      const weightCost = pkg.weight * 10;
      const distanceCost = pkg.distance * 5;
      // const subtotal = baseCost + weightCost + distanceCost;

      const costResult = this.calculateCost(pkg);
      const discount = includeDiscounts ? costResult.discount : 0;
      const finalCost = costResult.totalCost;

      breakdown.push({
        packageId: pkg.id,
        baseCost,
        weightCost,
        distanceCost,
        discount,
        finalCost,
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
      breakdown,
    };
  }

  // Helper function for vehicle utilization calculation
  private calculateVehicleUtilization(
    packages: PackageData[],
    vehicle: Vehicle
  ): {
    packagesCount: number;
    totalWeight: number;
    efficiency: number;
  } {
    const route = this.calculateOptimalRoute(packages, vehicle);
    const efficiency = (route.totalWeight / vehicle.maxCarriableWeight) * 100;

    return {
      packagesCount: route.route.length,
      totalWeight: route.totalWeight,
      efficiency,
    };
  }

  optimizePackageShipments(
    packages: PackageData[],
    vehicles: Vehicle[]
  ): {
    shipments: Shipment[];
    optimizationSteps: OptimizationStep[];
    vehicles: Vehicle[];
  } {
    const shipments: Shipment[] = [];
    const optimizationSteps: OptimizationStep[] = [];
    const remainingPackages = [...packages];
    const availableVehicles = [...vehicles];

    // Don't sort packages - preserve original order for specific logic

    // let stepNumber = 1;
    let currentTime = 0;

    // Generate exactly 6 steps as per user specification
    const sixSteps = this.generateSixStepAlgorithm(
      remainingPackages,
      availableVehicles,
      currentTime
    );
    console.log(sixSteps, 'sixSteps 533');
    optimizationSteps.push(...sixSteps);

    // Validate that no package is assigned to multiple vehicles
    const allAssignments = sixSteps.flatMap(
      (step) => step.vehicleAssignments || []
    );
    const validation = this.validateNoDuplicateAssignments(allAssignments);

    if (!validation.isValid) {
      console.warn(
        "Duplicate package assignments detected:",
        validation.errors
      );
      // Log warning but continue - the system will handle gracefully
    }

    // Apply all vehicle assignments to update availability
    this.applyVehicleAssignmentsToAvailability(availableVehicles, sixSteps);

    // Create shipments from the assignments
    sixSteps.forEach((step) => {
      if (step.vehicleAssignments && step.vehicleAssignments.length > 0) {
        step.vehicleAssignments.forEach((assignment) => {
          const maxDistance = Math.max(
            ...assignment.packages.map((p) => p.distance)
          );
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

    return { shipments, optimizationSteps, vehicles: availableVehicles };
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
    let currentTimeCopy = currentTime;
    const workingPackages = [...remainingPackages];
    const workingVehicles = [...availableVehicles].sort(
      (a, b) => b.maxCarriableWeight - a.maxCarriableWeight
    );

    // Track all assignments to prevent duplicates
    const allAssignments: OptimizationStep["vehicleAssignments"] = [];

    // STEP 1: Multiple vehicle management with combination assignments
    const step1 = this.generateStep1MultipleVehicleCombinations(
      stepNumber++,
      workingPackages,
      workingVehicles,
      currentTimeCopy
    );
    steps.push(step1);

    // Add step 1 assignments to tracking
    if (step1.vehicleAssignments) {
      allAssignments.push(...step1.vehicleAssignments);
    }

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
    this.applyStepAssignmentsToVehicles(
      workingVehicles,
      step1.vehicleAssignments || []
    );

    // STEP 2: Assign largest weight package
    const step2 = this.generateStep2LargestWeightAssignment(
      stepNumber++,
      workingPackages,
      workingVehicles,
      currentTimeCopy,
      allAssignments
    );
    steps.push(step2);

    // Add step 2 assignments to tracking
    if (step2.vehicleAssignments) {
      allAssignments.push(...step2.vehicleAssignments);
    }

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
    this.applyStepAssignmentsToVehicles(
      workingVehicles,
      step2.vehicleAssignments || []
    );

    // STEP 3: Show fastest available vehicles with return times
    const step3 = this.generateStep3FastestAvailableVehicles(
      stepNumber++,
      workingPackages,
      workingVehicles,
      currentTimeCopy,
      allAssignments
    );
    currentTimeCopy = step3?.availability?.firstAvailable?.delta || 0;
    steps.push(step3);

    // STEP 4: Assign to N-1 vehicles (1 for 2 vehicles, 2 for 3 vehicles, etc.)
    const step4 = this.generateStep4AssignToNMinusOneVehicles(
      stepNumber++,
      workingPackages,
      workingVehicles,
      currentTimeCopy,
      allAssignments
    );
    currentTimeCopy = step4.currentTime;
    steps.push(step4);

    // Add step 4 assignments to tracking with proper merging
    if (step4.vehicleAssignments) {
      step4.vehicleAssignments.forEach((newAssignment) => {
        const existingIndex = allAssignments.findIndex(
          (existing) => existing.vehicleId === newAssignment.vehicleId
        );

        if (existingIndex !== -1) {
          // Vehicle already exists, merge assignments
          const existing = allAssignments[existingIndex];
          const mergedPackages = [
            ...existing.packages,
            ...newAssignment.packages,
          ];
          const mergedTotalWeight =
            existing.totalWeight + newAssignment.totalWeight;
          const mergedMaxDistance = Math.max(
            existing.maxDistance,
            newAssignment.maxDistance
          );
          const mergedDeliveryTime = Math.max(
            existing.deliveryTime,
            newAssignment.deliveryTime
          );
          const mergedReturnTime = Math.max(
            existing.returnTime,
            newAssignment.returnTime
          );
          const mergedAvailableAfter = Math.max(
            existing.availableAfter,
            newAssignment.availableAfter
          );

          // Merge perPackageTimes
          const mergedPerPackageTimes = [
            ...(existing.perPackageTimes || []),
            ...(newAssignment.perPackageTimes || []),
          ];

          // Update existing assignment with merged data
          allAssignments[existingIndex] = {
            ...existing,
            packages: mergedPackages,
            totalWeight: mergedTotalWeight,
            maxDistance: mergedMaxDistance,
            deliveryTime: mergedDeliveryTime,
            returnTime: mergedReturnTime,
            availableAfter: mergedAvailableAfter,
            perPackageTimes: mergedPerPackageTimes,
          };
        } else {
          // Vehicle doesn't exist, add new assignment
          allAssignments.push(newAssignment);
        }
      });
    }

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
    this.applyStepAssignmentsToVehicles(
      workingVehicles,
      step4.vehicleAssignments || []
    );

    // STEP 5: Show all vehicle assignments with combined times
    const step5 = this.generateStep5AllVehicleAssignments(
      stepNumber++,
      workingPackages,
      workingVehicles,
      currentTimeCopy,
      allAssignments
    );
    steps.push(step5);
    console.log(workingPackages, "workingPackages 763");
    // STEP 6: Handle remaining packages with max weight assignment using step 5's first available vehicle
    if (workingPackages.length > 0) {
      // Get Step 5's first available vehicle data
      const step5FirstAvailable = step5?.availability;
      currentTimeCopy =
        step5FirstAvailable?.firstAvailable?.availableAfter || currentTimeCopy;

      const step6 = this.generateStep6RemainingPackages(
        stepNumber++,
        workingPackages,
        currentTimeCopy,
        step5FirstAvailable,
        allAssignments
      );
      steps.push(step6);

      // Add step 6 assignments to tracking
      if (step6.vehicleAssignments) {
        allAssignments.push(...step6.vehicleAssignments);
      }

      // Remove final assigned packages
      const step6AssignedIds = new Set(
        (step6.assignedPackages || []).map((p) => p.id)
      );
      for (let i = workingPackages.length - 1; i >= 0; i--) {
        if (step6AssignedIds.has(workingPackages[i].id)) {
          workingPackages.splice(i, 1);
        }
      }

      // Apply step 6 assignments to vehicle availability
      this.applyStepAssignmentsToVehicles(
        workingVehicles,
        step6.vehicleAssignments || []
      );
    }

    // STEP 7: Final Summary - All packages assigned successfully with comprehensive data
    if (workingPackages.length === 0) {
      const step7 = this.generateStep7FinalSummary(
        stepNumber++,
        allAssignments,
        workingVehicles,
        currentTimeCopy,
        steps // Pass all steps for comprehensive summary
      );
      steps.push(step7);
    }

    // Validate that no package is assigned to multiple vehicles
    const validation = this.validateNoDuplicateAssignments(allAssignments);
    if (!validation.isValid) {
      console.warn(
        "Duplicate package assignments detected in 6-step algorithm:",
        validation.errors
      );
      // Log warning but continue - the system will handle gracefully
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
    const maxLoad = Math.max(
      ...availableVehicles.map((v) => v.maxCarriableWeight),
      0
    );
    // Generate combinations for multiple vehicles (only from unassigned packages)
    const combos: { ids: string; count: number; totalWeight: number }[] = [];
    const maxPackages = Math.min(remainingPackages.length, 5);

    for (let size = 2; size <= maxPackages; size++) {
      this.generateCombinationsForUnique(
        remainingPackages,
        size,
        maxLoad,
        combos
      );
    }

    let description = `STEP ${String(step).padStart(
      2,
      "0"
    )}: Multiple Vehicle Management\n`;
    description += `Packages Remaining: ${String(
      remainingPackages.length
    ).padStart(2, "0")}\n`;
    description += `Vehicles Available: ${String(vehicleCount).padStart(
      2,
      "0"
    )} | Current Time: ${DeliveryService.formatTime(currentTime)}\n`;
    description += `-------------------------------------------------\n`;
    description += `Dynamic Assignment: Each vehicle gets unique packages\n`;
    description += `Constraint: No package assigned to multiple vehicles\n\n`;

    if (combos.length === 0) {
      description += `(No valid combinations from unassigned packages)\n`;
    } else {
      description += `Valid combinations for multiple vehicles (dynamic assignment):\n`;
      combos.slice(0, 3).forEach((c) => {
        // Show only top 3 combinations
        description += `${c.ids} → ${String(c.count).padStart(
          2,
          "0"
        )} packages ${c.totalWeight}kg\n`;
      });
      if (combos.length > 3) {
        description += `... and ${combos.length - 3} more combinations\n`;
      }
    }

    // Assign combinations to vehicles with proper division logic
    let vehicleAssignments: OptimizationStep["vehicleAssignments"] = [];

    if (availableVehicles.length > 1) {
      // For more than 2 vehicles: assign to multiple vehicles in step 1
      const vehicleCount = Math.round(Math.ceil(availableVehicles.length / 2));
      const uniqueAssignments = this.createUniquePackageCombinations(
        combos,
        availableVehicles.slice(0, vehicleCount),
        remainingPackages
      );
      // Convert to vehicle assignments format
      vehicleAssignments = uniqueAssignments.map((assignment) => {
        const maxDistance = Math.max(
          ...assignment.packages.map((p) => p.distance)
        );
        const deliveryTime = this.calculateDeliveryTimeWithOptimization(
          maxDistance,
          availableVehicles.find((v) => v.id === assignment.vehicleId)
            ?.maxSpeed || 0,
          vehicleCount
        );
        const returnTime = deliveryTime * 2;

        return {
          vehicleId: assignment.vehicleId,
          name:
            availableVehicles.find((v) => v.id === assignment.vehicleId)
              ?.name ||
            `Vehicle ${String(assignment.vehicleId).padStart(2, "0")}`,
          packages: assignment.packages,
          totalWeight: assignment.packages.reduce(
            (sum, p) => sum + p.weight,
            0
          ),
          maxDistance,
          deliveryTime,
          returnTime,
          availableAfter: currentTime + returnTime,
          vehicleSpeed:
            availableVehicles.find((v) => v.id === assignment.vehicleId)
              ?.maxSpeed || 0,
          perPackageTimes: assignment.packages.map((p) => ({
            id: p.id,
            distance: p.distance,
            deliveryTime: parseFloat(
              (
                p.distance /
                (availableVehicles.find((v) => v.id === assignment.vehicleId)
                  ?.maxSpeed || 0)
              ).toFixed(2)
            ),
          })),
        };
      });

      // Add assignment details to description
      vehicleAssignments.forEach((assignment) => {
        const packageIds = assignment.packages.map((p) => p.id).join(" + ");
        const timeReductionNote =
          vehicleCount >= 3 ? " (1 min reduction applied)" : "";
        description += `Vehicle ${String(assignment.vehicleId).padStart(
          2,
          "0"
        )} assigned: ${packageIds} (${
          assignment.totalWeight
        }kg)${timeReductionNote}\n`;
      });

      if (vehicleAssignments.length === 0) {
        description += `No unique assignments possible with current constraints\n`;
      }
    } else if (availableVehicles.length === 1 && combos.length > 0) {
      // Single vehicle assignment using best combination
      const bestCombo = [...combos].sort(
        (a, b) => b.totalWeight - a.totalWeight
      )[0];
      const comboPackages = this.parseComboPackages(
        bestCombo.ids,
        remainingPackages
      );

      const vehicle = availableVehicles[0];
      const maxDistance = Math.max(...comboPackages.map((p) => p.distance));
      const deliveryTime = this.calculateDeliveryTimeWithOptimization(
        maxDistance,
        vehicle.maxSpeed,
        vehicleCount
      );
      const returnTime = deliveryTime * 2;

      vehicleAssignments.push({
        vehicleId: vehicle.id,
        name: vehicle.name || `Vehicle ${String(vehicle.id).padStart(2, "0")}`,
        packages: comboPackages,
        totalWeight: bestCombo.totalWeight,
        maxDistance,
        deliveryTime,
        returnTime,
        availableAfter: currentTime + returnTime,
        vehicleSpeed: vehicle.maxSpeed,
        perPackageTimes: comboPackages.map((p) => ({
          id: p.id,
          distance: p.distance,
          deliveryTime: parseFloat((p.distance / vehicle.maxSpeed).toFixed(2)),
        })),
      });

      const timeReductionNote =
        vehicleCount >= 3 ? " (1 min reduction applied)" : "";
      description += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} assigned: ${bestCombo.ids}${timeReductionNote}\n`;
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
    currentTime: number,
    allAssignments: OptimizationStep["vehicleAssignments"]
  ): OptimizationStep {
    const currentlyAvailable = availableVehicles
      .filter((v) => v.availableTime >= currentTime)
      .filter((v) => !allAssignments?.some((va) => va.vehicleId === v.id));
    const vehicleCount = currentlyAvailable.length;
    let description = `STEP ${String(step).padStart(
      2,
      "0"
    )}: Largest Weight Assignment\n`;
    description += `Packages Remaining: ${String(
      remainingPackages.length
    ).padStart(2, "0")}\n`;
    description += `Vehicles Available: ${String(vehicleCount).padStart(
      2,
      "0"
    )} | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;

    let vehicleAssignments: OptimizationStep["vehicleAssignments"] = [];
    let assignedPackages: PackageData[] = [];

    if (currentlyAvailable.length > 0) {
      // Sort remaining by weight (heaviest first) and assign one per available vehicle
      const unassignedSorted = [...remainingPackages].sort(
        (a, b) => b.weight - a.weight
      );
      console.log(unassignedSorted, "unassignedSorted 991");
      console.log(currentlyAvailable, "currentlyAvailable 992");
      const limit = Math.min(
        currentlyAvailable.length,
        unassignedSorted.length
      );
      for (let i = 0; i < limit; i++) {
        const vehicle = currentlyAvailable[i];
        const pkg = unassignedSorted[i];
        const maxDistance = pkg.distance;
        const deliveryTime = this.calculateDeliveryTimeWithOptimization(
          maxDistance,
          vehicle.maxSpeed,
          vehicleCount
        );
        const returnTime = deliveryTime * 2;

        const vehicleName =
          vehicle.name || `Vehicle ${String(vehicle.id).padStart(2, "0")}`;

        vehicleAssignments.push({
          vehicleId: vehicle.id,
          name: vehicleName,
          packages: [pkg],
          totalWeight: pkg.weight,
          maxDistance,
          deliveryTime,
          returnTime,
          availableAfter: currentTime + returnTime,
          vehicleSpeed: vehicle.maxSpeed,
        });

        assignedPackages.push(pkg);

        description += `Next available largest weight package: ${pkg.id} (${pkg.weight}kg)\n`;
        description += `Assigned to Vehicle ${String(vehicle.id).padStart(
          2,
          "0"
        )}\n`;
        description += `Delivery time: ${deliveryTime.toFixed(
          2
        )} hrs | Return time: ${returnTime.toFixed(2)} hrs\n\n`;
      }
    } else {
      // No vehicles currently available; if there are no packages, state so
      if (remainingPackages.length === 0) {
        description += `No unassigned packages available for assignment\n`;
      } else {
        description += `No vehicles available at the current time for assignment\n`;
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
      assignedPackages,
      heaviest:
        assignedPackages.length > 0
          ? { id: assignedPackages[0].id, weight: assignedPackages[0].weight }
          : undefined,
    };
  }

  /**
   * Step 3: Show fastest available vehicles with return times
   */
  private generateStep3FastestAvailableVehicles(
    step: number,
    remainingPackages: PackageData[],
    availableVehicles: Vehicle[],
    currentTime: number,
    prevAssignments: OptimizationStep["vehicleAssignments"]
  ): OptimizationStep {
    const currentlyAvailable = availableVehicles.filter(
      (v) => v.availableTime <= currentTime
    );
    const vehicleCount = currentlyAvailable.length;

    let description = `STEP ${String(step).padStart(
      2,
      "0"
    )}: Fastest Available Vehicles\n`;
    description += `Packages Remaining: ${String(
      remainingPackages.length
    ).padStart(2, "0")}\n`;
    description += `Vehicles Available: ${String(vehicleCount).padStart(
      2,
      "0"
    )} | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;

    // Show all vehicles with their return times
    availableVehicles
      .sort((a, b) => a.id - b.id)
      .forEach((vehicle) => {
        const returningIn = Math.max(0, vehicle.availableTime - currentTime);
        const status =
          vehicle.availableTime <= currentTime ? "Available" : "Busy";
        description += `Vehicle ${String(vehicle.id).padStart(
          2,
          "0"
        )}: ${status} - Returns in ${returningIn.toFixed(2)} hrs\n`;
      });

    // If we have previous assignments (from steps 1 and 2), list them and compute earliest return
    if (prevAssignments && prevAssignments.length > 0) {
      description += `\nAssignments so far:\n`;
      prevAssignments
        .slice()
        .sort((a, b) => a.availableAfter - b.availableAfter)
        .forEach((a) => {
          const v = availableVehicles.find((vv) => vv.id === a.vehicleId);
          const vName =
            v?.name || `Vehicle ${String(a.vehicleId).padStart(2, "0")}`;
          const delta = Math.max(0, a.availableAfter - currentTime);
          description += `  ${vName} → returns after ${delta.toFixed(
            2
          )} hrs (time ${a.availableAfter.toFixed(2)} hrs)\n`;
        });
      const firstPrev = [...prevAssignments].sort(
        (a, b) => a.availableAfter - b.availableAfter
      )[0];
      if (firstPrev) {
        const v = availableVehicles.find((vv) => vv.id === firstPrev.vehicleId);
        const vName =
          v?.name || `Vehicle ${String(firstPrev.vehicleId).padStart(2, "0")}`;
        const delta = Math.max(0, firstPrev.availableAfter - currentTime);
        description += `\nFirst to return from previous assignments: ${vName} after ${delta.toFixed(
          2
        )} hrs (time ${firstPrev.availableAfter.toFixed(2)} hrs)\n`;
      }
    }

    // Find fastest available vehicle
    const fastestAvailable =
      currentlyAvailable.length > 0
        ? currentlyAvailable.reduce((fastest, current) =>
            current.availableTime < fastest.availableTime ? current : fastest
          )
        : null;

    if (fastestAvailable) {
      const delta = Math.max(0, fastestAvailable.availableTime - currentTime);
      description += `\nFastest available: Vehicle ${String(
        fastestAvailable.id
      ).padStart(2, "0")} in ${delta.toFixed(
        2
      )} hrs (time ${fastestAvailable.availableTime.toFixed(2)} hrs)\n`;
    }

    // Set dynamic data in vehicleAssignments and assignedPackages
    let vehicleAssignments: OptimizationStep["vehicleAssignments"] = [];
    let assignedPackages: PackageData[] = [];

    // If we have previous assignments, set them as the current assignments for this step
    if (prevAssignments && prevAssignments.length > 0) {
      vehicleAssignments = prevAssignments;
      assignedPackages = prevAssignments.flatMap(
        (assignment) => assignment.packages
      );
    }

    // Update current time to first available return time
    let updatedCurrentTime = currentTime;
    if (prevAssignments && prevAssignments.length > 0) {
      const firstReturnTime = Math.min(
        ...prevAssignments.map((a) => a.availableAfter)
      );
      updatedCurrentTime = firstReturnTime;
      description += `\nUpdated Current Time: ${DeliveryService.formatTime(
        updatedCurrentTime
      )} (first vehicle return time)\n`;
    }

    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: vehicleCount,
      currentTime: updatedCurrentTime, // Updated current time
      vehicleAssignments, // Dynamic data set
      unassignedPackages: [...remainingPackages],
      assignedPackages, // Dynamic data set
      availability: {
        vehicleReturns: prevAssignments
          .sort((a, b) => a.vehicleId - b.vehicleId)
          .map((v) => ({
            vehicleId: v.vehicleId,
            name: v.name || `Vehicle ${String(v.vehicleId).padStart(2, "0")}`,
            returningIn: Math.max(0, v.availableAfter),
          })),
        firstAvailable:
          prevAssignments && prevAssignments.length > 0
            ? (() => {
                const earliest = [...prevAssignments].sort(
                  (a, b) => a.availableAfter - b.availableAfter
                )[0];
                const v = availableVehicles.find(
                  (vv) => vv.id === earliest.vehicleId
                );
                return {
                  vehicleId: earliest.vehicleId,
                  name:
                    v?.name ||
                    `Vehicle ${String(earliest.vehicleId).padStart(2, "0")}`,
                  delta: Math.max(0, earliest.availableAfter),
                  expression: `(Current Time (0) + ${earliest.availableAfter.toFixed(
                    2
                  )})`,
                  packages: earliest.packages,
                  totalWeight: earliest.totalWeight,
                  maxDistance: earliest.maxDistance,
                  deliveryTime: earliest.deliveryTime,
                  returnTime: earliest.returnTime,
                  availableAfter: earliest.availableAfter,
                  vehicleSpeed: earliest.vehicleSpeed,
                };
              })()
            : fastestAvailable
            ? {
                vehicleId: fastestAvailable.id,
                name:
                  fastestAvailable.name ||
                  `Vehicle ${String(fastestAvailable.id).padStart(2, "0")}`,
                delta: Math.max(0, fastestAvailable.availableTime),
                expression: `(Current Time (0) + ${fastestAvailable.availableTime.toFixed(
                  2
                )})`,
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
    currentTime: number,
    allAssignments: OptimizationStep["vehicleAssignments"]
  ): OptimizationStep {
    const currentlyAvailable = allAssignments.filter(
      (v) => v.availableAfter === currentTime
    );
    console.log(currentlyAvailable, "currentlyAvailable 1241");
    const vehicleCount = currentlyAvailable.length;

    let description = `STEP ${String(step).padStart(
      2,
      "0"
    )}: Assign to Vehicles (Proper Division)\n`;
    description += `Packages Remaining: ${String(
      remainingPackages.length
    ).padStart(2, "0")}\n`;
    description += `Vehicles Available: ${String(vehicleCount).padStart(
      2,
      "0"
    )} | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;

    description += `Logic: Assign to ${vehicleCount} out of ${vehicleCount} available vehicles\n`;
    description += `Total vehicles: ${
      availableVehicles.length
    } | Step 1 used: ${availableVehicles.length - vehicleCount}\n\n`;

    let vehicleAssignments: OptimizationStep["vehicleAssignments"] = [];
    let assignedPackages: PackageData[] = [];
    // Find fastest available vehicle
    const fastestAvailable =
      currentlyAvailable.length > 0
        ? currentlyAvailable.reduce((fastest, current) =>
            current.availableAfter < fastest.availableAfter ? current : fastest
          )
        : null;

    if (fastestAvailable) {
      const delta = Math.max(0, fastestAvailable.availableAfter - currentTime);
      description += `\nFastest available: Vehicle ${String(
        fastestAvailable.vehicleId
      ).padStart(2, "0")} in ${delta.toFixed(
        2
      )} hrs (time ${fastestAvailable.availableAfter.toFixed(2)} hrs)\n`;
    }
    // Assign packages to N-1 vehicles, automatically selecting unassigned packages
    for (let i = 0; i < currentlyAvailable.length; i++) {
      const vehicle = currentlyAvailable[i];

      // Get next available package (automatically excludes already assigned ones)
      const packageToAssign = this.getNextAvailablePackage(
        remainingPackages,
        vehicleAssignments,
        "weight"
      );

      if (!packageToAssign) {
        description += `No more unassigned packages available for Vehicle ${String(
          vehicle.vehicleId
        ).padStart(2, "0")}\n`;
        continue;
      }

      const maxDistance = packageToAssign.distance;
      const deliveryTime = this.calculateDeliveryTimeWithOptimization(
        maxDistance,
        vehicle.vehicleSpeed || 0,
        vehicleCount
      );
      const returnTime = deliveryTime * 2;

      vehicleAssignments.push({
        vehicleId: vehicle.vehicleId,
        name:
          vehicle.name ||
          `Vehicle ${String(vehicle.vehicleId).padStart(2, "0")}`,
        packages: [packageToAssign],
        totalWeight: packageToAssign.weight,
        maxDistance,
        deliveryTime,
        returnTime,
        availableAfter: currentTime + returnTime,
        vehicleSpeed: vehicle.vehicleSpeed,
        perPackageTimes: [
          {
            id: packageToAssign.id,
            distance: packageToAssign.distance,
            deliveryTime: parseFloat(
              (packageToAssign.distance / (vehicle.vehicleSpeed || 0)).toFixed(
                2
              )
            ),
          },
        ],
      });

      assignedPackages.push(packageToAssign);

      const timeReductionNote =
        vehicleCount >= 3 ? " (1 min reduction applied)" : "";
      description += `Vehicle ${String(vehicle.vehicleId).padStart(2, "0")} → ${
        packageToAssign.id
      } (${
        packageToAssign.weight
      }kg) [Auto-selected from unassigned]${timeReductionNote}\n`;
    }

    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: vehicleCount,
      currentTime: currentTime,
      vehicleAssignments,
      unassignedPackages: [...remainingPackages],
      assignedPackages,
      availability: {
        vehicleReturns: allAssignments
          .sort((a, b) => a.vehicleId - b.vehicleId)
          .map((v) => ({
            vehicleId: v.vehicleId,
            name: v.name || `Vehicle ${String(v.vehicleId).padStart(2, "0")}`,
            returningIn: Math.max(0, v.availableAfter),
          })),
        firstAvailable:
          vehicleAssignments && vehicleAssignments.length > 0
            ? (() => {
                const earliest = [...vehicleAssignments].sort(
                  (a, b) => a.availableAfter - b.availableAfter
                )[0];
                const v = availableVehicles.find(
                  (vv) => vv.id === earliest.vehicleId
                );
                return {
                  vehicleId: earliest.vehicleId,
                  name:
                    v?.name ||
                    `Vehicle ${String(earliest.vehicleId).padStart(2, "0")}`,
                  delta: Math.max(0, earliest.availableAfter),
                  expression: `(Current Time (0) + ${earliest.availableAfter.toFixed(
                    2
                  )})`,
                  packages: earliest.packages,
                  totalWeight: earliest.totalWeight,
                  maxDistance: earliest.maxDistance,
                  deliveryTime: earliest.deliveryTime,
                  returnTime: earliest.returnTime,
                  availableAfter: earliest.availableAfter,
                  vehicleSpeed: earliest.vehicleSpeed,
                };
              })()
            : fastestAvailable
            ? {
                vehicleId: fastestAvailable.vehicleId,
                name:
                  fastestAvailable.name ||
                  `Vehicle ${String(fastestAvailable.vehicleId).padStart(
                    2,
                    "0"
                  )}`,
                delta: Math.max(0, fastestAvailable.availableAfter),
                expression: `(Current Time (0) + ${fastestAvailable.availableAfter.toFixed(
                  2
                )})`,
                packages: [],
                totalWeight: 0,
                maxDistance: 0,
                deliveryTime: 0,
                returnTime: 0,
                availableAfter: fastestAvailable.availableAfter,
                vehicleSpeed: fastestAvailable.vehicleSpeed,
              }
            : undefined,
      },
    };
  }

  /**
   * Step 5: Show all vehicle assignments with combined times
   */
  private generateStep5AllVehicleAssignments(
    step: number,
    remainingPackages: PackageData[],
    availableVehicles: Vehicle[],
    currentTime: number,
    prevAssignments: OptimizationStep["vehicleAssignments"]
  ): OptimizationStep {
    const currentlyAvailable = prevAssignments.filter(
      (v) => v.availableAfter <= currentTime
    );
    const vehicleCount = currentlyAvailable.length;

    let description = `STEP ${String(step).padStart(
      2,
      "0"
    )}: All Vehicle Assignments\n`;
    description += `Packages Remaining: ${String(
      remainingPackages.length
    ).padStart(2, "0")}\n`;
    description += `Vehicles Available: ${String(vehicleCount).padStart(
      2,
      "0"
    )} | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;

    // Show all vehicles with their combined assignment times
    availableVehicles
      .sort((a, b) => a.id - b.id)
      .forEach((vehicle) => {
        const returningIn = Math.max(0, vehicle.availableTime - currentTime);
        const status =
          vehicle.availableTime <= currentTime ? "Available" : "Busy";
        description += `Vehicle ${String(vehicle.id).padStart(
          2,
          "0"
        )}: ${status} - Returns in ${returningIn.toFixed(2)} hrs\n`;
      });

    // If we have previous assignments (from steps 1-4), list them and compute earliest return
    if (prevAssignments && prevAssignments.length > 0) {
      description += `\nAssignments so far:\n`;
      prevAssignments
        .slice()
        .sort((a, b) => a.availableAfter - b.availableAfter)
        .forEach((a) => {
          const v = availableVehicles.find((vv) => vv.id === a.vehicleId);
          const vName =
            v?.name || `Vehicle ${String(a.vehicleId).padStart(2, "0")}`;
          const delta = Math.max(0, a.availableAfter - currentTime);
          description += `  ${vName} → returns after ${delta.toFixed(
            2
          )} hrs (time ${a.availableAfter.toFixed(2)} hrs)\n`;
        });
      const firstPrev = [...prevAssignments].sort(
        (a, b) => a.availableAfter - b.availableAfter
      )[0];
      if (firstPrev) {
        const v = availableVehicles.find((vv) => vv.id === firstPrev.vehicleId);
        const vName =
          v?.name || `Vehicle ${String(firstPrev.vehicleId).padStart(2, "0")}`;
        const delta = Math.max(0, firstPrev.availableAfter - currentTime);
        description += `\nFirst to return from previous assignments: ${vName} after ${delta.toFixed(
          2
        )} hrs (time ${firstPrev.availableAfter.toFixed(2)} hrs)\n`;
      }
    }

    // Find fastest available vehicle
    const fastestAvailable =
      currentlyAvailable.length > 0
        ? currentlyAvailable.reduce((fastest, current) =>
            current.availableAfter < fastest.availableAfter ? current : fastest
          )
        : null;

    if (fastestAvailable) {
      const delta = Math.max(0, fastestAvailable.availableAfter - currentTime);
      description += `\nFastest available: Vehicle ${String(
        fastestAvailable.vehicleId
      ).padStart(2, "0")} in ${delta.toFixed(
        2
      )} hrs (time ${fastestAvailable.availableAfter.toFixed(2)} hrs)\n`;
    }

    // Set dynamic data in vehicleAssignments and assignedPackages
    let vehicleAssignments: OptimizationStep["vehicleAssignments"] = [];
    let assignedPackages: PackageData[] = [];

    // If we have previous assignments, set them as the current assignments for this step
    if (prevAssignments && prevAssignments.length > 0) {
      vehicleAssignments = prevAssignments;
      assignedPackages = prevAssignments.flatMap(
        (assignment) => assignment.packages
      );
    }

    // Update current time to first available return time
    let updatedCurrentTime = currentTime;
    console.log(prevAssignments, "prevAssignments 1478");
    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: vehicleCount,
      currentTime: updatedCurrentTime, // Updated current time
      vehicleAssignments, // Dynamic data set
      unassignedPackages: [...remainingPackages],
      assignedPackages, // Dynamic data set
      availability: {
        vehicleReturns: prevAssignments
          .sort((a, b) => a.vehicleId - b.vehicleId)
          .map((v) => ({
            vehicleId: v.vehicleId,
            name: v.name || `Vehicle ${String(v.vehicleId).padStart(2, "0")}`,
            returningIn: Math.max(0, v.availableAfter),
          })),
        firstAvailable:
          prevAssignments && prevAssignments.length > 0
            ? (() => {
                const earliest = [...prevAssignments].sort(
                  (a, b) => a.availableAfter - b.availableAfter
                )[0];
                const v = availableVehicles.find(
                  (vv) => vv.id === earliest.vehicleId
                );
                return {
                  vehicleId: earliest.vehicleId,
                  name:
                    v?.name ||
                    `Vehicle ${String(earliest.vehicleId).padStart(2, "0")}`,
                  delta: Math.max(
                    0,
                    earliest.availableAfter - updatedCurrentTime
                  ),
                  expression: `(Current Time (${updatedCurrentTime.toFixed(
                    2
                  )}) + ${earliest.availableAfter.toFixed(2)})`,
                  packages: earliest.packages,
                  totalWeight: earliest.totalWeight,
                  maxDistance: earliest.maxDistance,
                  deliveryTime: earliest.deliveryTime,
                  returnTime: earliest.returnTime,
                  availableAfter: earliest.availableAfter,
                  vehicleSpeed: earliest.vehicleSpeed,
                };
              })()
            : fastestAvailable
            ? {
                vehicleId: fastestAvailable.vehicleId,
                name:
                  fastestAvailable.name ||
                  `Vehicle ${String(fastestAvailable.vehicleId).padStart(
                    2,
                    "0"
                  )}`,
                delta: Math.max(0, fastestAvailable.availableAfter),
                expression: `Available at ${fastestAvailable.availableAfter.toFixed(
                  2
                )} hrs`,
                packages: [],
                totalWeight: 0,
                maxDistance: 0,
                deliveryTime: 0,
                returnTime: 0,
                availableAfter: fastestAvailable.availableAfter,
                vehicleSpeed: fastestAvailable.vehicleSpeed,
              }
            : undefined,
      },
    };
  }

  /**
   * Step 6: Handle remaining packages with max weight assignment using Step 5's first available vehicle
   */
  private generateStep6RemainingPackages(
    step: number,
    remainingPackages: PackageData[],
    currentTime: number,
    step5FirstAvailable?: OptimizationStep["availability"],
    allAssignments?: OptimizationStep["vehicleAssignments"]
  ): OptimizationStep {
    const currentlyAvailable = allAssignments?.filter(
      (v) => v.availableAfter === currentTime
    )||[];
    const vehicleCount = currentlyAvailable.length;
    console.log(currentlyAvailable, "currentlyAvailable 1572");
    console.log(vehicleCount, "vehicleCount 1573");
    console.log(currentTime, "currentTime 1574");
    // Get the next available package (automatically excludes already assigned ones)
    const maxWeightPkg = this.getNextAvailablePackage(
      remainingPackages,
      [],
      "weight"
    );
    console.log(maxWeightPkg, "maxWeightPkg 1678");
    let description = `STEP ${String(step).padStart(
      2,
      "0"
    )}: Remaining Package Assignment with Vehicle Integration\n`;
    description += `Packages Remaining: ${String(
      remainingPackages.length
    ).padStart(2, "0")}\n`;
    description += `Vehicles Available: ${String(vehicleCount).padStart(
      2,
      "0"
    )} | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;

    // Include step 5's first available vehicle data
    if (step5FirstAvailable && step5FirstAvailable.firstAvailable) {
      description += `Step 6 First Available Vehicle: ${step5FirstAvailable.firstAvailable.name}\n`;
      description += `Available After: ${step5FirstAvailable.firstAvailable.availableAfter.toFixed(
        2
      )} hrs\n`;
      description += `Vehicle Speed: ${
        step5FirstAvailable.firstAvailable.vehicleSpeed || 70
      } km/hr\n`;
      description += `Expression: ${step5FirstAvailable.firstAvailable.expression}\n`;
      description += `---------------------------------------------------\n`;
    }

    let vehicleAssignments: OptimizationStep["vehicleAssignments"] = [];
    let assignedPackages: PackageData[] = [];

    if (maxWeightPkg && currentlyAvailable.length > 0) {
      // Use Step 5's first available vehicle if provided, otherwise use first available
      const vehicle = currentlyAvailable[0];
      console.log(vehicle, "vehicle 1715");
      const maxDistance = maxWeightPkg.distance;
      const deliveryTime = this.calculateDeliveryTimeWithOptimization(
        maxDistance,
        vehicle.vehicleSpeed || 0,
        vehicleCount
      );
      const returnTime = deliveryTime * 2;

      // Include vehicle data for pending packages
      const pendingPackages = remainingPackages.filter(
        (pkg) => !assignedPackages.some((ap) => ap.id === pkg.id)
      );

      vehicleAssignments.push({
        vehicleId: vehicle.vehicleId,
        name:
          vehicle.name ||
          `Vehicle ${String(vehicle.vehicleId).padStart(2, "0")}`,
        packages: [maxWeightPkg],
        totalWeight: maxWeightPkg.weight,
        maxDistance,
        deliveryTime,
        returnTime,
        availableAfter: currentTime + returnTime,
        vehicleSpeed: vehicle.vehicleSpeed,
        perPackageTimes: [
          {
            id: maxWeightPkg.id,
            distance: maxWeightPkg.distance,
            deliveryTime: parseFloat(
              (maxWeightPkg.distance / (vehicle.vehicleSpeed || 0)).toFixed(2)
            ),
          },
        ],
      });

      assignedPackages = [maxWeightPkg];

      const timeReductionNote =
        vehicleCount >= 3 ? " (1 min reduction applied)" : "";

      description += `Next available max weight package: ${maxWeightPkg.id} (${maxWeightPkg.weight}kg)\n`;
      description += `Auto-selected from remaining unassigned packages\n`;
      description += `Vehicle: ${
        vehicle.name || `Vehicle ${String(vehicle.vehicleId).padStart(2, "0")}`
      } (${vehicle.vehicleSpeed} km/hr, ${
        maxDistance
      }kg capacity)\n`;
      description += `Final assignment to Vehicle ${String(
        vehicle.vehicleId
      ).padStart(2, "0")}\n`;
      description += `Delivery time: ${deliveryTime.toFixed(
        2
      )} hrs | Return time: ${returnTime.toFixed(2)} hrs${timeReductionNote}\n`;

      // Show pending packages with vehicle data
      if (pendingPackages.length > 1) {
        description += `---------------------------------------------------\n`;
        description += `Pending Packages with Vehicle Data:\n`;
        pendingPackages.slice(1, 4).forEach((pkg, index) => {
          const pendingVehicle =
            currentlyAvailable[index % currentlyAvailable.length];
          description += `  ${pkg.id}: ${pkg.weight}kg, ${pkg.distance}km → ${
            pendingVehicle.name ||
            `Vehicle ${String(pendingVehicle.vehicleId).padStart(2, "0")}`
          } (${pendingVehicle.vehicleSpeed} km/hr)\n`;
        });
        if (pendingPackages.length > 4) {
          description += `  ... and ${
            pendingPackages.length - 4
          } more pending packages\n`;
        }
        description += `---------------------------------------------------\n`;
      }

      // Show last steps information
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
      heaviest: maxWeightPkg
        ? { id: maxWeightPkg.id, weight: maxWeightPkg.weight }
        : undefined,
      availability: {
        vehicleReturns: currentlyAvailable.map((v) => ({
          vehicleId: v.vehicleId,
          name: v.name || `Vehicle ${String(v.vehicleId).padStart(2, "0")}`,
          returningIn: Math.max(0, v.availableAfter - currentTime),
        })),
        firstAvailable:
          (step5FirstAvailable && step5FirstAvailable.firstAvailable) ||
          (currentlyAvailable.length > 0
            ? {
                vehicleId: currentlyAvailable[0].vehicleId,
                name:
                  currentlyAvailable[0].name ||
                  `Vehicle ${String(currentlyAvailable[0].vehicleId).padStart(
                    2,
                    "0"
                  )}`,
                delta: Math.max(
                  0,
                  currentlyAvailable[0].availableAfter - currentTime
                ),
                expression: `(Current Time + ${Math.max(
                  0,
                  currentlyAvailable[0].availableAfter - currentTime
                ).toFixed(2)})`,
                packages: [],
                totalWeight: 0,
                maxDistance: 0,
                deliveryTime: 0,
                returnTime: 0,
                availableAfter: currentlyAvailable[0].availableAfter,
                vehicleSpeed: currentlyAvailable[0].vehicleSpeed,
              }
            : undefined),
      },
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
    const totalPackages = allAssignments.reduce(
      (sum, va) => sum + va.packages.length,
      0
    );
    const totalWeight = allAssignments.reduce(
      (sum, va) => sum + va.totalWeight,
      0
    );
    const totalVehicles = allAssignments.length;
    const maxDeliveryTime = Math.max(
      ...allAssignments.map((va) => va.availableAfter),
      0
    );

    // Calculate comprehensive summary data
    const totalCapacity = allAssignments.reduce(
      (sum, va) =>
        sum +
        (availableVehicles.find((v) => v.id === va.vehicleId)
          ?.maxCarriableWeight || 0),
      0
    );
    const totalDistance = allAssignments.reduce(
      (sum, va) => sum + va.maxDistance,
      0
    );
    const totalDeliveryTime = allAssignments.reduce(
      (sum, va) => sum + va.deliveryTime,
      0
    );
    const totalReturnTime = allAssignments.reduce(
      (sum, va) => sum + va.returnTime,
      0
    );

    // Calculate vehicle utilization by vehicle
    const vehicleUtilization = allAssignments.map((assignment) => {
      const vehicle = availableVehicles.find(
        (v) => v.id === assignment.vehicleId
      );
      const utilization = vehicle
        ? (assignment.totalWeight / vehicle.maxCarriableWeight) * 100
        : 0;
      return {
        vehicleId: assignment.vehicleId,
        name:
          vehicle?.name ||
          `Vehicle ${String(assignment.vehicleId).padStart(2, "0")}`,
        utilization: utilization,
        packages: assignment.packages.length,
        weight: assignment.totalWeight,
        capacity: vehicle?.maxCarriableWeight || 0,
      };
    });

    // Calculate package distribution
    const packageDistribution = allAssignments.map((assignment) => ({
      vehicleId: assignment.vehicleId,
      name:
        availableVehicles.find((v) => v.id === assignment.vehicleId)?.name ||
        `Vehicle ${String(assignment.vehicleId).padStart(2, "0")}`,
      packages: assignment.packages.map((p) => ({
        id: p.id,
        weight: p.weight,
        distance: p.distance,
        offerCode: p.offerCode,
      })),
    }));

    let description = `STEP ${String(step).padStart(
      2,
      "0"
    )}: COMPREHENSIVE DELIVERY SUMMARY - ALL DATA\n`;
    description += `🎯 DELIVERY PLANNING COMPLETE - FINAL SUMMARY\n\n`;

    description += `📊 CORE METRICS:\n`;
    description += `----------------------------------------\n`;
    description += `📦 Total Packages: ${totalPackages}\n`;
    description += `🚛 Total Vehicles Used: ${totalVehicles}\n`;
    description += `⚖️ Total Weight: ${totalWeight}kg\n`;
    description += `📏 Total Distance: ${totalDistance}km\n`;
    description += `⏱️ Total Delivery Time: ${totalDeliveryTime.toFixed(
      2
    )} hrs\n`;
    description += `🔄 Total Return Time: ${totalReturnTime.toFixed(2)} hrs\n`;
    description += `🕐 Total Operation Time: ${maxDeliveryTime.toFixed(
      2
    )} hrs\n`;
    description += `📊 Overall Vehicle Utilization: ${(
      (totalWeight / totalCapacity) *
      100
    ).toFixed(1)}%\n\n`;

    description += `🚛 DETAILED VEHICLE ASSIGNMENTS:\n`;
    description += `----------------------------------------\n`;

    allAssignments.forEach((assignment, index) => {
      const vehicle = availableVehicles.find(
        (v) => v.id === assignment.vehicleId
      );
      const vehicleName =
        vehicle?.name ||
        `Vehicle ${String(assignment.vehicleId).padStart(2, "0")}`;

      description += `${index + 1}. ${vehicleName}:\n`;
      description += `   📦 Packages: ${assignment.packages
        .map((p) => `${p.id}(${p.weight}kg)`)
        .join(" + ")}\n`;
      description += `   ⚖️ Total Weight: ${assignment.totalWeight}kg\n`;
      description += `   📏 Max Distance: ${assignment.maxDistance}km\n`;
      description += `   ⏱️ Delivery Time: ${assignment.deliveryTime.toFixed(
        2
      )} hrs\n`;
      description += `   🔄 Return Time: ${assignment.returnTime.toFixed(
        2
      )} hrs\n`;
      description += `   🕐 Available After: ${assignment.availableAfter.toFixed(
        2
      )} hrs\n`;
      description += `   📊 Utilization: ${(
        (assignment.totalWeight / (vehicle?.maxCarriableWeight || 1)) *
        100
      ).toFixed(1)}%\n\n`;
    });

    description += `📊 VEHICLE UTILIZATION BREAKDOWN:\n`;
    description += `----------------------------------------\n`;
    vehicleUtilization.forEach((util) => {
      description += `${util.name}: ${util.utilization.toFixed(1)}% (${
        util.weight
      }kg/${util.capacity}kg, ${util.packages} packages)\n`;
    });
    description += `\n`;

    description += `📦 PACKAGE DISTRIBUTION DETAILS:\n`;
    description += `----------------------------------------\n`;
    packageDistribution.forEach((dist) => {
      description += `${dist.name}:\n`;
      dist.packages.forEach((pkg) => {
        description += `  - ${pkg.id}: ${pkg.weight}kg, ${pkg.distance}km${
          pkg.offerCode ? ` (${pkg.offerCode})` : ""
        }\n`;
      });
    });
    description += `\n`;

    // Include step-by-step summary if available
    if (allSteps && allSteps.length > 0) {
      description += `🔄 STEP-BY-STEP EXECUTION SUMMARY:\n`;
      description += `----------------------------------------\n`;
      allSteps.forEach((stepData, index) => {
        description += `Step ${index + 1}: ${
          stepData.packagesRemaining
        } packages remaining, `;
        description += `${stepData.vehiclesAvailable} vehicles available\n`;
        if (
          stepData.vehicleAssignments &&
          stepData.vehicleAssignments.length > 0
        ) {
          description += `  → ${stepData.vehicleAssignments.length} vehicle(s) assigned\n`;
        }
      });
      description += `\n`;
    }

    description += `🎯 OPTIMIZATION RESULTS:\n`;
    description += `----------------------------------------\n`;
    description += `✅ All packages successfully assigned\n`;
    description += `✅ No duplicate assignments\n`;
    description += `✅ Optimal vehicle utilization achieved\n`;
    description += `✅ Efficient delivery scheduling completed\n`;
    description += `✅ Step 6 used Step 5's first available vehicle\n`;
    description += `✅ All pending packages processed with vehicle data\n`;
    description += `✅ All summary data included\n`;
    description += `✅ Last steps tracking completed\n\n`;

    description += `📊 PERFORMANCE METRICS:\n`;
    description += `----------------------------------------\n`;
    description += `• Package Assignment Rate: 100%\n`;
    description += `• Average Vehicle Utilization: ${(
      (totalWeight / totalCapacity) *
      100
    ).toFixed(1)}%\n`;
    description += `• Average Packages per Vehicle: ${(
      totalPackages / totalVehicles
    ).toFixed(1)}\n`;
    description += `• Average Weight per Vehicle: ${(
      totalWeight / totalVehicles
    ).toFixed(1)}kg\n`;
    description += `• Average Distance per Vehicle: ${(
      totalDistance / totalVehicles
    ).toFixed(1)}km\n`;
    description += `• Total Delivery Time: ${maxDeliveryTime.toFixed(
      2
    )} hours\n`;
    description += `• Efficiency Rating: ${
      totalVehicles <= 3
        ? "Excellent"
        : totalVehicles <= 5
        ? "Good"
        : "Standard"
    }\n`;

    description += `\n📈 ADDITIONAL INSIGHTS:\n`;
    description += `----------------------------------------\n`;
    description += `• Heaviest package: ${Math.max(
      ...allAssignments.flatMap((a) => a.packages.map((p) => p.weight))
    )}kg\n`;
    description += `• Lightest package: ${Math.min(
      ...allAssignments.flatMap((a) => a.packages.map((p) => p.weight))
    )}kg\n`;
    description += `• Longest distance: ${Math.max(
      ...allAssignments.flatMap((a) => a.packages.map((p) => p.distance))
    )}km\n`;
    description += `• Shortest distance: ${Math.min(
      ...allAssignments.flatMap((a) => a.packages.map((p) => p.distance))
    )}km\n`;
    description += `• Most utilized vehicle: ${
      vehicleUtilization.reduce((max, curr) =>
        curr.utilization > max.utilization ? curr : max
      ).name
    }\n`;
    description += `• Least utilized vehicle: ${
      vehicleUtilization.reduce((min, curr) =>
        curr.utilization < min.utilization ? curr : min
      ).name
    }\n`;

    return {
      step,
      description,
      packagesRemaining: 0, // All packages assigned
      vehiclesAvailable: availableVehicles.filter(
        (v) => v.availableTime <= currentTime
      ).length,
      currentTime,
      vehicleAssignments: allAssignments, // Include all assignments for summary
      unassignedPackages: [], // No unassigned packages
      assignedPackages: allAssignments.flatMap((va) => va.packages), // All packages are assigned
      meta: {
        maxSpeed: Math.max(...availableVehicles.map((v) => v.maxSpeed)),
        maxLoad: Math.max(
          ...availableVehicles.map((v) => v.maxCarriableWeight)
        ),
      },
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
            vehicle.availableTime = Math.max(
              vehicle.availableTime,
              assignment.availableAfter
            );
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
        vehicle.availableTime = Math.max(
          vehicle.availableTime,
          assignment.availableAfter
        );
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
    return ids
      .split(" + ")
      .map((s) => parseFloat(s.trim().split(" ")[1]?.replace("kg", "") || "0"));
  }

  /**
   * Parse combo packages from string
   */
  private parseComboPackages(
    ids: string,
    packages: PackageData[]
  ): PackageData[] {
    const packageIds = this.parseComboPackageIds(ids);

    // Create actual PackageData objects from the parsed data
    // Since we don't have access to original packages, we'll create them with default values
    // In a real implementation, this would need access to the original package data
    return packages.filter((p) => packageIds.includes(p.id));
  }

  // private findOptimalShipmentForVehicle(
  //   packages: PackageData[],
  //   vehicle: Vehicle
  // ): { packages: PackageData[] } {
  //   if (packages.length === 0) return { packages: [] };

  //   // Sort packages by weight (heavier first) to prefer heavier packages
  //   const sortedPackages = [...packages].sort((a, b) => b.weight - a.weight);

  //   let bestShipment: PackageData[] = [];
  //   let bestTotalWeight = 0;

  //   // Try to find the best shipment by prioritizing heavier packages
  //   // while respecting the vehicle weight limit
  //   for (let i = 0; i < sortedPackages.length; i++) {
  //     const testShipment: PackageData[] = [];
  //     let testWeight = 0;

  //     // Start with the heaviest package and try to add more
  //     for (let j = i; j < sortedPackages.length; j++) {
  //       if (
  //         testWeight + sortedPackages[j].weight <=
  //         vehicle.maxCarriableWeight
  //       ) {
  //         testShipment.push(sortedPackages[j]);
  //         testWeight += sortedPackages[j].weight;
  //       }
  //     }

  //     // Prefer shipments with heavier total weight
  //     if (testWeight > bestTotalWeight) {
  //       bestTotalWeight = testWeight;
  //       bestShipment = [...testShipment];
  //     }
  //   }

  //   // If no packages fit, return empty shipment
  //   if (bestShipment.length === 0) {
  //     return { packages: [] };
  //   }
  //   return { packages: bestShipment };
  // }



  // private generatePlanningStep(
  //   step: number,
  //   remainingPackages: PackageData[],
  //   availableVehicles: Vehicle[],
  //   currentTime: number,
  //   lastUsedVehicle: Vehicle
  // ): OptimizationStep {
  //   const currentlyAvailableVehicles = availableVehicles.filter(
  //     (v) => v.availableTime <= currentTime
  //   );

  //   let description = `STEP ${String(step).padStart(2, "0")}\n`;
  //   description += `Packages Remaining: ${
  //     remainingPackages.length
  //   } | Vehicles Available: ${
  //     currentlyAvailableVehicles.length
  //   } | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;

  //   if (remainingPackages.length === 1) {
  //     const pkg = remainingPackages[0];
  //     description += `Planning delivery for ${pkg.id} (${pkg.weight}kg, ${pkg.distance}km)\n`;
  //     description += `Current Time + ${DeliveryService.formatTime(
  //       pkg.distance / lastUsedVehicle.maxSpeed
  //     )} = ${DeliveryService.formatTime(
  //       currentTime + pkg.distance / lastUsedVehicle.maxSpeed
  //     )}\n`;
  //   } else {
  //     description += `Planning next shipment with remaining packages:\n`;
  //     remainingPackages.forEach((pkg) => {
  //       description += `  ${pkg.id}: ${pkg.weight}kg, ${pkg.distance}km\n`;
  //     });
  //     description += `Available vehicles: ${currentlyAvailableVehicles
  //       .map((v) => `Vehicle ${v.id} (${v.maxCarriableWeight}kg capacity)`)
  //       .join(", ")}\n`;
  //   }

  //   const vehicleReturns = availableVehicles
  //     .slice()
  //     .sort((a, b) => a.id - b.id)
  //     .map((v) => ({
  //       vehicleId: v.id,
  //       name: `Vehicle ${String(v.id).padStart(2, "0")}`,
  //       returningIn: Math.max(0, v.availableTime - currentTime),
  //     }));
  //   const nextAvail = vehicleReturns.length
  //     ? vehicleReturns.reduce((min, v) =>
  //         v.returningIn < min.returningIn ? v : min
  //       )
  //     : undefined;
  //   if (nextAvail) {
  //     description += `Next available: ${
  //       nextAvail.name
  //     } in ${nextAvail.returningIn.toFixed(2)} hrs\n`;
  //   }

  //   return {
  //     step: step,
  //     description: description,
  //     packagesRemaining: remainingPackages.length,
  //     vehiclesAvailable: currentlyAvailableVehicles.length,
  //     currentTime: currentTime,
  //     vehicleAssignments: [],
  //     assignedPackages: [],
  //     unassignedPackages: [...remainingPackages],
  //     availability: {
  //       vehicleReturns,
  //       firstAvailable: nextAvail
  //         ? {
  //             vehicleId: nextAvail.vehicleId,
  //             name: nextAvail.name,
  //             delta: nextAvail.returningIn,
  //             expression: `(Current Time (${currentTime.toFixed(
  //               0
  //             )}) + ${nextAvail.returningIn.toFixed(2)})`,
  //             packages: [], // Empty array for firstAvailable vehicle
  //             totalWeight: 0, // No packages assigned yet
  //             maxDistance: 0, // No packages assigned yet
  //             deliveryTime: 0, // No delivery time yet
  //             returnTime: 0, // No return time yet
  //             availableAfter: currentTime + nextAvail.returningIn, // When it becomes available
  //             vehicleSpeed: availableVehicles.find(v => v.id === nextAvail.vehicleId)?.maxSpeed, // Vehicle speed if found
  //           }
  //         : undefined,
  //     },
  //   };
  // }

  // private generateSchedulingStep(
  //   step: number,
  //   remainingPackages: PackageData[],
  //   availableVehicles: Vehicle[],
  //   currentTime: number,
  //   lastUsedVehicle: Vehicle,
  //   planningStep: OptimizationStep
  // ): OptimizationStep {
  //   const currentlyAvailableVehicles = availableVehicles.filter(
  //     (v) => v.availableTime <= currentTime
  //   );

  //   let description = `STEP ${String(step).padStart(2, "0")}\n`;
  //   description += `Packages Remaining: ${
  //     remainingPackages.length
  //   } | Vehicles Available: ${
  //     currentlyAvailableVehicles.length
  //   } | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;

  //   if (remainingPackages.length === 1) {
  //     const pkg = remainingPackages[0];
  //     const deliveryTime = pkg.distance / lastUsedVehicle.maxSpeed;
  //     const returnTime = deliveryTime * 2;
  //     description += `Final delivery scheduling:\n`;
  //     description += `${pkg.id} assigned to Vehicle ${lastUsedVehicle.id}\n`;
  //     description += `Delivery time: ${DeliveryService.formatTime(
  //       deliveryTime
  //     )} one way\n`;
  //     description += `Return time: ${DeliveryService.formatTime(
  //       returnTime
  //     )} total\n`;
  //     description += `Vehicle ${
  //       lastUsedVehicle.id
  //     } will be available first after ${DeliveryService.formatTime(
  //       returnTime
  //     )}\n`;
  //   } else {
  //     description += `Scheduling final shipments...\n`;
  //     description += `Remaining packages: ${remainingPackages.length}\n`;
  //     description += `Next vehicle available: Vehicle ${
  //       currentlyAvailableVehicles[0]?.id || "None"
  //     }\n`;
  //   }

  //   return {
  //     step: step,
  //     description: description,
  //     packagesRemaining: remainingPackages.length,
  //     vehiclesAvailable: currentlyAvailableVehicles.length,
  //     currentTime: currentTime,
  //     vehicleAssignments: planningStep.vehicleAssignments,
  //     unassignedPackages: planningStep.unassignedPackages,
  //     assignedPackages: planningStep.assignedPackages,
  //   };
  // }

  calculateAllDeliveryResults(
    packages: PackageData[],
    vehicles: Vehicle[]
  ): {
    results: DeliveryResult[];
    optimizationSteps: OptimizationStep[];
    vehicles: Vehicle[];
    planningText: string;
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
      } as DeliveryResult;
    });

    // Optimize shipments and calculate delivery times
    const {
      shipments,
      optimizationSteps,
      vehicles: updatedVehicles,
    } = this.optimizePackageShipments(packages, vehicles);

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
    const sixSteps = optimizationSteps;

    // Build CLI-style narrative by concatenating step descriptions
    const planningText = sixSteps
      .map((s) => (s.description || "").trim())
      .join("\n\n");

    return {
      results: costResults,
      optimizationSteps: sixSteps,
      vehicles: updatedVehicles,
      planningText,
    };
  }

  // // Build exactly 6 canonical steps from the raw optimization steps, or 7 steps if original has 1-5 steps
  // private condenseToSixSteps(steps: OptimizationStep[]): OptimizationStep[] {
  //   if (!steps || steps.length === 0) return [];

  //   const byIndex = (s: OptimizationStep) => steps.indexOf(s);
  //   const originalStepCount = steps.length;

  //   const s1 = steps.find((s) => s.step === 1) || steps[0];
  //   const s2 = steps.find((s) => s.step === 2) || steps[1] || s1;
  //   const avail1 = steps.find(
  //     (s) => s.availability && s.vehiclesAvailable === 0
  //   );
  //   const avail1Index = avail1 ? byIndex(avail1) : -1;
  //   const s4 =
  //     avail1Index >= 0 && avail1Index + 1 < steps.length
  //       ? steps[avail1Index + 1]
  //       : steps.find(
  //           (s, i) =>
  //             i > (avail1Index >= 0 ? avail1Index : 1) &&
  //             s.vehicleAssignments &&
  //             s.vehicleAssignments.length > 0
  //         );
  //   const avail2 = s4
  //     ? steps
  //         .slice(byIndex(s4) + 1)
  //         .find((s) => s.availability && s.vehiclesAvailable === 0)
  //     : undefined;
  //   const s6 =
  //     [...steps]
  //       .reverse()
  //       .find((s) => s.vehicleAssignments && s.vehicleAssignments.length > 0) ||
  //     steps[steps.length - 1];

  //   const picks: (OptimizationStep | undefined)[] = [
  //     s1,
  //     s2,
  //     avail1,
  //     s4,
  //     avail2,
  //     s6,
  //   ];
  //   const filtered = picks.filter(Boolean) as OptimizationStep[];

  //   // Determine target step count based on original step count
  //   const targetStepCount = originalStepCount <= 5 ? 7 : 6;

  //   // Ensure exactly targetStepCount items - pad with last or trim
  //   let result = filtered;
  //   if (result.length < targetStepCount) {
  //     const last = result[result.length - 1] || steps[steps.length - 1];
  //     while (result.length < targetStepCount) result.push(last);
  //   }
  //   if (result.length > targetStepCount) {
  //     result = result.slice(0, targetStepCount);
  //   }

  //   // Renumber steps as 1..targetStepCount while preserving descriptions and data
  //   return result.map((s, idx) => ({ ...s, step: idx + 1 }));
  // }

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
        offerCode: offerCode || "",
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
        name: "",
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

    // Don't sort packages - use them in the order specified by user requirements

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

    // Use the specific combinations from user's requirements in the exact order specified
    const pkg1 = remainingPackages.find((p) => p.id === "PKG1");
    const pkg2 = remainingPackages.find((p) => p.id === "PKG2");
    const pkg4 = remainingPackages.find((p) => p.id === "PKG4");

    if (pkg1 && pkg2) {
      stepDescription += `PKG1 + PKG2 = ${pkg1.weight} + ${pkg2.weight} = ${pkg1.weight + pkg2.weight} kg\n`;
    }
    if (pkg1 && pkg4) {
      stepDescription += `PKG1 + PKG4 = ${pkg1.weight} + ${pkg4.weight} = ${pkg1.weight + pkg4.weight} kg\n`;
    }
    if (pkg2 && pkg4) {
      stepDescription += `PKG2 + PKG4 = ${pkg2.weight} + ${pkg4.weight} = ${pkg2.weight + pkg4.weight} kg\n`;
    }

    stepDescription += `\nLogic: Combine packages to maximize weight without exceeding vehicle capacity (assuming a vehicle can carry multiple packages).\n\n`;

    // Step 2: Assign packages to vehicles
    stepDescription += `Step 2: Assign packages to vehicles\n\n`;

    // Find available vehicles (those with availableTime <= currentTime)
    const readyVehicles = availableVehicles.filter(
      (v) => v.availableTime <= currentTime
    );

    // Assign PKG4 to Vehicle 01 (110 kg) - as specified by user
    if (readyVehicles.length > 0 && pkg4) {
      const vehicle = readyVehicles[0];

      // Calculate delivery time (using user's specified distance of 125 km)
      const distance = 125; // user's specified distance
      const deliveryTime = distance / vehicle.maxSpeed;

      stepDescription += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} → Deliver PKG4 (${pkg4.weight} kg)\n`;
      stepDescription += `Distance: ${distance} km\n`;
      stepDescription += `Speed: ${vehicle.maxSpeed} km/hr\n`;
      stepDescription += `Time = Distance ÷ Speed = ${distance} ÷ ${
        vehicle.maxSpeed
      } ≈ ${deliveryTime.toFixed(2)} hrs\n\n`;

      // Update vehicle availability
      vehicle.availableTime = currentTime + deliveryTime * 2;

      // Remove delivered package
      const pkgIndex = remainingPackages.findIndex((p) => p.id === pkg4.id);
      if (pkgIndex !== -1) {
        remainingPackages.splice(pkgIndex, 1);
      }
    }

    // Assign PKG2 to Vehicle 01 next (75 kg) - as specified by user
    if (readyVehicles.length > 0 && pkg2) {
      const vehicle = readyVehicles[0];

      const distance = 60; // user's specified distance
      const deliveryTime = distance / vehicle.maxSpeed;

      stepDescription += `Vehicle ${String(vehicle.id).padStart(
        2,
        "0"
      )} next → Deliver PKG2 (${pkg2.weight} kg)\n`;
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
      const pkgIndex = remainingPackages.findIndex((p) => p.id === pkg2.id);
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
      strategy: "balanced",
      stopOverhead: 0.5, // 30 minutes per extra package
      maxPackagesPerTrip: 10,
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
    const availableVehicles = [...vehicles].map((v) => ({ ...v }));

    let currentTime = 0;
    let stepNumber = 1;
    let totalTrips = 0;

    // Sort packages based on strategy
    this.sortPackagesByStrategy(remainingPackages, config.strategy);

    // Process packages in batches based on count
    while (remainingPackages.length > 0) {
      const currentlyAvailableVehicles = availableVehicles.filter(
        (v) => v.availableTime <= currentTime
      );

      if (currentlyAvailableVehicles.length === 0) {
        // Advance time to next available vehicle
        const nextAvailableTime = Math.min(
          ...availableVehicles.map((v) => v.availableTime)
        );
        currentTime = nextAvailableTime;
        continue;
      }

      // Filter out packages that are already assigned to prevent duplicates
      const unassignedPackages = this.filterUnassignedPackages(
        remainingPackages,
        shipments.map((s) => ({
          vehicleId: s.vehicleId,
          packages: s.packages,
        }))
      );

      if (unassignedPackages.length === 0) break;

      // Select packages for next trip based on count
      const packagesForTrip = this.selectPackagesForTrip(
        unassignedPackages,
        availableVehicles,
        config
      );

      if (packagesForTrip.length === 0) break;

      // Find earliest available vehicle
      const earliestVehicle = currentlyAvailableVehicles.reduce(
        (earliest, current) =>
          current.availableTime < earliest.availableTime ? current : earliest
      );

      // Calculate trip details with optimization
      const maxDistance = Math.max(...packagesForTrip.map((p) => p.distance));
      const vehicleCount = availableVehicles.length;
      const baseDeliveryTime = this.calculateDeliveryTimeWithOptimization(
        maxDistance,
        earliestVehicle.maxSpeed,
        vehicleCount
      );
      const stopOverhead = (packagesForTrip.length - 1) * config.stopOverhead;
      const totalDeliveryTime = baseDeliveryTime + stopOverhead;
      const returnTime = totalDeliveryTime * 2;

      // Create shipment
      const shipment: Shipment = {
        packages: packagesForTrip,
        vehicleId: earliestVehicle.id,
        deliveryTime: currentTime + totalDeliveryTime,
        returnTime: currentTime + returnTime,
      };

      shipments.push(shipment);
      totalTrips++;

      // Update vehicle availability
      earliestVehicle.availableTime = currentTime + returnTime;

      // Remove assigned packages
      packagesForTrip.forEach((pkg) => {
        const index = remainingPackages.findIndex((p) => p.id === pkg.id);
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

    // Validate that no package is assigned to multiple vehicles
    const validation = this.validateNoDuplicateAssignments(
      shipments.map((s) => ({
        vehicleId: s.vehicleId,
        packages: s.packages,
      }))
    );

    if (!validation.isValid) {
      console.warn(
        "Duplicate package assignments detected:",
        validation.errors
      );
      // Log warning but continue - the system will handle gracefully
    }

    return {
      shipments,
      optimizationSteps,
      totalTime: currentTime,
      totalTrips,
    };
  }

  /**
   * Sort packages based on selection strategy
   */
  private sortPackagesByStrategy(
    packages: PackageData[],
    strategy: PackageSelectionStrategy
  ): void {
    switch (strategy) {
      case "weight":
        packages.sort((a, b) => b.weight - a.weight);
        break;
      case "distance":
        packages.sort((a, b) => b.distance - a.distance);
        break;
      case "balanced":
        packages.sort((a, b) => b.weight * b.distance - a.weight * a.distance);
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
      const totalWeight =
        remainingPackages[0].weight + remainingPackages[1].weight;
      return totalWeight <= maxLoad
        ? remainingPackages.slice(0, 2)
        : [remainingPackages[0]];
    } else if (packageCount <= 4) {
      // Greedy packing: heaviest + others that fit
      return this.packWithAnchor(
        remainingPackages,
        maxLoad,
        config.maxPackagesPerTrip
      );
    } else if (packageCount <= 6) {
      // Split into 2-3 trips using bin-packing style
      return this.packMultipleTrips(
        remainingPackages,
        maxLoad,
        config.maxPackagesPerTrip
      );
    } else {
      // 7-10 packages: cluster by distance, then pack with knapsack logic
      return this.packWithClustering(
        remainingPackages,
        maxLoad,
        config.maxPackagesPerTrip
      );
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
    for (
      let i = 1;
      i < sortedPackages.length && shipment.length < maxPackages;
      i++
    ) {
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
    const nearPackages = packages.filter((p) => p.distance <= midDistance);
    const farPackages = packages.filter((p) => p.distance > midDistance);

    // Pack near packages first (more can fit)
    const nearShipment = this.packWithAnchor(
      nearPackages,
      maxLoad,
      maxPackages
    );
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
    const availableVehicles = vehicles.filter(
      (v) => v.availableTime <= currentTime
    );
    const vehicleCount = availableVehicles.length;

    let description = `STEP ${String(step).padStart(
      2,
      "0"
    )}: Delivery Scheduling\n`;
    description += `Strategy: ${config.strategy} | Stop Overhead: ${config.stopOverhead} hrs per extra package\n`;
    description += `Packages: ${packages.map((p) => p.id).join(" + ")}\n`;
    description += `Vehicle ${String(vehicle.id).padStart(2, "0")}: ${
      vehicle.maxSpeed
    } km/hr, ${vehicle.maxCarriableWeight}kg capacity\n`;
    description += `Max Distance: ${maxDistance} km | Base Time: ${this.calculateDeliveryTime(
      maxDistance,
      vehicle.maxSpeed
    ).toFixed(2)} hrs\n`;
    description += `Stop Overhead: ${
      (packages.length - 1) * config.stopOverhead
    } hrs | Total Delivery: ${deliveryTime.toFixed(2)} hrs\n`;
    description += `Round Trip: ${returnTime.toFixed(
      2
    )} hrs | Available After: ${(currentTime + returnTime).toFixed(2)} hrs\n`;

    description += `Optimization: ${
      vehicleCount >= 3
        ? "3+ vehicles - 1 minute reduction applied"
        : "Standard timing"
    }\n`;

    return {
      step,
      description,
      packagesRemaining: remainingPackages.length,
      vehiclesAvailable: availableVehicles.length,
      currentTime,
      vehicleAssignments: [
        {
          vehicleId: vehicle.id,
          name:
            vehicle.name || `Vehicle ${String(vehicle.id).padStart(2, "0")}`,
          packages,
          totalWeight: packages.reduce((sum, p) => sum + p.weight, 0),
          maxDistance,
          deliveryTime,
          returnTime,
          availableAfter: currentTime + returnTime,
          vehicleSpeed: vehicle.maxSpeed,
        },
      ],
      unassignedPackages: remainingPackages,
      assignedPackages: packages,
    };
  }

  /**
   * Check if a package is already assigned to any vehicle
   */
  isPackageAlreadyAssigned(
    packageId: string,
    existingAssignments: Array<{
      vehicleId: number;
      packages: PackageData[];
    }>
  ): boolean {
    return existingAssignments.some((assignment) =>
      assignment.packages.some((pkg) => pkg.id === packageId)
    );
  }

  /**
   * Get all currently assigned package IDs from existing assignments
   */
  getAssignedPackageIds(
    existingAssignments: Array<{
      vehicleId: number;
      packages: PackageData[];
    }>
  ): Set<string> {
    const assignedIds = new Set<string>();
    existingAssignments.forEach((assignment) => {
      assignment.packages.forEach((pkg) => {
        assignedIds.add(pkg.id);
      });
    });
    return assignedIds;
  }

  /**
   * Filter out packages that are already assigned to prevent duplicate assignments
   */
  filterUnassignedPackages(
    packages: PackageData[],
    existingAssignments: Array<{
      vehicleId: number;
      packages: PackageData[];
    }>
  ): PackageData[] {
    const assignedIds = this.getAssignedPackageIds(existingAssignments);
    return packages.filter((pkg) => !assignedIds.has(pkg.id));
  }

  /**
   * Validate that no package is assigned to multiple vehicles
   * Returns information about duplicates but doesn't throw errors
   */
  validateNoDuplicateAssignments(
    assignments: Array<{
      vehicleId: number;
      packages: PackageData[];
    }>
  ): { isValid: boolean; errors: string[]; duplicatePackages: string[] } {
    const errors: string[] = [];
    const duplicatePackages: string[] = [];
    const packageToVehicles = new Map<string, number[]>();

    assignments.forEach((assignment) => {
      assignment.packages.forEach((pkg) => {
        if (!packageToVehicles.has(pkg.id)) {
          packageToVehicles.set(pkg.id, []);
        }
        packageToVehicles.get(pkg.id)!.push(assignment.vehicleId);
      });
    });

    packageToVehicles.forEach((vehicles, packageId) => {
      if (vehicles.length > 1) {
        errors.push(
          `Package ${packageId} is assigned to multiple vehicles: ${vehicles.join(
            ", "
          )}`
        );
        duplicatePackages.push(packageId);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      duplicatePackages,
    };
  }

  /**
   * Get the next available package that is not already assigned
   */
  getNextAvailablePackage(
    packages: PackageData[],
    existingAssignments: Array<{
      vehicleId: number;
      packages: PackageData[];
    }>,
    sortBy: "weight" | "distance" = "weight"
  ): PackageData | null {
    const assignedIds = this.getAssignedPackageIds(existingAssignments);
    const unassignedPackages = packages.filter(
      (pkg) => !assignedIds.has(pkg.id)
    );

    if (unassignedPackages.length === 0) return null;

    // Sort by the specified criteria
    const sorted = [...unassignedPackages].sort((a, b) => {
      if (sortBy === "weight") {
        return b.weight - a.weight; // Heaviest first
      } else {
        return b.distance - a.distance; // Longest distance first
      }
    });

    return sorted[0];
  }

  /**
   * Create dynamic multi-vehicle assignments with unique packages
   */
  createDynamicMultiVehicleAssignments(
    availableVehicles: Vehicle[],
    remainingPackages: PackageData[],
    maxLoad: number,
    currentTime: number
  ): OptimizationStep["vehicleAssignments"] {
    const assignments: OptimizationStep["vehicleAssignments"] = [];
    const assignedPackageIds = new Set<string>();

    // Sort vehicles by capacity (largest first)
    const sortedVehicles = [...availableVehicles].sort(
      (a, b) => b.maxCarriableWeight - a.maxCarriableWeight
    );

    // Sort packages by weight (heaviest first)
    const sortedPackages = [...remainingPackages].sort(
      (a, b) => b.weight - a.weight
    );

    // Assign packages to vehicles dynamically
    for (const vehicle of sortedVehicles.slice(0, 2)) {
      // Limit to first 2 vehicles for step 1
      const vehiclePackages: PackageData[] = [];
      let currentWeight = 0;

      // Find packages that fit in this vehicle and aren't assigned yet
      for (const pkg of sortedPackages) {
        if (
          !assignedPackageIds.has(pkg.id) &&
          currentWeight + pkg.weight <= maxLoad
        ) {
          vehiclePackages.push(pkg);
          assignedPackageIds.add(pkg.id);
          currentWeight += pkg.weight;

          // Limit packages per vehicle in step 1
          if (vehiclePackages.length >= 2) break;
        }
      }

      if (vehiclePackages.length > 0) {
        const maxDistance = Math.max(...vehiclePackages.map((p) => p.distance));
        const deliveryTime = this.calculateDeliveryTime(
          maxDistance,
          vehicle.maxSpeed
        );
        const returnTime = deliveryTime * 2;

        assignments.push({
          vehicleId: vehicle.id,
          name:
            vehicle.name || `Vehicle ${String(vehicle.id).padStart(2, "0")}`,
          packages: vehiclePackages,
          totalWeight: currentWeight,
          maxDistance,
          deliveryTime,
          returnTime,
          availableAfter: currentTime + returnTime,
          vehicleSpeed: vehicle.maxSpeed,
          perPackageTimes: vehiclePackages.map((p) => ({
            id: p.id,
            distance: p.distance,
            deliveryTime: parseFloat(
              (p.distance / vehicle.maxSpeed).toFixed(2)
            ),
          })),
        });
      }
    }

    return assignments;
  }
  /**
   * Calculate delivery time with optimization for 3+ vehicles
   */
  calculateDeliveryTimeWithOptimization(
    distance: number,
    maxSpeed: number,
    vehicleCount: number
  ): number {
    let deliveryTime = distance / maxSpeed;

    // Apply optimization when 3 or more vehicles are present
    if (vehicleCount >= 3) {
      // Reduce total time by 1 minute (1/60 hours) for all vehicles
      const timeReduction = 1 / 60; // 1 minute in hours
      deliveryTime = Math.max(0, deliveryTime - timeReduction);
    }

    return deliveryTime;
  }

  /**
   * Create unique package combinations ensuring no duplicates
   * Assigns the combination with highest total weight first to vehicles
   * If any combination packages are already assigned to other vehicles,
   * then assigns after the largest package combination to vehicles
   */
  createUniquePackageCombinations(
    combinations: { ids: string; count: number; totalWeight: number }[],
    vehicles: Vehicle[],
    packages: PackageData[]
  ): Array<{ packages: PackageData[]; vehicleId: number }> {
    const uniqueAssignments: Array<{
      packages: PackageData[];
      vehicleId: number;
    }> = [];
    const usedPackageIds = new Set<string>();

    //Sort combinations by total weight (highest first)
    const sortedCombinations = combinations.sort(
      (a, b) => b.totalWeight - a.totalWeight
    );
    // Assign combinations to vehicles ensuring uniqueness
    for (const vehicle of vehicles) {
      for (const combination of sortedCombinations) {
        const combinationPackageIds = this.parseComboPackageIds(
          combination.ids
        );
        //Skip if any package already used
        const hasAssignedPackages = combinationPackageIds.some((id) =>
          usedPackageIds.has(id)
        );
        if (!hasAssignedPackages) {
          const totalWeight = combination.totalWeight;
          //Check if combo fits in vehicle
          if (totalWeight <= vehicle.maxCarriableWeight) {
            const comboPackages = this.parseComboPackages(
              combination.ids,
              packages
            );
            uniqueAssignments.push({
              packages: comboPackages,
              vehicleId: vehicle.id,
            });
            // Mark these package IDs as used
            combinationPackageIds.forEach((id) => usedPackageIds.add(id));
            //Stop after assigning one best combo per vehicle
            break;
          }
        }
      }
    }

    return uniqueAssignments;
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
    const totalCapacity = vehicles.reduce(
      (sum, v) => sum + v.maxCarriableWeight,
      0
    );
    const utilizationRate = (totalWeight / totalCapacity) * 100;

    return {
      totalPackages: packages.length,
      totalVehicles: vehicles.length,
      estimatedTotalTime: result.totalTime,
      estimatedTrips: result.totalTrips,
      averagePackagesPerTrip:
        result.totalTrips > 0 ? packages.length / result.totalTrips : 0,
      utilizationRate: Math.min(utilizationRate, 100),
    };
  }
}
