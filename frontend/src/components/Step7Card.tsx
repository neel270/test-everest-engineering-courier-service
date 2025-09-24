import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Package,
  Truck,
  Clock,
  BarChart3,
  MapPin,
  Trophy,
  Star,
  Zap,
} from "lucide-react";
import {
  AnimatedCard,
  AnimatedSection,
  AnimatedListItem,
  AnimatedCounter,
  AnimatedVehicle,
  CelebrationEffect,
  ConfettiEffect,
} from "@/components/ui/animations";
import type { OptimizationStep } from "@/lib/delivery-service";

interface Step7CardProps {
  step?: OptimizationStep;
}

export function Step7Card({ step }: Step7CardProps) {
  // Only show if packagesRemaining is 0 (all packages assigned)
  if (!step || step.packagesRemaining > 0) {
    return null;
  }

  const currentTime = step.currentTime ?? 0;

  // Merge vehicle assignments if duplicates exist
  const mergeVehicleAssignments = (assignments: Array<{
    vehicleId: string;
    name: string;
    packages: Array<{ id: string; weight: number }>;
    totalWeight: number;
    availableAfter: number;
    maxDistance: number;
    deliveryTime: number;
    returnTime: number;
    vehicleSpeed?: number;
  }>) => {
    const merged = new Map();

    assignments.forEach(assignment => {
      const key = assignment.vehicleId;

      if (merged.has(key)) {
        // Merge with existing assignment
        const existing = merged.get(key);

        // Merge arrays (packages)
        existing.packages = [...existing.packages, ...assignment.packages];

        // Add numeric values
        existing.totalWeight += assignment.totalWeight;
        existing.maxDistance += assignment.maxDistance;
        existing.availableAfter = Math.max(existing.availableAfter, assignment.availableAfter);

        // Add time values
        existing.deliveryTime += assignment.deliveryTime;
        existing.returnTime += assignment.returnTime;

        // Keep the first name (or could merge if needed)
        if (!existing.name) {
          existing.name = assignment.name;
        }
      } else {
        // Add new assignment
        merged.set(key, { ...assignment });
      }
    });

    return Array.from(merged.values());
  };

  const vehicleAssignments = step.vehicleAssignments
    ? mergeVehicleAssignments(
        step.vehicleAssignments.map((assignment) => ({
          ...assignment,
          vehicleId: String(assignment.vehicleId),
        }))
      )
    : [];

  // Calculate summary statistics
  const totalPackages = vehicleAssignments.reduce(
    (sum, va) => sum + va.packages.length,
    0
  );
  const totalWeight = vehicleAssignments.reduce(
    (sum, va) => sum + va.totalWeight,
    0
  );
  const totalVehicles = vehicleAssignments.length;
  const maxDeliveryTime = Math.max(
    ...vehicleAssignments.map((va) => va.availableAfter),
    0
  );
  const efficiency = (totalWeight / (totalVehicles * 200)) * 100;

  return (
    <>
      <ConfettiEffect show={true} />
      <AnimatedCard className="w-full max-w-6xl shadow-2xl rounded-2xl border-4 border-green-300 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
        {/* Celebration Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-emerald-400/10 to-teal-400/10 animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />

        <CardHeader className="text-center pb-6 relative z-10">
          <CelebrationEffect show={true}>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="p-4 bg-green-500 text-white rounded-full animate-bounce">
                <Trophy className="w-8 h-8" />
              </div>
              <CardTitle className="text-3xl font-bold text-green-800">
                🎉 DELIVERY PLANNING COMPLETE! 🎉
              </CardTitle>
              <div className="p-4 bg-green-500 text-white rounded-full animate-bounce">
                <Star className="w-8 h-8" />
              </div>
            </div>
          </CelebrationEffect>

          <div className="flex items-center justify-center gap-6 text-lg text-green-700 mt-4">
            <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-md">
              <Package className="w-5 h-5" />
              <span className="font-bold">
                <AnimatedCounter value={totalPackages} /> packages
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-md">
              <Truck className="w-5 h-5" />
              <span className="font-bold">
                <AnimatedCounter value={totalVehicles} /> vehicles
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-md">
              <Clock className="w-5 h-5" />
              <span className="font-bold">
                <AnimatedCounter value={maxDeliveryTime} suffix=" hrs" />
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 text-[15px] pt-6 relative z-10">
          {/* Success Message */}
          <AnimatedSection delay={200}>
            <div className="text-center p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl border-2 border-green-200">
              <div className="flex items-center justify-center gap-3 text-green-800 mb-3">
                <CheckCircle className="w-8 h-8 animate-pulse" />
                <span className="text-2xl font-bold">
                  MISSION ACCOMPLISHED!
                </span>
                <CheckCircle className="w-8 h-8 animate-pulse" />
              </div>
              <p className="text-lg text-green-700 mb-4">
                All{" "}
                <span className="font-bold text-green-800">
                  {totalPackages}
                </span>{" "}
                packages have been successfully assigned to{" "}
                <span className="font-bold text-green-800">
                  {totalVehicles}
                </span>{" "}
                vehicle{totalVehicles !== 1 ? "s" : ""} with optimal routing and
                timing.
              </p>
              <div className="flex items-center justify-center gap-2 text-green-600">
                <Zap className="w-5 h-5" />
                <span className="font-semibold">
                  Optimization Complete • 100% Success Rate
                </span>
                <Zap className="w-5 h-5" />
              </div>
            </div>
          </AnimatedSection>

          {/* Summary Statistics */}
          <AnimatedSection delay={400}>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-green-200 shadow-lg">
              <h3 className="text-xl font-bold text-green-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Performance Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    <AnimatedCounter value={totalPackages} />
                  </div>
                  <div className="text-sm text-gray-600">Total Packages</div>
                  <div className="text-xs text-green-500 mt-1">✓ Delivered</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    <AnimatedCounter value={totalVehicles} />
                  </div>
                  <div className="text-sm text-gray-600">Vehicles Used</div>
                  <div className="text-xs text-blue-500 mt-1">✓ Optimized</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    <AnimatedCounter value={totalWeight} suffix="kg" />
                  </div>
                  <div className="text-sm text-gray-600">Total Weight</div>
                  <div className="text-xs text-purple-500 mt-1">✓ Balanced</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    <AnimatedCounter value={Number(maxDeliveryTime).toFixed(2)} suffix="h" />
                  </div>
                  <div className="text-sm text-gray-600">Total Time</div>
                  <div className="text-xs text-orange-500 mt-1">
                    ✓ Efficient
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <Separator className="my-8" />

          {/* Vehicle Assignments Table */}
          <AnimatedSection delay={600}>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-green-200 shadow-lg">
              <h3 className="text-xl font-bold text-green-800 mb-6 flex items-center gap-2">
                <Truck className="w-6 h-6" />
                Vehicle Assignment Details
              </h3>
              <div className="space-y-6">
                {vehicleAssignments.map((assignment, index) => (
                  <AnimatedListItem key={assignment.vehicleId} index={index}>
                    <AnimatedVehicle
                      isAssigned={true}
                      className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 shadow-md"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-green-500 text-white rounded-full">
                            <Truck className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xl text-green-800">
                              {assignment.name}
                            </h4>
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800 mt-1"
                            >
                              {assignment.packages.length} packages assigned
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {assignment.availableAfter.toFixed(2)} hrs
                          </div>
                          <div className="text-sm text-gray-500">
                            Available after
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Packages */}
                        <div className="lg:col-span-2">
                          <h5 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Assigned Packages
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {assignment.packages.map((pkg) => (
                              <div
                                key={pkg.id}
                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-500 text-white rounded-full">
                                    <Package className="w-4 h-4" />
                                  </div>
                                  <span className="font-semibold text-gray-800">
                                    {pkg.id}
                                  </span>
                                </div>
                                <div className="text-sm font-medium text-gray-600">
                                  {pkg.weight.toFixed(1)}kg
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t border-green-200">
                            <div className="flex justify-between text-sm">
                              <span className="font-semibold text-gray-700">
                                Total Weight:
                              </span>
                              <span className="font-bold text-green-600">
                                {assignment.totalWeight.toFixed(1)}kg
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Trip Details */}
                        <div>
                          <h5 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Trip Details
                          </h5>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between p-2 bg-white rounded border">
                              <span className="text-gray-600">
                                Max Distance:
                              </span>
                              <span className="font-semibold text-gray-800">
                                {assignment.maxDistance.toFixed(1)}km
                              </span>
                            </div>
                            <div className="flex justify-between p-2 bg-white rounded border">
                              <span className="text-gray-600">
                                Delivery Time:
                              </span>
                              <span className="font-semibold text-green-600">
                                {assignment.deliveryTime.toFixed(2)} hrs
                              </span>
                            </div>
                            <div className="flex justify-between p-2 bg-white rounded border">
                              <span className="text-gray-600">
                                Return Time:
                              </span>
                              <span className="font-semibold text-blue-600">
                                {assignment.returnTime.toFixed(2)} hrs
                              </span>
                            </div>
                            <div className="flex justify-between p-2 bg-white rounded border">
                              <span className="text-gray-600">
                                Vehicle Speed:
                              </span>
                              <span className="font-semibold text-purple-600">
                                {(assignment.vehicleSpeed || 70).toFixed(1)}{" "}
                                km/hr
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AnimatedVehicle>
                  </AnimatedListItem>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Final Achievement */}
          <AnimatedSection delay={800}>
            <div className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-300 shadow-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Trophy className="w-8 h-8 text-yellow-600 animate-bounce" />
                  <h3 className="text-2xl font-bold text-yellow-800">
                    ACHIEVEMENT UNLOCKED!
                  </h3>
                  <Trophy className="w-8 h-8 text-yellow-600 animate-bounce" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white/80 rounded-lg p-4 border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                      <AnimatedCounter value={Number(efficiency).toFixed(2)} suffix="%" />
                    </div>
                    <div className="text-sm text-gray-600">
                      Vehicle Utilization
                    </div>
                  </div>
                  <div className="bg-white/80 rounded-lg p-4 border border-yellow-200">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      <AnimatedCounter value={totalPackages} />
                    </div>
                    <div className="text-sm text-gray-600">
                      Packages Delivered
                    </div>
                  </div>
                  <div className="bg-white/80 rounded-lg p-4 border border-yellow-200">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      <AnimatedCounter value={totalVehicles} />
                    </div>
                    <div className="text-sm text-gray-600">
                      Vehicles Optimized
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 rounded-lg p-4 border-2 border-yellow-300">
                  <p className="text-lg text-gray-700 mb-2">
                    <span className="font-bold text-yellow-800">Optimization Success:
                    </span>{" "}
                    All packages have been efficiently assigned with optimal
                    routing, balanced weight distribution, and minimal delivery
                    time.
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      100% Package Assignment
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Optimal Route Planning
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-purple-500" />
                      Fleet Efficiency Maximized
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </CardContent>
      </AnimatedCard>
    </>
  );
}
