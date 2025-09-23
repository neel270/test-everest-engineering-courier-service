// Simple test for delivery planning logic
// This demonstrates the delivery planning algorithm

const packages = [
  { id: 'PKG1', weight: 50, distance: 30 },
  { id: 'PKG2', weight: 75, distance: 60 },
  { id: 'PKG3', weight: 175, distance: 100 },
  { id: 'PKG4', weight: 110, distance: 125 },
  { id: 'PKG5', weight: 155, distance: 95 }
];

const vehicles = [
  { id: 1, maxSpeed: 70, maxCarriableWeight: 200, availableTime: 0 },
  { id: 2, maxSpeed: 70, maxCarriableWeight: 200, availableTime: 0 }
];

console.log('=== DELIVERY PLANNING DEMONSTRATION ===');
console.log('Packages:', packages.length);
console.log('Vehicles:', vehicles.length);
console.log('Vehicle capacity: 200kg, Speed: 70km/hr');
console.log('\n' + '='.repeat(50) + '\n');

// Simulate the delivery planning logic
function formatTime(decimalHours) {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

function calculateDeliveryTime(distance, speed) {
  return distance / speed;
}

let remainingPackages = [...packages];
let availableVehicles = [...vehicles];
let currentTime = 0;
let stepNumber = 1;

// Sort packages by weight (heavier first)
remainingPackages.sort((a, b) => b.weight - a.weight);

while (remainingPackages.length > 0) {
  console.log(`STEP ${String(stepNumber).padStart(2, "0")}`);
  console.log(`Packages Remaining: ${String(remainingPackages.length).padStart(2, "0")}`);
  console.log(`Vehicles Available: ${String(availableVehicles.length).padStart(2, "0")} | Current Time: ${currentTime} hrs`);
  console.log(`-------------------------------------------------`);

  // Step 1: Check combinations for two packages
  const maxLoad = 200;
  const combos = [];

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
    console.log(`(No valid 2-package combinations within vehicle limits)`);
  } else {
    combos.forEach((combo) => {
      console.log(`${combo.pkg1.id} ${combo.pkg1.weight}kg + ${combo.pkg2.id} ${combo.pkg2.weight}kg   →   02 packages ${combo.totalWeight}kg`);
    });
  }

  console.log(`-------------------------------------------`);

  // Step 2: Assign packages to vehicles
  const readyVehicles = availableVehicles.filter(v => v.availableTime <= currentTime);

  for (const vehicle of readyVehicles) {
    if (remainingPackages.length === 0) break;

    // Find heaviest package that fits
    const heaviestPackage = remainingPackages.reduce((heaviest, pkg) => {
      if (pkg.weight <= vehicle.maxCarriableWeight) {
        if (!heaviest || pkg.weight > heaviest.weight) {
          return pkg;
        }
      }
      return heaviest;
    }, null);

    if (heaviestPackage) {
      const deliveryTime = calculateDeliveryTime(heaviestPackage.distance, vehicle.maxSpeed);

      console.log(`Vehicle ${String(vehicle.id).padStart(2, "0")}          Delivering ${heaviestPackage.id}         ${formatTime(deliveryTime)}`);
      console.log(`                    ${heaviestPackage.distance}km/${vehicle.maxSpeed}km/hr`);

      console.log(`Vehicle ${String(vehicle.id).padStart(2, "0")} will be available after (2*${deliveryTime.toFixed(2)})  ${(deliveryTime * 2).toFixed(2)} hrs\n`);

      // Remove delivered package
      const index = remainingPackages.findIndex((p) => p.id === heaviestPackage.id);
      if (index !== -1) {
        remainingPackages.splice(index, 1);
      }

      // Update vehicle availability
      vehicle.availableTime = currentTime + (deliveryTime * 2);
    }
  }

  // Step 3: Calculate vehicle availability
  if (remainingPackages.length > 0) {
    const nextAvailableVehicle = availableVehicles.reduce((earliest, vehicle) => {
      return vehicle.availableTime < earliest.availableTime ? vehicle : earliest;
    }, availableVehicles[0]);

    if (nextAvailableVehicle) {
      currentTime = nextAvailableVehicle.availableTime;
    }
  }

  stepNumber++;
  console.log();
}

console.log('=== DELIVERY PLANNING COMPLETE ===');