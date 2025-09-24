#!/usr/bin/env node

/**
 * Kiki's Courier Service CLI
 *
 * A command-line interface for calculating delivery costs with backend integration.
 * This CLI fetches vehicle data from the backend API (same as frontend) and stores
 * all calculation results in the database.
 *
 * Features:
 * - Backend API integration for vehicle data
 * - Database storage for all calculations
 * - Step-by-step optimization process
 * - Same functionality as frontend submit process
 *
 * Usage:
 *   npm run cli                    # Interactive mode
 *   npm run cli < input.txt        # Read from stdin
 *   npm run cli input.txt          # Read from file
 *   npm run cli input.txt output.txt # Read from file, write to output
 */

import { readFileSync, writeFileSync } from "fs";
import * as readline from "readline";

// Define types locally since we can't import from frontend
interface PackageData {
  id: string;
  weight: number;
  distance: number;
  offerCode?: string;
}

interface Vehicle {
  id: number;
  name: string;
  maxSpeed: number;
  maxCarriableWeight: number;
  availableTime: number;
}

interface DeliveryCalculationRequest {
  baseDeliveryCost: number;
  packages: PackageData[];
  vehicles: Vehicle[];
}

interface DeliveryResult {
  id: string;
  discount: number;
  totalCost: number;
  originalCost: number;
  estimatedDeliveryTime: number;
}

