import { DeliveryService } from './backend/dist-server/lib/delivery-service.js';

// Test data based on user's feedback
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

console.log('=== OPTIMIZATION STEPS ===');
optimizationSteps.forEach((step, index) => {
  console.log(`\nStep ${index + 1}:`);
  console.log(step.description);
});

console.log('\n=== FINAL RESULTS ===');
results.forEach(result => {
  console.log(`${result.id} ${result.discount} ${result.totalCost} ${result.estimatedDeliveryTime}`);
});

// Test completed
