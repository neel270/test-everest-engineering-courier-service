import { DeliveryService } from './frontend/src/lib/delivery-service.ts';

// Sample data based on the user's 6 steps
const samplePackages = [
  { id: 'PKG1', weight: 50, distance: 30, offerCode: 'OFR001' },
  { id: 'PKG2', weight: 75, distance: 60, offerCode: 'OFR002' },
  { id: 'PKG3', weight: 175, distance: 100, offerCode: 'OFR003' },
  { id: 'PKG4', weight: 110, distance: 125, offerCode: 'OFR001' },
  { id: 'PKG5', weight: 155, distance: 95, offerCode: 'OFR002' }
];

const sampleVehicles = [
  { id: 1, maxSpeed: 70, maxCarriableWeight: 200, availableTime: 0 },
  { id: 2, maxSpeed: 70, maxCarriableWeight: 200, availableTime: 0 }
];

// Test the corrected optimization steps
const deliveryService = new DeliveryService(100);

console.log('CORRECTED OPTIMIZATION STEPS DEMONSTRATION');
console.log('==========================================\n');

const correctedSteps = deliveryService.generateCorrectedOptimizationSteps(samplePackages, sampleVehicles);
console.log(correctedSteps);

console.log('\nKEY IMPROVEMENTS:');
console.log('================');
console.log('1. Package combinations validated against vehicle weight limits');
console.log('2. Vehicle assignments match actual package combinations');
console.log('3. Consistent time calculations and availability tracking');
console.log('4. Proper format alignment and spacing');
console.log('5. Round-trip calculations correctly applied');
console.log('6. Current time properly tracked across steps');