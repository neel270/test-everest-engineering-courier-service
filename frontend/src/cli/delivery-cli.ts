#!/usr/bin/env node

import { DeliveryService, PackageData, Vehicle } from '../lib/delivery-service.js';
import { readFileSync, writeFileSync } from 'fs';
import * as readline from 'readline';

class DeliveryCLI {
  private deliveryService: DeliveryService;

  constructor() {
    this.deliveryService = new DeliveryService(100); // Default base cost
  }

  runFromStdin(): void {
    let input = '';
    
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (chunk) => {
      input += chunk;
    });
    
    process.stdin.on('end', () => {
      try {
        const output = this.processInput(input);
        console.log(output);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });
  }

  runFromFile(inputFile: string, outputFile?: string): void {
    try {
      const input = readFileSync(inputFile, 'utf8');
      const output = this.processInput(input);
      
      if (outputFile) {
        writeFileSync(outputFile, output);
        console.log(`Output written to ${outputFile}`);
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  runInteractive(): void {
    console.log('=== Kiki\'s Courier Service CLI ===');
    console.log('Enter the input data (press Enter twice to finish):');
    
    let input = '';
    let emptyLines = 0;
    
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.on('line', (line: string) => {
      if (line.trim() === '') {
        emptyLines++;
        if (emptyLines >= 2) {
          rl.close();
        }
      } else {
        emptyLines = 0;
        input += line + '\n';
      }
    });
    
    rl.on('close', () => {
      try {
        const output = this.processInput(input);
        console.log('\n=== Results ===');
        console.log(output);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      }
    });
  }

  private processInput(input: string): string {
    const parsed = this.deliveryService.parseCLIInput(input);

    // Update delivery service with parsed base cost
    this.deliveryService = new DeliveryService(parsed.baseDeliveryCost);

    // STEP 1: Validate package data
    console.log('=== STEP 1: VALIDATING PACKAGE DATA ===');
    const validationResults = parsed.packages.map(pkg => ({
      packageId: pkg.id,
      validation: this.deliveryService.validatePackageData(pkg)
    }));

    validationResults.forEach(result => {
      console.log(`Package ${result.packageId}: ${result.validation.isValid ? 'VALID' : 'INVALID'}`);
      if (!result.validation.isValid) {
        console.log(`  Errors: ${result.validation.errors.join(', ')}`);
      }
    });

    // STEP 2: Calculate optimal routes
    console.log('\n=== STEP 2: CALCULATING OPTIMAL ROUTES ===');
    const routeResults = parsed.vehicles.map(vehicle => {
      const route = this.deliveryService.calculateOptimalRoute(parsed.packages, vehicle);
      return {
        vehicleId: vehicle.id,
        route: route.route,
        totalDistance: route.totalDistance,
        totalWeight: route.totalWeight,
        estimatedTime: route.estimatedTime
      };
    });

    routeResults.forEach(result => {
      console.log(`Vehicle ${result.vehicleId}:`);
      console.log(`  Packages: ${result.route.map(p => p.id).join(' + ')}`);
      console.log(`  Total Weight: ${result.totalWeight}kg`);
      console.log(`  Total Distance: ${result.totalDistance}km`);
      console.log(`  Estimated Time: ${this.deliveryService.formatTime(result.estimatedTime)}`);
    });

    // STEP 3: Calculate delivery results
    console.log('\n=== STEP 3: CALCULATING DELIVERY RESULTS ===');
    const { results, optimizationSteps } = this.deliveryService.calculateAllDeliveryResults(
      parsed.packages,
      parsed.vehicles
    );

    // STEP 4: Generate delivery report
    console.log('\n=== STEP 4: GENERATING DELIVERY REPORT ===');
    const report = this.deliveryService.generateDeliveryReport(parsed.packages, parsed.vehicles, results);
    console.log(report);

    // STEP 5: Schedule vehicle assignments
    console.log('\n=== STEP 5: SCHEDULING VEHICLE ASSIGNMENTS ===');
    const schedule = this.deliveryService.scheduleVehicleAssignments(parsed.packages, parsed.vehicles);

    schedule.assignments.forEach(assignment => {
      console.log(`Vehicle ${assignment.vehicleId}:`);
      console.log(`  Packages: ${assignment.packages.map(p => p.id).join(' + ')}`);
      console.log(`  Total Weight: ${assignment.totalWeight}kg`);
      console.log(`  Total Distance: ${assignment.totalDistance}km`);
      console.log(`  Estimated Time: ${this.deliveryService.formatTime(assignment.estimatedTime)}`);
    });

    if (schedule.unassignedPackages.length > 0) {
      console.log(`Unassigned Packages: ${schedule.unassignedPackages.map(p => p.id).join(', ')}`);
    }

    // STEP 6: Calculate total delivery cost
    console.log('\n=== STEP 6: CALCULATING TOTAL DELIVERY COST ===');
    const costBreakdown = this.deliveryService.calculateTotalDeliveryCost(parsed.packages, true);

    console.log(`Total Base Cost: $${costBreakdown.totalBaseCost}`);
    console.log(`Total Weight Cost: $${costBreakdown.totalWeightCost}`);
    console.log(`Total Distance Cost: $${costBreakdown.totalDistanceCost}`);
    console.log(`Total Discount: $${costBreakdown.totalDiscount}`);
    console.log(`Total Final Cost: $${costBreakdown.totalFinalCost}`);

    // STEP 7: Demonstrate individual function calls
    this.demonstrateFunctionCalls(parsed.packages, parsed.vehicles);

    // Format output with detailed steps
    let output = this.deliveryService.formatCLIOutput(results);

    // Add optimization steps if available
    if (optimizationSteps.length > 0) {
      output += '\n\n=== DELIVERY OPTIMIZATION PROCESS ===\n\n';
      const stepsToShow = optimizationSteps.slice(0, 6);
      stepsToShow.forEach((step) => {
        output += step.description;
        if (step.vehicleAssignments.length > 0) {
          step.vehicleAssignments.forEach((assignment) => {
            output += `\nVehicle ${String(assignment.vehicleId).padStart(2, '0')}:\n`;
            output += `  Packages: ${assignment.packages.map((pkg) => pkg.id).join(' + ')}\n`;
            output += `  Total Weight: ${assignment.totalWeight}kg\n`;
            output += `  Max Distance: ${assignment.maxDistance}km\n`;
            output += `  Delivery Time: ${this.deliveryService.formatTime(assignment.deliveryTime)}\n`;
            output += `  Available After: ${this.deliveryService.formatTime(assignment.availableAfter)}\n`;
          });
        }
        if (step.unassignedPackages.length > 0) {
          output += `\nUnassigned Packages: ${step.unassignedPackages.map((pkg) => `${pkg.id}(${pkg.weight}kg)`).join(', ')}\n`;
        }
        output += '\n' + '='.repeat(50) + '\n';
      });
    }

    return output;
  }

  // STEP 7: Demonstrate individual function calls
  demonstrateFunctionCalls(packages: PackageData[], vehicles: Vehicle[]): void {
    console.log('\n=== DEMONSTRATING STEP-BY-STEP FUNCTION CALLS ===\n');

    // Function 1: validatePackageData
    console.log('1. VALIDATING PACKAGE DATA:');
    packages.forEach(pkg => {
      const validation = this.deliveryService.validatePackageData(pkg);
      console.log(`   validatePackageData("${pkg.id}") → ${validation.isValid ? 'Valid' : 'Invalid'}`);
      if (!validation.isValid) {
        console.log(`   Errors: ${validation.errors.join(', ')}`);
      }
    });

    // Function 2: calculateCost
    console.log('\n2. CALCULATING COSTS:');
    packages.forEach(pkg => {
      const cost = this.deliveryService.calculateCost(pkg);
      console.log(`   calculateCost("${pkg.id}") → Original: $${cost.originalCost}, Discount: $${cost.discount}, Total: $${cost.totalCost}`);
    });

    // Function 3: calculateDeliveryTime
    console.log('\n3. CALCULATING DELIVERY TIMES:');
    vehicles.forEach(vehicle => {
      packages.forEach(pkg => {
        const time = this.deliveryService.calculateDeliveryTime(pkg.distance, vehicle.maxSpeed);
        console.log(`   calculateDeliveryTime(${pkg.distance}km, ${vehicle.maxSpeed}km/h) → ${this.deliveryService.formatTime(time)}`);
      });
    });

    // Function 4: calculateOptimalRoute
    console.log('\n4. CALCULATING OPTIMAL ROUTES:');
    vehicles.forEach(vehicle => {
      const route = this.deliveryService.calculateOptimalRoute(packages, vehicle);
      console.log(`   calculateOptimalRoute(Vehicle ${vehicle.id}) → ${route.route.length} packages, ${route.totalWeight}kg, ${this.deliveryService.formatTime(route.estimatedTime)}`);
    });

    // Function 5: calculateTotalDeliveryCost
    console.log('\n5. CALCULATING TOTAL DELIVERY COST:');
    const totalCost = this.deliveryService.calculateTotalDeliveryCost(packages);
    console.log(`   calculateTotalDeliveryCost() → Base: $${totalCost.totalBaseCost}, Weight: $${totalCost.totalWeightCost}, Distance: $${totalCost.totalDistanceCost}`);
    console.log(`   Total Discount: $${totalCost.totalDiscount}, Final Cost: $${totalCost.totalFinalCost}`);

    // Function 6: scheduleVehicleAssignments
    console.log('\n6. SCHEDULING VEHICLE ASSIGNMENTS:');
    const schedule = this.deliveryService.scheduleVehicleAssignments(packages, vehicles);
    console.log(`   scheduleVehicleAssignments() → ${schedule.assignments.length} assignments, ${schedule.unassignedPackages.length} unassigned packages`);

    // Function 7: generateDeliveryReport
    console.log('\n7. GENERATING DELIVERY REPORT:');
    const results = this.deliveryService.calculateAllDeliveryResults(packages, vehicles).results;
    const report = this.deliveryService.generateDeliveryReport(packages, vehicles, results);
    console.log('   generateDeliveryReport() → Report generated successfully');
  }

  showHelp(): void {
    console.log(`
 Kiki's Courier Service CLI

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
   no_of_vehicles max_speed max_carriable_weight

 Output Format:
   pkg_id1 discount1 total_cost1 estimated_delivery_time1
   ...
   pkg_idN discountN total_costN estimated_delivery_timeN

 Example:
   100 3
   PKG1 5 5 OFR001
   PKG2 15 5 OFR002
   PKG3 10 100 OFR003
   2 70 200

   Output:
   PKG1 0 175 3.98
   PKG2 0 275 1.78
   PKG3 35 665 1.42

 NEW FUNCTIONS ADDED:
   - validatePackageData() - Validates package data
   - calculateOptimalRoute() - Calculates optimal delivery routes
   - generateDeliveryReport() - Creates detailed delivery reports
   - scheduleVehicleAssignments() - Schedules vehicle assignments
   - calculateTotalDeliveryCost() - Calculates total delivery costs
    `);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const cli = new DeliveryCLI();

  if (args.includes('--help') || args.includes('-h')) {
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
    cli.runFromFile(args[0]);
  } else if (args.length === 2) {
    cli.runFromFile(args[0], args[1]);
  } else {
    console.error('Invalid arguments. Use --help for usage information.');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DeliveryCLI };
