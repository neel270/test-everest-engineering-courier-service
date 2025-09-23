import { DeliveryService } from './backend/dist-server/lib/delivery-service.js';

// Test data based on user's feedback
const testInput = `100 5
PKG1 50 50 OFR001
PKG2 75 75 OFR002
PKG3 155 100 OFR003
PKG4 110 60 OFR001
PKG5 50 95 OFR002
2 70 200`;

console.log('=== DELIVERY TIMELINE WITH OPTIMIZATION SUMMARY ===');
console.log('Input:');
console.log(testInput);
console.log('\n' + '='.repeat(60) + '\n');

const deliveryService = new DeliveryService(100);
const parsed = deliveryService.parseCLIInput(testInput);
const { results, optimizationSteps } = deliveryService.calculateAllDeliveryResults(parsed.packages, parsed.vehicles);

console.log('=== DETAILED OPTIMIZATION STEPS ===');
optimizationSteps.forEach((step, index) => {
  console.log(`\nStep ${index + 1}:`);
  console.log(step.description);
});

console.log('\n=== FINAL DELIVERY RESULTS ===');
results.forEach(result => {
  console.log(`${result.id} ${result.discount} ${result.totalCost} ${result.estimatedDeliveryTime}`);
});

console.log('\n=== OPTIMIZATION SUMMARY ===');
console.log(`Total Steps: ${optimizationSteps.length - 1}`);
console.log(`Final Time: ${DeliveryService.formatTime(Math.max(...results.map(r => r.estimatedDeliveryTime)))}`);
console.log(`Packages Delivered: ${results.length}`);
