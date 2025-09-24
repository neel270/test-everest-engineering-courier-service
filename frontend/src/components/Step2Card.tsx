import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {  Package, Truck, Clock, Weight, Zap, Target } from "lucide-react";
import {
  AnimatedCard,
  AnimatedSection,
  AnimatedListItem,
  AnimatedCounter,
  AnimatedProgressBar,
  AnimatedPackage,
  AnimatedVehicle,
} from "@/components/ui/animations";
import type { OptimizationStep } from "@/lib/delivery-service";

interface Step2CardProps {
  step?: OptimizationStep;
}

export function Step2Card({ step }: Step2CardProps) {
  const packages = step?.combos?.length
    ? Array.from(new Set(step.combos.flatMap((c) => c.packageIds))).map(
        (id) => ({
          id,
          weight:
            step?.unassignedPackages.find((p) => p.id === id)?.weight ?? 0,
        })
      ).sort((a, b) => b.weight - a.weight)
    : step?.unassignedPackages
    ? [...step.unassignedPackages]
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5)
        .map((p) => ({ id: p.id, weight: p.weight }))
    : [];

  const vehicleAssignments = step?.vehicleAssignments || [];
  const vehicles = vehicleAssignments.map((vehicleAssignment) => ({
    id: vehicleAssignment.vehicleId,
    name:
      vehicleAssignment.name ??
      `Vehicle ${String(vehicleAssignment.vehicleId).padStart(2, "0")}`,
    delivering: {
      packages: vehicleAssignment.packages,
      distance: vehicleAssignment.maxDistance,
      speed: vehicleAssignment.vehicleSpeed ?? 70,
      time: parseFloat(vehicleAssignment.deliveryTime.toFixed(2)),
    },
    availableAfter: parseFloat(vehicleAssignment.returnTime.toFixed(2)),
  }));

  // Calculate aggregate heaviest data across all assignments
  const allPackages = vehicles.flatMap(v => v.delivering.packages);
  const aggregateHeaviest = allPackages.length > 0
    ? allPackages.reduce((heaviest, pkg) =>
        (pkg.weight || 0) > (heaviest.weight || 0) ? pkg : heaviest
      )
    : null;

  const progress = step ? Math.min(((step.packagesRemaining || 0) / 10) * 100, 100) : 0;
  const heaviestAvailable = step?.heaviest;

  return (
    <AnimatedCard className="w-full max-w-5xl shadow-xl rounded-2xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
      <CardHeader className="text-center pb-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-t-2xl">
        <CardTitle className="flex items-center justify-center gap-3 text-xl">
          <div className="p-2 bg-white/20 rounded-full">
            <Target className="w-6 h-6" />
          </div>
          Step 2: Advanced Package Selection & Comprehensive Weight Analysis
          <div className="p-2 bg-white/20 rounded-full">
            <Weight className="w-6 h-6" />
          </div>
        </CardTitle>
        <div className="flex items-center justify-center gap-6 text-sm mt-3">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Package className="w-4 h-4" />
            <span>Remaining: </span>
            <AnimatedCounter
              value={step?.packagesRemaining ?? 3}
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
              value={step ? step.currentTime : 0}
              suffix=" hrs"
              className="font-bold text-lg"
            />
          </div>
        </div>
        <div className="mt-3">
          <AnimatedProgressBar progress={progress} className="w-full max-w-xs mx-auto" />
          <p className="text-xs mt-1 opacity-90">Selection Progress</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 text-[15px] pt-6">
        {/* Package Selection Analysis */}
        <AnimatedSection delay={200}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-yellow-200">
            <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              Intelligent Package Selection Analysis & Weight Distribution Strategy
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Available Packages */}
              <div className="lg:col-span-2">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Available Packages</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {packages.map((p, index) => (
                    <AnimatedListItem key={p.id} index={index}>
                      <AnimatedPackage
                        isSelected={index === 0}
                        className={`
                          p-3 rounded-lg border-2 transition-all duration-300 cursor-pointer
                          ${index === 0
                            ? 'border-yellow-400 bg-yellow-100 shadow-lg scale-105'
                            : 'border-gray-200 bg-white hover:border-yellow-300 hover:shadow-md'
                          }
                        `}
                      >
                        <div className="text-center">
                          <div className={`
                            text-lg font-bold transition-colors duration-300
                            ${index === 0 ? 'text-yellow-800' : 'text-gray-700'}
                          `}>
                            {p.id}
                          </div>
                          <div className={`
                            text-sm transition-colors duration-300
                            ${index === 0 ? 'text-yellow-600' : 'text-gray-500'}
                          `}>
                            {p.weight}kg
                          </div>
                          {index === 0 && (
                            <div className="text-xs text-yellow-700 font-semibold mt-1">
                              ⚡ Heaviest
                            </div>
                          )}
                        </div>
                      </AnimatedPackage>
                    </AnimatedListItem>
                  ))}
                </div>
              </div>

              {/* Analysis Summary */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Analysis Summary</h4>

                {/* Heaviest Available */}
                {heaviestAvailable && (
                  <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3">
                    <div className="text-sm font-semibold text-yellow-800 mb-1">Heaviest Available</div>
                    <div className="text-lg font-bold text-yellow-900">
                      {heaviestAvailable.id}
                    </div>
                    <div className="text-sm text-yellow-700">
                      {heaviestAvailable.weight}kg
                    </div>
                  </div>
                )}

                {/* Total Weight */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm font-semibold text-blue-800 mb-1">Total Weight</div>
                  <div className="text-lg font-bold text-blue-900">
                    {packages.reduce((sum, p) => sum + p.weight, 0).toFixed(1)}kg
                  </div>
                  <div className="text-xs text-blue-600">
                    {packages.length} packages
                  </div>
                </div>

                {/* Heaviest Assigned */}
                {aggregateHeaviest && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm font-semibold text-green-800 mb-1">Heaviest Assigned</div>
                    <div className="text-lg font-bold text-green-900">
                      {aggregateHeaviest.id}
                    </div>
                    <div className="text-sm text-green-700">
                      {aggregateHeaviest.weight || 0}kg
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </AnimatedSection>

        <Separator className="my-6" />

        {/* Vehicle Assignments */}
        {vehicles.length > 0 && (
          <AnimatedSection delay={400}>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200">
              <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                Comprehensive Vehicle Assignment & Route Optimization Details
              </h3>

              <div className="space-y-4">
                {vehicles.map((vehicle, index) => (
                  <AnimatedListItem key={vehicle.id} index={index}>
                    <AnimatedVehicle
                      isAssigned={true}
                      className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-500 text-white rounded-full">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-amber-800">{vehicle.name}</h4>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                              {vehicle.delivering.packages.length} packages
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-amber-600">
                            {vehicle.availableAfter} hrs
                          </div>
                          <div className="text-xs text-gray-500">Available after</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="font-semibold text-gray-700 mb-2">Delivering Packages</div>
                          <div className="space-y-1">
                            {vehicle.delivering.packages.map((pkg, pkgIndex) => (
                              <div key={pkgIndex} className="flex items-center justify-between">
                                <span className="font-medium">{pkg.id}</span>
                                <span className="text-sm text-gray-600">{pkg.weight}kg</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="font-semibold text-gray-700 mb-2">Route Details</div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Distance:</span>
                              <span className="font-medium">{vehicle.delivering.distance}km</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Speed:</span>
                              <span className="font-medium">{vehicle.delivering.speed} km/hr</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Delivery Time:</span>
                              <span className="font-medium">{vehicle.delivering.time} hrs</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Heaviest Package in Assignment */}
                      {vehicle.delivering.packages.length > 0 && (
                        <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3">
                          <div className="text-sm font-semibold text-yellow-800 mb-1">Heaviest in {vehicle.name}</div>
                          <div className="text-lg font-bold text-yellow-900">
                            {(() => {
                              const heaviest = vehicle.delivering.packages.reduce((max, p) =>
                                (p.weight || 0) > (max.weight || 0) ? p : max
                              );
                              return `${heaviest.id} (${heaviest.weight || 0}kg)`;
                            })()}
                          </div>
                        </div>
                      )}
                    </AnimatedVehicle>
                  </AnimatedListItem>
                ))}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Aggregate Statistics */}
        {aggregateHeaviest && (
          <>
            <Separator className="my-6" />
            <AnimatedSection delay={600}>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Advanced Cross-Vehicle Analysis & Fleet Optimization Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      <AnimatedCounter value={allPackages.length} />
                    </div>
                    <div className="text-sm text-gray-600">Total Packages</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-blue-600">
                        <AnimatedCounter value={(aggregateHeaviest.weight || 0).toFixed(1)} suffix="kg" />
                      </div>
                    <div className="text-sm text-gray-600">Heaviest Package</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-purple-600">
                      <AnimatedCounter value={vehicles.length} />
                    </div>
                    <div className="text-sm text-gray-600">Active Vehicles</div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </>
        )}
      </CardContent>
    </AnimatedCard>
  );
}
