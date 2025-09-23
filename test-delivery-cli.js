import { DeliveryService } from './backend/dist-server/lib/delivery-service.js';

// Test data with completely different values to verify dynamic behavior
const testInput = `100 5
PKG1 50 30 OFR001
PKG2 75 60 OFR002
PKG3 175 100 OFR003
PKG4 110 125 OFR001
PKG5 155 95 OFR002
2 70 200`;

console.log('=== DELIVERY TIMELINE TEST ===');
console.log('Input:');
console.log(testInput);
console.log('\n' + '='.repeat(50) + '\n');

const deliveryService = new DeliveryService(100);
const parsed = deliveryService.parseCLIInput(testInput);
const { results, optimizationSteps } = deliveryService.calculateAllDeliveryResults(parsed.packages, parsed.vehicles);

// Debug: Show number of steps generated
console.log(`Generated ${optimizationSteps.length} optimization steps\n`);

// Format output to match CLI format
console.log('=== DELIVERY OPTIMIZATION PROCESS ===\n');

optimizationSteps.forEach((step, index) => {
  console.log(step.description); // This already includes the proper format

  if (step.unassignedPackages.length > 0) {
    console.log(`\nUnassigned Packages: ${step.unassignedPackages.map(pkg => `${pkg.id}(${pkg.weight}kg)`).join(', ')}`);
  }

  console.log('\n' + '='.repeat(50));
});

console.log('\n=== FINAL RESULTS ===');
results.forEach(result => {
  console.log(`${result.id} ${result.discount} ${result.totalCost} ${result.estimatedDeliveryTime}`);
});