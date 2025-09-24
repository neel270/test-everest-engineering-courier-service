import {  CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowRightCircle, Package, Truck, Clock, Route, Target, ArrowRight } from "lucide-react";
import {
  AnimatedCard,
  AnimatedSection,
  AnimatedListItem,
  AnimatedCounter,
  AnimatedProgressBar,
  AnimatedPackage,
} from "@/components/ui/animations";
import type { OptimizationStep } from "@/lib/delivery-service";

interface Step6CardProps {
  step?: OptimizationStep;
}

export function Step6Card({ step }: Step6CardProps) {
  // Don't show if packagesRemaining is 0 (all packages assigned)
  if (step?.packagesRemaining === 0) {
    return null;
  }

  // Derive values from step; fallback to static demo if missing
  const currentTime = step?.currentTime ?? 0;

  // Get the first available vehicle from previous step's availability data
  const firstAvailableVehicle = step?.availability?.firstAvailable;
  const unassignedPkg = step?.unassignedPackages?.[0];

  // If we have availability data from step 5, use it to create the assignment
  let vehicleAssignment;
  if (firstAvailableVehicle && unassignedPkg) {
    const deliveryTime = firstAvailableVehicle.deliveryTime || (unassignedPkg.distance / (firstAvailableVehicle.vehicleSpeed || 70));
    const returnTime = deliveryTime * 2;

    vehicleAssignment = {
      vehicleId: firstAvailableVehicle.vehicleId,
      name: firstAvailableVehicle.name,
      packages: [unassignedPkg],
      totalWeight: unassignedPkg.weight,
      maxDistance: unassignedPkg.distance,
      deliveryTime: deliveryTime,
      returnTime: returnTime,
      availableAfter: currentTime + returnTime,
      vehicleSpeed: firstAvailableVehicle.vehicleSpeed || 70,
      perPackageTimes: [{
        id: unassignedPkg.id,
        distance: unassignedPkg.distance,
        deliveryTime: deliveryTime
      }]
    };
  } else {
    // Fallback to existing logic if no availability data
    const pkg =
      step?.packagesRemaining === 1
        ? step.unassignedPackages[0]
        : step?.vehicleAssignments?.[0]?.packages?.[0];
    const packageItem = pkg ? { id: pkg.id, weight: pkg.weight } : {};
    const va = step?.vehicleAssignments?.[0];
    const deliverTime = va ? parseFloat(va.deliveryTime.toFixed(2)) : 0;
    const speed = va?.vehicleSpeed ?? 0;
    const distance = va?.maxDistance ?? 0;

    vehicleAssignment = {
      vehicleId: va?.vehicleId || 1,
      name: va?.name || `Vehicle ${String(va?.vehicleId ?? 1).padStart(2, "0")}`,
      packages: va?.packages || (pkg ? [pkg] : []),
      totalWeight: va?.totalWeight || (pkg?.weight || 0),
      maxDistance: distance,
      deliveryTime: deliverTime,
      returnTime: deliverTime * 2,
      availableAfter: currentTime + deliverTime * 2,
      vehicleSpeed: speed,
      perPackageTimes: va?.perPackageTimes || []
    };
  }

  const vehicle = {
    name: vehicleAssignment.name,
    delivering: {
      packages: vehicleAssignment.packages,
      time: vehicleAssignment.availableAfter.toFixed(2),
      explain: `Current Time + ${vehicleAssignment.maxDistance}km/${vehicleAssignment.vehicleSpeed}km/hr`,
      expr: `(${currentTime.toFixed(2)}+ ${vehicleAssignment.deliveryTime.toFixed(2)})`,
    },
  };

  const progress = step ? Math.min(((step.packagesRemaining || 0) / 10) * 100, 100) : 0;

  return (
    <AnimatedCard className="w-full max-w-5xl shadow-xl rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50">
      <CardHeader className="text-center pb-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-t-2xl">
        <CardTitle className="flex items-center justify-center gap-3 text-xl">
          <div className="p-2 bg-white/20 rounded-full">
            <Target className="w-6 h-6" />
          </div>
          Step 6: Final Package Assignment
          <div className="p-2 bg-white/20 rounded-full">
            <Route className="w-6 h-6" />
          </div>
        </CardTitle>
        <div className="flex items-center justify-center gap-6 text-sm mt-3">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Package className="w-4 h-4" />
            <span>Remaining: </span>
            <AnimatedCounter
              value={step?.packagesRemaining ?? 1}
              className="font-bold text-lg"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Truck className="w-4 h-4" />
            <span>Vehicles: </span>
            <AnimatedCounter
              value={step?.vehiclesAvailable ?? 1}
              className="font-bold text-lg"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Clock className="w-4 h-4" />
            <span>Time: </span>
            <AnimatedCounter
              value={currentTime}
              suffix=" hrs"
              className="font-bold text-lg"
            />
          </div>
        </div>
        <div className="mt-3">
          <AnimatedProgressBar progress={progress} className="w-full max-w-xs mx-auto" />
          <p className="text-xs mt-1 opacity-90">Final Assignment Progress</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 text-[15px] pt-6">
        {/* Remaining Package Assignment */}
        <AnimatedSection delay={200}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-cyan-200">
            <h3 className="text-lg font-bold text-cyan-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
              Remaining Package Assignment
            </h3>

            {/* Show unassigned packages */}
            {step?.unassignedPackages && step.unassignedPackages.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Package to Assign</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {step.unassignedPackages.slice(0, 2).map((pkg, index) => (
                    <AnimatedListItem key={pkg.id} index={index}>
                      <AnimatedPackage
                        isSelected={index === 0}
                        className={`
                          p-4 rounded-lg border-2 transition-all duration-300
                          ${index === 0
                            ? 'border-cyan-400 bg-cyan-50 shadow-lg scale-105'
                            : 'border-gray-200 bg-white hover:border-cyan-300'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`
                              p-2 rounded-full transition-colors duration-300
                              ${index === 0 ? 'bg-cyan-500 text-white' : 'bg-gray-200 text-gray-600'}
                            `}>
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <div className={`
                                font-bold text-lg transition-colors duration-300
                                ${index === 0 ? 'text-cyan-800' : 'text-gray-700'}
                              `}>
                                {pkg.id}
                              </div>
                              <div className="text-sm text-gray-500">
                                Weight: {pkg.weight.toFixed(1)}kg • Distance: {pkg.distance.toFixed(1)}km
                              </div>
                            </div>
                          </div>
                          {index === 0 && (
                            <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">
                              Next to Assign
                            </Badge>
                          )}
                        </div>
                      </AnimatedPackage>
                    </AnimatedListItem>
                  ))}
                </div>
              </div>
            )}

            {/* Assignment Flow */}
            {firstAvailableVehicle && unassignedPkg && (
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
                <h4 className="text-md font-semibold text-cyan-800 mb-3">Assignment Flow</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                  {/* Package */}
                  <div className="text-center">
                    <div className="bg-white border-2 border-cyan-300 rounded-lg p-4 mb-3">
                      <Package className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                      <div className="font-bold text-cyan-800">{unassignedPkg.id}</div>
                      <div className="text-sm text-cyan-600">{unassignedPkg.weight.toFixed(1)}kg</div>
                    </div>
                    <div className="text-sm text-gray-600">Selected Package</div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full p-3 animate-pulse">
                      <ArrowRightCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Vehicle */}
                  <div className="text-center">
                    <div className="bg-white border-2 border-blue-300 rounded-lg p-4 mb-3">
                      <Truck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="font-bold text-blue-800">{firstAvailableVehicle.name}</div>
                      <div className="text-sm text-blue-600">Vehicle {firstAvailableVehicle.vehicleId}</div>
                    </div>
                    <div className="text-sm text-gray-600">Target Vehicle</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AnimatedSection>

        <Separator className="my-6" />

        {/* Vehicle Assignment Details */}
        <AnimatedSection delay={400}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-green-200">
            <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Vehicle Assignment Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Vehicle Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vehicle:</span>
                    <span className="font-bold text-green-800">{vehicle.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active Assignment
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Speed:</span>
                    <span className="font-bold text-green-800">{vehicleAssignment.vehicleSpeed.toFixed(1)} km/hr</span>
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Route className="w-4 h-4" />
                  Assignment Details
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Delivering:</span>
                    <span className="font-bold text-blue-800">
                      {vehicle.delivering.packages.length > 0
                        ? vehicle.delivering.packages.map((p) => p.id).join(" + ")
                        : "PKG1"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Expression:</span>
                    <span className="font-mono text-sm bg-white px-2 py-1 rounded">
                      {vehicle.delivering.expr}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Available After:</span>
                    <span className="font-bold text-blue-600">{vehicle.delivering.time} hrs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Assignment Timeline */}
        <AnimatedSection delay={600}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200">
            <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              Assignment Timeline
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center">
                  <span className="font-bold">1</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-blue-800">Package Selection</div>
                  <div className="text-sm text-gray-600">Package {unassignedPkg?.id} selected for assignment</div>
                </div>
                <div className="text-sm text-gray-500">
                  {currentTime.toFixed(2)} hrs
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-green-800">Vehicle Assignment</div>
                  <div className="text-sm text-gray-600">Assigning to {vehicle.name}</div>
                </div>
                <div className="text-sm text-gray-500">
                  In Progress
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center">
                  <span className="font-bold">3</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-600">Delivery Execution</div>
                  <div className="text-sm text-gray-500">Vehicle will complete delivery</div>
                </div>
                <div className="text-sm text-gray-500">
                  {vehicle.delivering.time} hrs
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Assignment Summary */}
        <AnimatedSection delay={800}>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
            <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              Assignment Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border border-indigo-200">
                <div className="text-2xl font-bold text-indigo-600">
                  <AnimatedCounter value={(unassignedPkg?.weight || 0).toFixed(2)} suffix="kg" />
                </div>
                <div className="text-sm text-gray-600">Package Weight</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-indigo-200">
                <div className="text-2xl font-bold text-blue-600">
                  <AnimatedCounter value={(unassignedPkg?.distance || 0).toFixed(1)} suffix="km" />
                </div>
                <div className="text-sm text-gray-600">Distance</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-indigo-200">
                <div className="text-2xl font-bold text-green-600">
                  <AnimatedCounter value={vehicleAssignment.deliveryTime.toFixed(2)} suffix="h" />
                </div>
                <div className="text-sm text-gray-600">Delivery Time</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-indigo-200">
                <div className="text-2xl font-bold text-purple-600">
                  <AnimatedCounter value={parseFloat(vehicle.delivering.time).toFixed(2)} suffix="h" />
                </div>
                <div className="text-sm text-gray-600">Available After</div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </CardContent>
    </AnimatedCard>
  );
}