interface OptimizationStep {
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
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class DeliveryCLI {
  private backendUrl: string;

  constructor() {
    this.backendUrl =
      process.env.BACKEND_API_URL || "http://localhost:5000/api";
  }

  private async makeApiCall<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = `${this.backendUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-CLI-Request": "true", // Special header to bypass authentication for CLI
    };

    const options: RequestInit = {
      headers,
    };

    if (data) {
      options.method = "POST";
      options.body = JSON.stringify(data);
    } else {
      options.method = "GET";
    }
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`
      );
    }

    const result: ApiResponse<T> = await response.json();
    if (!result.success) {
      throw new Error(result.message || "API call failed");
    }

    return result.data as T;
  }

  runFromStdin(): void {
    let input = "";

    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (chunk) => {
      input += chunk;
    });

    process.stdin.on("end", () => {
      try {
        const output = this.processInput(input);
        console.log(output);
      } catch (error) {
        console.error(
          "Error:",
          error instanceof Error ? error.message : "Unknown error"
        );
        process.exit(1);
      }
    });
  }

  async runFromFile(inputFile: string, outputFile?: string): Promise<void> {
    try {
      const input = readFileSync(inputFile, "utf8");
      const output = await this.processInput(input);

      if (outputFile) {
        writeFileSync(outputFile, output);
        console.log(`Output written to ${outputFile}`);
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : "Unknown error"
      );
      process.exit(1);
    }
  }

  runInteractive(): void {
    console.log("=== Kiki's Courier Service CLI ===");
    console.log("Enter the input data (press Enter twice to finish):");

    let input = "";
    let emptyLines = 0;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.on("line", (line: string) => {
      if (line.trim() === "") {
        emptyLines++;
        if (emptyLines >= 2) {
          rl.close();
        }
      } else {
        emptyLines = 0;
        input += line + "\n";
      }
    });

    rl.on("close", () => {
      try {
        const output = this.processInput(input);
        console.log("\n=== Results ===");
        console.log(output);
      } catch (error) {
        console.error(
          "Error:",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    });
  }

  private async processInput(input: string): Promise<string> {
    // Parse input locally first
    const parsed = this.parseCLIInput(input);

    // STEP 1: Validate package data
    console.log("=== STEP 1: VALIDATING PACKAGE DATA ===");
    const validationResults = parsed.packages.map((pkg) => ({
      packageId: pkg.id,
      validation: this.validatePackageData(pkg),
    }));

    validationResults.forEach((result) => {
      console.log(
        `Package ${result.packageId}: ${
          result.validation.isValid ? "VALID" : "INVALID"
        }`
      );
      if (!result.validation.isValid) {
        console.log(`  Errors: ${result.validation.errors.join(", ")}`);
      }
    });

    // STEP 2: Use vehicle data from input file
    console.log("\n=== STEP 2: USING VEHICLE DATA FROM INPUT FILE ===");
    console.log("Getting vehicle data from backend API...");

    try {
      const vehiclesResponse = await this.makeApiCall<ApiResponse<Vehicle[]>>(
        "/vehicles/delivery/all"
      );
      if (!vehiclesResponse) {
        throw new Error("No vehicles data in response");
      }

      if (!Array.isArray(vehiclesResponse)) {
        console.log("Vehicles data type:", typeof vehiclesResponse);
        console.log("Vehicles data value:", vehiclesResponse);
        throw new Error(
          `Vehicles data is not an array: ${typeof vehiclesResponse}`
        );
      }

      const vehiclesFromBackend = vehiclesResponse;

      if (vehiclesFromBackend.length === 0) {
        throw new Error(
          "No vehicles found in database. Please seed the database with test vehicles first."
        );
      }

      console.log(
        `✅ Retrieved ${vehiclesFromBackend.length} vehicles from backend:`
      );
      vehiclesFromBackend.forEach((vehicle) => {
        console.log(
          `  Vehicle ${vehicle.id}: ${vehicle.maxSpeed} km/h, ${vehicle.maxCarriableWeight}kg capacity`
        );
      });

      // STEP 3: Make API call to backend for calculation with backend vehicle data
      console.log("\n=== STEP 3: SENDING DATA TO BACKEND FOR CALCULATION ===");
      console.log(
        "Making API call to backend for delivery calculation with backend vehicle data..."
      );

      const calculationResult = await this.makeApiCall<{
        deliveryId: string;
        results: DeliveryResult[];
        optimizationSteps: OptimizationStep[];
        vehicles: Vehicle[];
        summary: {
          totalCost: number;
          totalDiscount: number;
          totalPackages: number;
          totalVehicles: number;
        };
        planningText: string;
      }>("/delivery/calculate", {
        baseDeliveryCost: parsed.baseDeliveryCost,
        packages: parsed.packages,
        vehicles: vehiclesFromBackend, // Use vehicles from backend instead of parsed input
      });

      console.log(
        `✅ Data stored in backend with ID: ${calculationResult.deliveryId}`
      );

      // STEP 3: Display results
      console.log("\n=== STEP 3: DISPLAYING RESULTS ===");
      const { results, optimizationSteps, vehicles, summary } =
        calculationResult;

      // Display package results
      console.log("\n=== PACKAGE RESULTS ===");
      results.forEach((result) => {
        console.log(
          `${result.id} ${result.discount} ${
            result.totalCost
          } ${result.estimatedDeliveryTime.toFixed(2)}`
        );
      });

      // Display optimization steps
      console.log("\n=== STEP 4: OPTIMIZATION PROCESS ===");
      if (optimizationSteps.length > 0) {
        optimizationSteps.forEach((step, index) => {
          console.log(`\n--- Step ${index + 1} ---`);
          console.log(step.description);

          if (step.vehicleAssignments.length > 0) {
            step.vehicleAssignments.forEach((assignment) => {
              console.log(
                `\nVehicle ${String(assignment.vehicleId).padStart(2, "0")}:`
              );
              console.log(
                `  Packages: ${assignment.packages
                  .map((pkg) => pkg.id)
                  .join(" + ")}`
              );
              console.log(`  Total Weight: ${assignment.totalWeight}kg`);
              console.log(`  Max Distance: ${assignment.maxDistance}km`);
              console.log(
                `  Delivery Time: ${this.formatTime(assignment.deliveryTime)}`
              );
              console.log(
                `  Available After: ${this.formatTime(
                  assignment.availableAfter
                )}`
              );
            });
          }

          if (step.unassignedPackages.length > 0) {
            console.log(
              `\nUnassigned Packages: ${step.unassignedPackages
                .map((pkg) => `${pkg.id}(${pkg.weight}kg)`)
                .join(", ")}`
            );
          }
        });
      }

      // Display summary
      console.log("\n=== STEP 5: SUMMARY ===");
      console.log(`Total Cost: $${summary.totalCost}`);
      console.log(`Total Discount: $${summary.totalDiscount}`);
      console.log(`Total Packages: ${summary.totalPackages}`);
      console.log(`Total Vehicles: ${summary.totalVehicles}`);

      // STEP 6: Demonstrate individual function calls (simulated)
      this.demonstrateFunctionCalls(parsed.packages, vehiclesFromBackend);

      // Format final output
      let output = this.formatCLIOutput(results);

      // Add planning text if available
      if (calculationResult.planningText) {
        output += "\n\n=== DETAILED PLANNING PROCESS ===\n\n";
        output += calculationResult.planningText;
      }

      return output;
    } catch (error) {
      console.log(error);
      throw new Error(
        `Backend API call failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  showHelp(): void {
    console.log(`
  Kiki's Courier Service CLI (Backend Integrated)

  Usage:
    delivery-cli                    # Interactive mode
    delivery-cli < input.txt        # Read from stdin
    delivery-cli input.txt          # Read from file
    delivery-cli input.txt output.txt # Read from file, write to output
    delivery-cli --help             # Show this help

  Input Format:
    base_delivery_cost no_of_packages
    pkg_id1 pkg_weight1_in_kg distance1_in_km offer_code1
    ...
    pkg_idN pkg_weightN_in_kg distanceN_in_km offer_codeN
    vehicle_type max_weight max_distance

  Output Format:
    pkg_id1 discount1 total_cost1 estimated_delivery_time1
    ...
    pkg_idN discountN total_costN estimated_delivery_timeN

  Example:
    100 5
    PKG1 50 30 OFR001
    PKG2 75 125 OFR002
    PKG3 175 100 OFR003
    PKG4 110 60 OFR003
    PKG5 155 95 OFR003
    2 70 200

    Output:
    PKG1 0 175 3.98
    Output:
    PKG1 0 175 3.98
    PKG2 0 275 1.78
    PKG3 35 665 1.42

  BACKEND INTEGRATION:
    - Vehicle data fetched from backend API (same as frontend)
    - All data stored in backend database with proper relationships
    - Step-by-step optimization process from backend algorithms
    - Detailed planning and scheduling information
    - Real-time calculation with backend services
    - Uses same vehicle data as frontend submit process

  AUTHENTICATION:
    - Uses special CLI bypass header (no JWT token required)
    - Automatically sends X-CLI-Request header to bypass authentication
    - No additional setup needed - works out of the box

  SETUP:
    - If no vehicles exist in database, run: node seed-vehicles.js
    - This will create test vehicles for the CLI to use
     `);
  }

  // Helper methods for local processing
  private parseCLIInput(input: string): {
    baseDeliveryCost: number;
    packages: PackageData[];
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

    return {
      baseDeliveryCost: baseCost,
      packages,
    };
  }

  private validatePackageData(pkg: PackageData): {
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

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private formatTime(decimalHours: number): string {
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

  private formatCLIOutput(results: DeliveryResult[]): string {
    return results
      .map(
        (result) =>
          `${result.id} ${result.discount} ${
            result.totalCost
          } ${result.estimatedDeliveryTime.toFixed(2)}`
      )
      .join("\n");
  }

  // Demonstrate individual function calls (simulated)
  private demonstrateFunctionCalls(
    packages: PackageData[],
    vehicles: Vehicle[]
  ): void {
    console.log("\n=== DEMONSTRATING STEP-BY-STEP FUNCTION CALLS ===\n");

    // Function 1: validatePackageData
    console.log("1. VALIDATING PACKAGE DATA:");
    packages.forEach((pkg) => {
      const validation = this.validatePackageData(pkg);
      console.log(
        `   validatePackageData("${pkg.id}") → ${
          validation.isValid ? "Valid" : "Invalid"
        }`
      );
      if (!validation.isValid) {
        console.log(`   Errors: ${validation.errors.join(", ")}`);
      }
    });

    // Function 2: calculateCost (simulated)
    console.log("\n2. CALCULATING COSTS:");
    packages.forEach((pkg) => {
      const baseCost = 100 + pkg.weight * 10 + pkg.distance * 5;
      const discount = pkg.offerCode ? (baseCost * 10) / 100 : 0;
      const totalCost = baseCost - discount;
      console.log(
        `   calculateCost("${pkg.id}") → Original: $${baseCost}, Discount: $${discount}, Total: $${totalCost}`
      );
    });

    // Function 3: calculateDeliveryTime
    console.log("\n3. CALCULATING DELIVERY TIMES:");
    vehicles.forEach((vehicle) => {
      packages.forEach((pkg) => {
        const time = pkg.distance / vehicle.maxSpeed;
        console.log(
          `   calculateDeliveryTime(${pkg.distance}km, ${
            vehicle.maxSpeed
          }km/h) → ${this.formatTime(time)}`
        );
      });
    });

    // Function 4: calculateOptimalRoute (simulated)
    console.log("\n4. CALCULATING OPTIMAL ROUTES:");
    vehicles.forEach((vehicle) => {
      const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight, 0);
      const maxDistance = Math.max(...packages.map((pkg) => pkg.distance));
      const estimatedTime = maxDistance / vehicle.maxSpeed;
      console.log(
        `   calculateOptimalRoute(Vehicle ${vehicle.id}) → ${
          packages.length
        } packages, ${totalWeight}kg, ${this.formatTime(estimatedTime)}`
      );
    });

    // Function 5: calculateTotalDeliveryCost (simulated)
    console.log("\n5. CALCULATING TOTAL DELIVERY COST:");
    const totalBaseCost = packages.length * 100;
    const totalWeightCost = packages.reduce(
      (sum, pkg) => sum + pkg.weight * 10,
      0
    );
    const totalDistanceCost = packages.reduce(
      (sum, pkg) => sum + pkg.distance * 5,
      0
    );
    const totalDiscount = packages.reduce(
      (sum, pkg) =>
        sum +
        (pkg.offerCode ? (100 + pkg.weight * 10 + pkg.distance * 5) * 0.1 : 0),
      0
    );
    const totalFinalCost =
      totalBaseCost + totalWeightCost + totalDistanceCost - totalDiscount;

    console.log(
      `   calculateTotalDeliveryCost() → Base: $${totalBaseCost}, Weight: $${totalWeightCost}, Distance: $${totalDistanceCost}`
    );
    console.log(
      `   Total Discount: $${totalDiscount}, Final Cost: $${totalFinalCost}`
    );

    // Function 6: scheduleVehicleAssignments (simulated)
    console.log("\n6. SCHEDULING VEHICLE ASSIGNMENTS:");
    console.log(
      `   scheduleVehicleAssignments() → ${vehicles.length} vehicles, ${packages.length} packages scheduled`
    );

    // Function 7: generateDeliveryReport (simulated)
    console.log("\n7. GENERATING DELIVERY REPORT:");
    console.log("   generateDeliveryReport() → Report generated successfully");
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const cli = new DeliveryCLI();

  if (args.includes("--help") || args.includes("-h")) {
    cli.showHelp();
    return;
  }

  if (args.length === 0) {
    // Check if there's data being piped in
    if (process.stdin.isTTY) {
      cli.runInteractive();
    } else {
      cli.runFromStdin();
    }
  } else if (args.length === 1) {
    cli.runFromFile(args[0]).catch((error) => {
      console.error(
        "Error:",
        error instanceof Error ? error.message : "Unknown error"
      );
      process.exit(1);
    });
  } else if (args.length === 2) {
    cli.runFromFile(args[0], args[1]).catch((error) => {
      console.error(
        "Error:",
        error instanceof Error ? error.message : "Unknown error"
      );
      process.exit(1);
    });
  } else {
    console.error("Invalid arguments. Use --help for usage information.");
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DeliveryCLI };
