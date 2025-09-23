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
  }>;
  unassignedPackages: PackageData[];
  assignedPackages?: PackageData[];
  meta?: {
    maxSpeed: number;
    maxLoad: number;
  };
  combos?: Array<{
    aId: string;
    aWeight: number;
    bId: string;
    bWeight: number;
    total: number;
    count:number;
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

    // Sort packages by weight (heavier first)
    remainingPackages.sort((a, b) => b.weight - a.weight);

    let stepNumber = 1;
    let currentTime = 0;

    // STEP 01: overview
    const overviewStep = this.generateInitialOverviewStep(
      stepNumber,
      packages,
      availableVehicles,
      currentTime
    );
    optimizationSteps.push(overviewStep);
    stepNumber++;
    const assignedInOverview = (overviewStep.assignedPackages || []).map(p => p.id);
    const usedInOverview = (overviewStep.vehicleAssignments || []).map(v => v.vehicleId);

    const vehiclesForStep2 = availableVehicles.filter(v => !usedInOverview.includes(v.id));

    // STEP 02: combinations + heaviest
    const combinationStep = this.generateCombinationStep(
      stepNumber,
      remainingPackages.filter(p => !assignedInOverview.includes(p.id)),
      vehiclesForStep2,
      currentTime,
      overviewStep
    );
    optimizationSteps.push(combinationStep);
    stepNumber++;

    // Apply availability updates for steps 1 & 2
    const applyAssignments = (assignments: OptimizationStep["vehicleAssignments"]) => {
      assignments.forEach(a => {
        const v = availableVehicles.find(av => av.id === a.vehicleId);
        if (v) {
          const updated = Math.max(v.availableTime, a.availableAfter);
          v.availableTime = parseFloat(updated.toFixed(2));
        }
      });
    };
    applyAssignments(overviewStep.vehicleAssignments || []);
    applyAssignments(combinationStep.vehicleAssignments || []);

    // Remove early assigned packages
    const earlyAssignedIds = new Set([
      ...(overviewStep.assignedPackages || []).map(p => p.id),
      ...(combinationStep.assignedPackages || []).map(p => p.id),
    ]);
    for (let i = remainingPackages.length - 1; i >= 0; i--) {
      if (earlyAssignedIds.has(remainingPackages[i].id)) {
        remainingPackages.splice(i, 1);
      }
    }

    const pendingPackages = remainingPackages.filter(p => !(combinationStep.assignedPackages || []).map(pp => pp.id).includes(p.id));

    while (pendingPackages.length > 0) {
      const readyVehicles = availableVehicles.filter(v => v.availableTime <= currentTime);
      if (readyVehicles.length === 0) {
        const nextTime = Math.min(...availableVehicles.map(v => v.availableTime));
        currentTime = nextTime;
        const availabilityStep = this.generateAvailabilityStep(
          stepNumber,
          pendingPackages,
          availableVehicles,
          currentTime
        );
        optimizationSteps.push(availabilityStep);
        stepNumber++;
        continue;
      }

      const earliestVehicle = readyVehicles.reduce((earliest, curr) => curr.availableTime < earliest.availableTime ? curr : earliest);
      const shipment = this.findOptimalShipmentForVehicle(pendingPackages, earliestVehicle);
      if (shipment.packages.length === 0) break;

      const maxDistance = Math.max(...shipment.packages.map(p => p.distance));
      const deliveryTime = this.calculateDeliveryTime(maxDistance, earliestVehicle.maxSpeed);
      const returnTime = deliveryTime * 2;

      const packagesBeforeProcessing = [...pendingPackages];

      const availabilityStep = this.generateAvailabilityStep(
        stepNumber + 1,
        packagesBeforeProcessing,
        availableVehicles,
        currentTime
      );
      optimizationSteps.push(availabilityStep);

      const planningStep = this.generatePlanningStep(
        stepNumber + 2,
        packagesBeforeProcessing,
        availableVehicles,
        currentTime,
        earliestVehicle
      );
      optimizationSteps.push(planningStep);

      const schedulingStep = this.generateSchedulingStep(
        stepNumber + 3,
        packagesBeforeProcessing,
        availableVehicles,
        currentTime,
        earliestVehicle,
        planningStep
      );
      optimizationSteps.push(schedulingStep);

      stepNumber += 4;

      const stepDescription = this.generateStepDescription(
        shipment.packages,
        earliestVehicle,
        maxDistance,
        deliveryTime,
        returnTime
      );

      optimizationSteps.push({
        step: stepNumber,
        description: stepDescription,
        packagesRemaining: pendingPackages.length,
        vehiclesAvailable: readyVehicles.length,
        currentTime: currentTime,
        vehicleAssignments: [
          {
            vehicleId: earliestVehicle.id,
            name: `Vehicle ${String(earliestVehicle.id).padStart(2, '0')}`,
            packages: shipment.packages,
            totalWeight: shipment.packages.reduce((s, p) => s + p.weight, 0),
            maxDistance,
            deliveryTime,
            returnTime,
            availableAfter: currentTime + returnTime,
            vehicleSpeed: earliestVehicle.maxSpeed,
          },
        ],
        unassignedPackages: pendingPackages.filter(pkg => !shipment.packages.some(sp => sp.id === pkg.id)),
      });

      shipments.push({
        packages: shipment.packages,
        vehicleId: earliestVehicle.id,
        deliveryTime: currentTime + deliveryTime,
        returnTime: currentTime + returnTime,
      });

      earliestVehicle.availableTime = parseFloat((currentTime + returnTime).toFixed(2));
      currentTime += deliveryTime;

      shipment.packages.forEach((pkg) => {
        const idx = pendingPackages.findIndex(p => p.id === pkg.id);
        if (idx !== -1) pendingPackages.splice(idx, 1);
      });

      stepNumber++;
    }

    return { shipments, optimizationSteps };
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
s

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
    const {
      shipments,
      optimizationSteps,
    } = this.optimizePackageShipments(
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
    remainingPackages.sort((a, b) => a.weight - b.weight);

    const maxLoad = vehicleCount > 0 ? availableVehicles[0].maxCarriableWeight : 0;
    const combos: { ids: string; count: number; totalWeight: number }[] = [];
    if (remainingPackages.length === 1) {
      const p = remainingPackages[0];
      combos.push({ ids: `${p.id} ${p.weight}kg`, count: 1, totalWeight: p.weight });
    } else if (remainingPackages.length === 2) {
      const p1 = remainingPackages[0];
      const p2 = remainingPackages[1];
      combos.push({ ids: `${p1.id} ${p1.weight}kg + ${p2.id} ${p2.weight}kg`, count: 2, totalWeight: p1.weight + p2.weight });
    } else {
      for (let i = 0; i < remainingPackages.length; i++) {
        for (let j = i + 1; j < remainingPackages.length; j++) {
          const w = remainingPackages[i].weight + remainingPackages[j].weight;
          if (w <= maxLoad) {
            combos.push({
              ids: `${remainingPackages[i].id} ${remainingPackages[i].weight}kg + ${remainingPackages[j].id} ${remainingPackages[j].weight}kg`,
              count: 2,
              totalWeight: w,
            });
          }
        }
      }
    }

    let description = `STEP ${String(step).padStart(2, "0")}\n`;
    description += `Packages Remaining: ${String(remainingPackages.length).padStart(2, "0")}\n`;
    description += `Vehicles Available: ${String(vehicleCount).padStart(2, "0")} | Current Time: ${DeliveryService.formatTime(currentTime)}\n`;
    description += `-------------------------------------------------\n`;
    if (combos.length === 0) {
      description += `(No valid 2-package combinations)\n`;
    } else {
      combos.forEach((c) => {
        description += `${c.ids} → ${String(c.count).padStart(2, "0")} packages ${c.totalWeight}kg\n`;
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
      ? vehicleReturns01.reduce((min, v) => (v.returningIn < min.returningIn ? v : min))
      : undefined;
    if (nextAvail01) {
      description += `Next available: ${nextAvail01.name} in ${nextAvail01.returningIn.toFixed(2)} hrs\n`;
    }

    let previewAssignments: OptimizationStep["vehicleAssignments"] = [];
    if (availableVehicles.length > 0 && remainingPackages.length > 0) {
      const vehicle = availableVehicles[0];
      const { packages: previewPkgs } = this.findOptimalShipmentForVehicle(remainingPackages, vehicle);
      if (previewPkgs && previewPkgs.length > 0) {
        const maxDistance = Math.max(...previewPkgs.map((p) => p.distance));
        const deliveryTime = this.calculateDeliveryTime(maxDistance, vehicle.maxSpeed);
        const returnTime = deliveryTime * 2;
        previewAssignments = [
          {
            vehicleId: vehicle.id,
            name: `Vehicle ${String(vehicle.id).padStart(2, '0')}`,
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
        const pkgIds = previewPkgs.map(p => p.id).join(' + ');
        description += `Assigned preview: Vehicle ${String(vehicle.id).padStart(2,'0')} → ${pkgIds}\n`;
        description += `One-way time: ${(deliveryTime).toFixed(2)} hrs | Round-trip: ${(returnTime).toFixed(2)} hrs\n`;
        description += `Available at: ${(currentTime + returnTime).toFixed(2)} hrs\n`;
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
      assignedPackages: previewAssignments.length > 0 ? previewAssignments[0].packages : [],
      meta: {
        maxSpeed: vehicleCount > 0 ? availableVehicles[0].maxSpeed : 0,
        maxLoad,
      },
      combos: combos.map((c) => {
        const parts = c.ids.split("+").map((s) => s.trim());
        const aPart = parts[0] || "";
        const bPart = parts[1] || "";
        const [aId, aWeightWithKg] = aPart.split(" ");
        let bId = "";
        let bWeightVal = 0;
        if (bPart) {
          const [bIdRaw, bWeightWithKg] = bPart.split(" ");
          bId = bIdRaw || "";
          bWeightVal = parseFloat(bWeightWithKg?.replace("kg", "") || "0");
        }
        return {
          aId,
          aWeight: parseFloat(aWeightWithKg?.replace("kg", "") || "0"),
          bId,
          bWeight: bWeightVal,
          total: c.totalWeight,
          count: bId ? 2 : 1,
        };
      }),
      availability: {
        vehicleReturns: vehicleReturns01,
        firstAvailable: nextAvail01
          ? {
              vehicleId: nextAvail01.vehicleId,
              name: nextAvail01.name,
              delta: nextAvail01.returningIn,
              expression: `(Current Time (${currentTime.toFixed(0)}) + ${nextAvail01.returningIn.toFixed(2)})`,
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
    remainingPackages.sort((a, b) => a.weight - b.weight);
    const currentlyAvailable = availableVehicles.filter((v) => v.availableTime <= currentTime);
    console.log(currentlyAvailable,'currentlyAvailable generateCombinationStep 700')
    const vehicleCount = currentlyAvailable.length;
    const maxLoad = availableVehicles.length > 0 ? availableVehicles[0].maxCarriableWeight : 0;

    const combos: { ids: string; count: number; totalWeight: number }[] = [];
    for (let i = 0; i < remainingPackages.length; i++) {
      for (let j = i + 1; j < remainingPackages.length; j++) {
        const w = remainingPackages[i].weight + remainingPackages[j].weight;
        if (w <= maxLoad) {
          combos.push({
            ids: `${remainingPackages[i].id} ${remainingPackages[i].weight}kg + ${remainingPackages[j].id} ${remainingPackages[j].weight}kg`,
            count: 2,
            totalWeight: w,
          });
        }
      }
    }

    const heaviest = [...remainingPackages].sort((a, b) => b.weight - a.weight)[0] || null;

    let description = `STEP ${String(step).padStart(2, "0")}\n`;
    description += `Packages Remaining: ${String(remainingPackages.length).padStart(2, "0")}\n`;
    description += `Vehicles Available: ${String(vehicleCount).padStart(2, "0")} | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;
    description += `Valid 2-package combinations within ${maxLoad}kg:\n`;
    if (combos.length === 0) {
      description += `  (No valid 2-package combinations)\n`;
    } else {
      const bestCombo = [...combos].sort((a, b) => b.totalWeight - a.totalWeight)[0];
      description += `  ${bestCombo.ids} → ${String(bestCombo.count).padStart(2, "0")} packages ${bestCombo.totalWeight}kg\n`;
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
      ? vehicleReturns02.reduce((min, v) => (v.returningIn < min.returningIn ? v : min))
      : undefined;
    if (nextAvail02) {
      description += `Next available: ${nextAvail02.name} in ${nextAvail02.returningIn.toFixed(2)} hrs\n`;
    }

    let vehicleAssignments: OptimizationStep["vehicleAssignments"] = [];
    if (heaviest && currentlyAvailable.length > 0) {
      const preferred = currentlyAvailable[0];
      const maxDistance = heaviest.distance;
      const deliveryTime = this.calculateDeliveryTime(maxDistance, preferred.maxSpeed);
      const returnTime = deliveryTime * 2;
      vehicleAssignments = [
        {
          vehicleId: preferred.id,
          name: `Vehicle ${String(preferred.id).padStart(2, '0')}`,
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
      description += `Assigned: Vehicle ${String(preferred.id).padStart(2,'0')} → ${heaviest.id}\n`;
      description += `One-way time: ${(deliveryTime).toFixed(2)} hrs | Round-trip: ${(returnTime).toFixed(2)} hrs\n`;
      description += `Available at: ${(currentTime + returnTime).toFixed(2)} hrs\n`;
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
      heaviest: heaviest ? { id: heaviest.id, weight: heaviest.weight } : undefined,
      availability: {
        vehicleReturns: vehicleReturns02,
        firstAvailable: nextAvail02
          ? {
              vehicleId: nextAvail02.vehicleId,
              name: nextAvail02.name,
              delta: nextAvail02.returningIn,
              expression: `(Current Time (${currentTime.toFixed(0)}) + ${nextAvail02.returningIn.toFixed(2)})`,
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
    const nextAvailableTime = Math.min(...availableVehicles.map((v) => v.availableTime));
    const nextAvailableVehicle = availableVehicles.find((v) => v.availableTime === nextAvailableTime);

    let description = `STEP ${String(step).padStart(2, "0")}: Waiting for Vehicles to Return\n`;
    const pkgList = remainingPackages.map((p) => `${p.id} (${p.weight} kg)`).join(", ");
    description += `Packages Remaining: ${remainingPackages.length}${pkgList ? ` → ${pkgList}` : ""}\n`;
    description += `Vehicles Available: 0\n`;
    description += `Current Time: ${currentTime.toFixed(0)} hrs\n`;

    availableVehicles
      .sort((a, b) => a.id - b.id)
      .forEach((v) => {
        const returningIn = Math.max(0, v.availableTime - currentTime);
        description += `Vehicle ${String(v.id).padStart(2, "0")} returning in ${returningIn.toFixed(2)} hrs\n`;
      });

    description += `---------------------------------------------\n`;
    if (nextAvailableVehicle) {
      const delta = Math.max(0, nextAvailableVehicle.availableTime - currentTime);
      description += `Logic: Next delivery can only start when a vehicle becomes available.\n`;
      description += `Vehicle ${String(nextAvailableVehicle.id).padStart(2, "0")} returns first → available at Current Time + ${delta.toFixed(2)} = ${delta.toFixed(2)} hrs (time ${nextAvailableVehicle.availableTime.toFixed(2)} hrs)\n`;
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
              name: `Vehicle ${String(nextAvailableVehicle.id).padStart(2, "0")}`,
              delta: Math.max(0, nextAvailableVehicle.availableTime - currentTime),
              expression: `(Current Time (${currentTime.toFixed(0)}) + ${Math.max(0, nextAvailableVehicle.availableTime - currentTime).toFixed(2)})`,
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
    const currentlyAvailableVehicles = availableVehicles.filter((v) => v.availableTime <= currentTime);

    let description = `STEP ${String(step).padStart(2, "0")}\n`;
    description += `Packages Remaining: ${remainingPackages.length} | Vehicles Available: ${currentlyAvailableVehicles.length} | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;

    if (remainingPackages.length === 1) {
      const pkg = remainingPackages[0];
      description += `Planning delivery for ${pkg.id} (${pkg.weight}kg, ${pkg.distance}km)\n`;
      description += `Current Time + ${DeliveryService.formatTime(pkg.distance / lastUsedVehicle.maxSpeed)} = ${DeliveryService.formatTime(currentTime + pkg.distance / lastUsedVehicle.maxSpeed)}\n`;
    } else {
      description += `Planning next shipment with remaining packages:\n`;
      remainingPackages.forEach((pkg) => {
        description += `  ${pkg.id}: ${pkg.weight}kg, ${pkg.distance}km\n`;
      });
      description += `Available vehicles: ${currentlyAvailableVehicles.map((v) => `Vehicle ${v.id} (${v.maxCarriableWeight}kg capacity)`).join(", ")}\n`;
    }

    const vehicleReturns = availableVehicles
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((v) => ({
        vehicleId: v.id,
        name: `Vehicle ${String(v.id).padStart(2, "0")}`,
        returningIn: Math.max(0, v.availableTime - currentTime),
      }));
    const nextAvail = vehicleReturns.length ? vehicleReturns.reduce((min, v) => (v.returningIn < min.returningIn ? v : min)) : undefined;
    if (nextAvail) {
      description += `Next available: ${nextAvail.name} in ${nextAvail.returningIn.toFixed(2)} hrs\n`;
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
              expression: `(Current Time (${currentTime.toFixed(0)}) + ${nextAvail.returningIn.toFixed(2)})`,
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
    const currentlyAvailableVehicles = availableVehicles.filter((v) => v.availableTime <= currentTime);

    let description = `STEP ${String(step).padStart(2, "0")}\n`;
    description += `Packages Remaining: ${remainingPackages.length} | Vehicles Available: ${currentlyAvailableVehicles.length} | Current Time: ${DeliveryService.formatTime(currentTime)}\n\n`;

    if (remainingPackages.length === 1) {
      const pkg = remainingPackages[0];
      const deliveryTime = pkg.distance / lastUsedVehicle.maxSpeed;
      const returnTime = deliveryTime * 2;
      description += `Final delivery scheduling:\n`;
      description += `${pkg.id} assigned to Vehicle ${lastUsedVehicle.id}\n`;
      description += `Delivery time: ${DeliveryService.formatTime(deliveryTime)} one way\n`;
      description += `Return time: ${DeliveryService.formatTime(returnTime)} total\n`;
      description += `Vehicle ${lastUsedVehicle.id} will be available first after ${DeliveryService.formatTime(returnTime)}\n`;
    } else {
      description += `Scheduling final shipments...\n`;
      description += `Remaining packages: ${remainingPackages.length}\n`;
      description += `Next vehicle available: Vehicle ${currentlyAvailableVehicles[0]?.id || "None"}\n`;
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

    let description = `Vehicle ${String(vehicle.id).padStart(2, "0")} Delivering ${packageIds} ${DeliveryService.formatTime(deliveryTime)}\n`;
    description += `           ${maxDistance}km/${vehicle.maxSpeed}km/hr\n\n`;

    if (packages.length > 1) {
      packages.forEach((pkg) => {
        const pkgDeliveryTime = pkg.distance / vehicle.maxSpeed;
        description += `           Delivering ${pkg.id} ${DeliveryService.formatTime(pkgDeliveryTime)}\n`;
        description += `           ${pkg.distance}/${vehicle.maxSpeed}km/hr\n\n`;
      });
    }

    description += `Vehicle ${String(vehicle.id).padStart(2, "0")} will be available after (2*${deliveryTime.toFixed(2)}) ${returnTime.toFixed(2)}\n`;

    return description;
  }

  private condenseToSixSteps(steps: OptimizationStep[]): OptimizationStep[] {
    if (!steps || steps.length === 0) return [];

    const byIndex = (s: OptimizationStep) => steps.indexOf(s);
    const s1 = steps.find((s) => s.step === 1) || steps[0];
    const s2 = steps.find((s) => s.step === 2) || steps[1] || s1;
    const avail1 = steps.find((s) => (s as unknown as OptimizationStep).availability && s.vehiclesAvailable === 0);
    const avail1Index = avail1 ? byIndex(avail1) : -1;
    const s4 =
      avail1Index >= 0 && avail1Index + 1 < steps.length
        ? steps[avail1Index + 1]
        : steps.find((s, i) => i > (avail1Index >= 0 ? avail1Index : 1) && s.vehicleAssignments && s.vehicleAssignments.length > 0);
    const avail2 = s4 ? steps.slice(byIndex(s4) + 1).find((s) => (s as unknown as OptimizationStep).availability && s.vehiclesAvailable === 0) : undefined;
    const s6 = [...steps].reverse().find((s) => s.vehicleAssignments && s.vehicleAssignments.length > 0) || steps[steps.length - 1];

    const picks: (OptimizationStep | undefined)[] = [s1, s2, avail1, s4, avail2, s6];
    const filtered = picks.filter(Boolean) as OptimizationStep[];

    let result = filtered;
    if (result.length < 6) {
      const last = result[result.length - 1] || steps[steps.length - 1];
      while (result.length < 6) result.push(last);
    }
    if (result.length > 6) {
      result = result.slice(0, 6);
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
    let stepDescription = `STEP ${String(stepNumber).padStart(2, "0")}: Initial Delivery Planning\n`;
    stepDescription += `Packages Remaining: ${String(remainingPackages.length).padStart(2, "0")}\n`;
    stepDescription += `Vehicles Available: ${String(availableVehicles.length).padStart(2, "0")}\n`;
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
        const totalWeight = remainingPackages[i].weight + remainingPackages[j].weight;
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
    const readyVehicles = availableVehicles.filter(v => v.availableTime <= currentTime);

    // Assign heaviest package to Vehicle 01
    if (readyVehicles.length > 0 && remainingPackages.length > 0) {
      const heaviestPkg = remainingPackages[0];
      const vehicle = readyVehicles[0];

      // Calculate delivery time (using example distance of 125 km)
      const distance = 125; // example distance
      const deliveryTime = distance / vehicle.maxSpeed;

      stepDescription += `Vehicle ${String(vehicle.id).padStart(2, "0")} → Deliver ${heaviestPkg.id} (${heaviestPkg.weight} kg)\n`;
      stepDescription += `Distance: ${distance} km\n`;
      stepDescription += `Speed: ${vehicle.maxSpeed} km/hr\n`;
      stepDescription += `Time = Distance ÷ Speed = ${distance} ÷ ${vehicle.maxSpeed} ≈ ${deliveryTime.toFixed(2)} hrs\n\n`;

      // Update vehicle availability
      vehicle.availableTime = currentTime + (deliveryTime * 2);

      // Remove delivered package
      const pkgIndex = remainingPackages.findIndex(p => p.id === heaviestPkg.id);
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

      stepDescription += `Vehicle ${String(vehicle.id).padStart(2, "0")} next → Deliver ${nextHeaviest.id} (${nextHeaviest.weight} kg)\n`;
      stepDescription += `Distance: ${distance} km\n`;
      stepDescription += `Speed: ${vehicle.maxSpeed} km/hr\n`;
      stepDescription += `Time = ${distance} ÷ ${vehicle.maxSpeed} ≈ ${deliveryTime.toFixed(2)} hrs\n\n`;

      // Update vehicle availability
      vehicle.availableTime = Math.max(vehicle.availableTime, currentTime + (deliveryTime * 2));

      // Remove delivered package
      const pkgIndex = remainingPackages.findIndex(p => p.id === nextHeaviest.id);
      if (pkgIndex !== -1) {
        remainingPackages.splice(pkgIndex, 1);
      }
    }

    // Step 3: Calculate vehicle availability
    stepDescription += `Step 3: Calculate vehicle availability\n\n`;

    readyVehicles.forEach(vehicle => {
      const totalTime = vehicle.availableTime - currentTime;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(2, "0")} total time for round trip = 2 × ${totalTime/2} ≈ ${totalTime.toFixed(2)} hrs\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(2, "0")} will be free after ${totalTime.toFixed(2)} hrs.\n\n`;
    });

    steps.push(stepDescription);
    stepNumber++;

    // STEP 02: Next Delivery Assignment
    stepDescription = `STEP ${String(stepNumber).padStart(2, "0")}: Next Delivery Assignment\n`;
    stepDescription += `Packages Remaining: ${String(remainingPackages.length).padStart(2, "0")} → ${remainingPackages.map(p => `${p.id} (${p.weight} kg)`).join(", ")}\n`;
    stepDescription += `Vehicles Available: ${String(readyVehicles.length).padStart(2, "0")}\n`;
    stepDescription += `Current Time: ${currentTime} hrs\n\n`;

    // Step 1: Pick the heaviest package
    if (remainingPackages.length > 0) {
      const heaviestPkg = remainingPackages[0];
      const vehicle = readyVehicles[0];

      stepDescription += `Step 1: Pick the heaviest package\n\n`;
      stepDescription += `${heaviestPkg.id} = ${heaviestPkg.weight} kg → assigned to Vehicle ${String(vehicle.id).padStart(2, "0")}.\n\n`;
      stepDescription += `Logic: Prioritize heavier packages to reduce future delivery time and trips.\n\n`;

      // Step 2: Calculate delivery time
      const distance = 100; // example distance
      const deliveryTime = distance / vehicle.maxSpeed;

      stepDescription += `Step 2: Calculate delivery time\n\n`;
      stepDescription += `Distance: ${distance} km\n`;
      stepDescription += `Speed: ${vehicle.maxSpeed} km/hr\n`;
      stepDescription += `Time = ${distance} ÷ ${vehicle.maxSpeed} ≈ ${deliveryTime.toFixed(2)} hrs\n\n`;

      // Step 3: Calculate vehicle availability
      const roundTripTime = deliveryTime * 2;
      stepDescription += `Step 3: Calculate vehicle availability\n\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(2, "0")} round trip = 2 × ${deliveryTime.toFixed(2)} ≈ ${roundTripTime.toFixed(2)} hrs\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(2, "0")} will be free after ${roundTripTime.toFixed(2)} hrs.\n\n`;

      // Update vehicle availability
      vehicle.availableTime = currentTime + roundTripTime;

      // Remove delivered package
      const pkgIndex = remainingPackages.findIndex(p => p.id === heaviestPkg.id);
      if (pkgIndex !== -1) {
        remainingPackages.splice(pkgIndex, 1);
      }
    }

    steps.push(stepDescription);
    stepNumber++;

    // STEP 03: Waiting for Vehicles to Return
    stepDescription = `STEP ${String(stepNumber).padStart(2, "0")}: Waiting for Vehicles to Return\n`;
    stepDescription += `Packages Remaining: ${String(remainingPackages.length).padStart(2, "0")} → ${remainingPackages.map(p => `${p.id} (${p.weight} kg)`).join(", ")}\n`;
    stepDescription += `Vehicles Available: 0\n`;
    stepDescription += `Current Time: ${currentTime} hrs\n\n`;

    // Show returning vehicles
    availableVehicles.forEach(vehicle => {
      const returningIn = Math.max(0, vehicle.availableTime - currentTime);
      stepDescription += `Vehicle ${String(vehicle.id).padStart(2, "0")} returning in ${returningIn.toFixed(2)} hrs\n`;
    });

    stepDescription += `\nVehicle ${String(availableVehicles[0].id).padStart(2, "0")} returns first → available at Current Time + ${Math.max(0, availableVehicles[0].availableTime - currentTime).toFixed(2)} = ${availableVehicles[0].availableTime.toFixed(2)} hrs\n\n`;

    stepDescription += `Logic: Next delivery can only start when a vehicle becomes available.\n\n`;

    // Update current time to when first vehicle returns
    currentTime = availableVehicles[0].availableTime;

    steps.push(stepDescription);
    stepNumber++;

    // STEP 04: Deliver PKG5 with Vehicle 02
    stepDescription = `STEP ${String(stepNumber).padStart(2, "0")}: Deliver ${remainingPackages.length > 0 ? remainingPackages[0].id : 'Next Package'} with Vehicle ${String(availableVehicles[0].id).padStart(2, "0")}\n`;
    stepDescription += `Packages Remaining: ${String(remainingPackages.length).padStart(2, "0")} → ${remainingPackages.map(p => p.id).join(", ")}\n`;
    stepDescription += `Vehicles Available: 1 (Vehicle ${String(availableVehicles[0].id).padStart(2, "0")})\n`;
    stepDescription += `Current Time: ${currentTime.toFixed(2)} hrs\n\n`;

    if (remainingPackages.length > 0) {
      const nextPkg = remainingPackages[0];
      const vehicle = availableVehicles[0];

      stepDescription += `Step 1: Pick the heaviest remaining package\n\n`;
      stepDescription += `${nextPkg.id} = ${nextPkg.weight} kg → assigned to Vehicle ${String(vehicle.id).padStart(2, "0")}.\n\n`;

      // Step 2: Calculate delivery time
      const distance = 95; // example distance
      const deliveryTime = distance / vehicle.maxSpeed;

      stepDescription += `Step 2: Calculate delivery time\n\n`;
      stepDescription += `Distance: ${distance} km\n`;
      stepDescription += `Speed: ${vehicle.maxSpeed} km/hr\n`;
      stepDescription += `Time = ${distance} ÷ ${vehicle.maxSpeed} ≈ ${deliveryTime.toFixed(2)} hrs\n\n`;

      // Step 3: Vehicle availability
      const roundTripTime = deliveryTime * 2;
      stepDescription += `Step 3: Vehicle availability\n\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(2, "0")} round trip = 2 × ${deliveryTime.toFixed(2)} = ${roundTripTime.toFixed(2)} hrs\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(2, "0")} free at ${currentTime.toFixed(2)} + ${roundTripTime.toFixed(2)} ≈ ${(currentTime + roundTripTime).toFixed(2)} hrs\n\n`;

      // Update vehicle availability
      vehicle.availableTime = currentTime + roundTripTime;

      // Remove delivered package
      const pkgIndex = remainingPackages.findIndex(p => p.id === nextPkg.id);
      if (pkgIndex !== -1) {
        remainingPackages.splice(pkgIndex, 1);
      }
    }

    steps.push(stepDescription);
    stepNumber++;

    // STEP 05: Waiting for Vehicles to Return
    stepDescription = `STEP ${String(stepNumber).padStart(2, "0")}: Waiting for Vehicles to Return\n`;
    stepDescription += `Packages Remaining: ${String(remainingPackages.length).padStart(2, "0")} → ${remainingPackages.map(p => p.id).join(", ")}\n`;
    stepDescription += `Vehicles Available: 0\n`;
    stepDescription += `Current Time: ${currentTime.toFixed(2)} hrs\n\n`;

    // Show returning vehicles
    availableVehicles.forEach(vehicle => {
      const returningIn = Math.max(0, vehicle.availableTime - currentTime);
      stepDescription += `Vehicle ${String(vehicle.id).padStart(2, "0")} returning in ${returningIn.toFixed(2)} hrs\n`;
    });

    stepDescription += `\nVehicle ${String(availableVehicles[0].id).padStart(2, "0")} becomes available first → after ${Math.max(0, availableVehicles[0].availableTime - currentTime).toFixed(2)} hrs (${availableVehicles[0].availableTime.toFixed(2)} − ${currentTime.toFixed(2)})\n\n`;

    // Update current time to when first vehicle returns
    currentTime = availableVehicles[0].availableTime;

    steps.push(stepDescription);
    stepNumber++;

    // STEP 06: Deliver Last Package
    stepDescription = `STEP ${String(stepNumber).padStart(2, "0")}: Deliver Last Package ${remainingPackages.length > 0 ? remainingPackages[0].id : 'PKG1'}\n`;
    stepDescription += `Packages Remaining: ${String(remainingPackages.length).padStart(2, "0")} → ${remainingPackages.map(p => p.id).join(", ")}\n`;
    stepDescription += `Vehicles Available: 1 (Vehicle ${String(availableVehicles[0].id).padStart(2, "0")})\n`;
    stepDescription += `Current Time: ${currentTime.toFixed(2)} hrs\n\n`;

    if (remainingPackages.length > 0) {
      const lastPkg = remainingPackages[0];
      const vehicle = availableVehicles[0];

      stepDescription += `Step 1: Assign the remaining package\n\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(2, "0")} delivers ${lastPkg.id}\n\n`;

      // Step 2: Calculate delivery time
      const distance = 30; // example distance
      const deliveryTime = distance / vehicle.maxSpeed;

      stepDescription += `Step 2: Calculate delivery time\n\n`;
      stepDescription += `Distance: ${distance} km\n`;
      stepDescription += `Speed: ${vehicle.maxSpeed} km/hr\n`;
      stepDescription += `Time = ${distance} ÷ ${vehicle.maxSpeed} ≈ ${deliveryTime.toFixed(2)} hrs\n\n`;

      // Step 3: Vehicle availability after delivery
      const roundTripTime = deliveryTime * 2;
      stepDescription += `Step 3: Vehicle availability after delivery\n\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(2, "0")} round trip = 2 × ${deliveryTime.toFixed(2)} = ${roundTripTime.toFixed(2)} hrs\n`;
      stepDescription += `Vehicle ${String(vehicle.id).padStart(2, "0")} free at ${currentTime.toFixed(2)} + ${roundTripTime.toFixed(2)} ≈ ${(currentTime + roundTripTime).toFixed(2)} hrs\n\n`;

      // Remove delivered package
      const pkgIndex = remainingPackages.findIndex(p => p.id === lastPkg.id);
      if (pkgIndex !== -1) {
        remainingPackages.splice(pkgIndex, 1);
      }
    }

    steps.push(stepDescription);

    // Add final summary
    steps.push(`\n✅ Key Logic Summary\n\nMaximize delivery efficiency by choosing the heaviest packages first.\nCombine packages if possible to reduce trips.\nCalculate delivery time:\nTime = Distance ÷ Speed\nRound-trip time = 2 × Time.\nTrack vehicle availability and assign packages when a vehicle becomes free.\nUpdate current time to the earliest vehicle availability for the next delivery.`);

    return steps.join("\n");
  }
}
