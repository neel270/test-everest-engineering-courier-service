#!/usr/bin/env node

import { DeliveryService } from '../lib/delivery-service.js';
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

    // Calculate results
    const { results, optimizationSteps } = this.deliveryService.calculateAllDeliveryResults(
      parsed.packages,
      parsed.vehicles
    );

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
