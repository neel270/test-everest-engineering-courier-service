import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightCircle,
  Package,
  Truck,
  Clock,
  Route,
  Zap,
  Target,
} from "lucide-react";
import {
  AnimatedCard,
  AnimatedSection,
  AnimatedListItem,
  AnimatedCounter,
  AnimatedProgressBar,
  AnimatedPackage,
} from "@/components/ui/animations";
import type { OptimizationStep, PackageData } from "@/lib/delivery-service";

interface Step4CardProps {
  step?: OptimizationStep;
}

export function Step4Card({ step }: Step4CardProps) {
  // Derive remaining packages and chosen (heaviest) for display
  const remaining: PackageData[] = step?.unassignedPackages ?? [];
  const [p1, p2] = remaining.length >= 2 ? remaining.slice(0, 2) : remaining;
  const most = remaining.length
    ? remaining.reduce((a, b) => (a.weight >= b.weight ? a : b))
    : null;

  const va = step?.availability?.firstAvailable;
  const currentTime = step?.currentTime ?? 0;
  const delTime = va ? va.deliveryTime : 0;
  const vehicleId = va ? va.vehicleId : 0;
  const vehicleName =
    va?.name || `Vehicle ${String(vehicleId).padStart(2, "0")}`;
  const speed = va?.vehicleSpeed ?? 0;
  const distance = most?.distance ?? 0;
  const expr = `(${currentTime.toFixed(2)}+ ${delTime.toFixed(2)})`;
  const rightTime = (currentTime + delTime).toFixed(2);
  const availableAfter = (currentTime + 2 * delTime).toFixed(2);

  const progress = step
    ? Math.min(((step.packagesRemaining || 0) / 10) * 100, 100)
    : 0;

  return (
    <AnimatedCard className="w-full max-w-5xl shadow-xl rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
      <CardHeader className="text-center pb-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-2xl">
        <CardTitle className="flex items-center justify-center gap-3 text-xl">
          <div className="p-2 bg-white/20 rounded-full">
            <Target className="w-6 h-6" />
          </div>
          Step 4: Intelligent Package-to-Vehicle Assignment & Route Optimization
          <div className="p-2 bg-white/20 rounded-full">
            <Route className="w-6 h-6" />
          </div>
        </CardTitle>
        <div className="flex items-center justify-center gap-6 text-sm mt-3">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Package className="w-4 h-4" />
            <span>Remaining: </span>
            <AnimatedCounter
              value={step?.packagesRemaining ?? 2}
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
          <AnimatedProgressBar
            progress={progress}
            className="w-full max-w-xs mx-auto"
          />
          <p className="text-xs mt-1 opacity-90">Assignment Progress</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 text-[15px] pt-6">
        {/* Package Selection */}
        <AnimatedSection delay={200}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
            <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              Advanced Package Selection Analysis & Optimization Strategy
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Packages */}
              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-3">
                  Available Packages
                </h4>
                <div className="space-y-3">
                  {remaining.slice(0, 3).map((pkg, index) => (
                    <AnimatedListItem key={pkg.id} index={index}>
                      <AnimatedPackage
                        isSelected={pkg.id === most?.id}
                        className={`
                          p-3 rounded-lg border-2 transition-all duration-300
                          ${
                            pkg.id === most?.id
                              ? "border-orange-400 bg-orange-100 shadow-lg scale-105"
                              : "border-gray-200 bg-white hover:border-orange-300"
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`
                              p-2 rounded-full transition-colors duration-300
                              ${
                                pkg.id === most?.id
                                  ? "bg-orange-500 text-white"
                                  : "bg-gray-200 text-gray-600"
                              }
                            `}
                            >
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <div
                                className={`
                                font-bold text-lg transition-colors duration-300
                                ${
                                  pkg.id === most?.id
                                    ? "text-orange-800"
                                    : "text-gray-700"
                                }
                              `}
                              >
                                {pkg.id}
                              </div>
                              <div className="text-sm text-gray-500">
                                {pkg.weight.toFixed(1)}kg •{" "}
                                {pkg.distance.toFixed(1)}km
                              </div>
                            </div>
                          </div>
                          {pkg.id === most?.id && (
                            <Badge
                              variant="secondary"
                              className="bg-orange-100 text-orange-800"
                            >
                              Selected
                            </Badge>
                          )}
                        </div>
                      </AnimatedPackage>
                    </AnimatedListItem>
                  ))}
                </div>
              </div>

              {/* Selection Summary */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-orange-800 mb-3">
                  Selection Summary
                </h4>
                {most && (
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-orange-200">
                      <div className="text-sm font-semibold text-orange-800 mb-1">
                        Selected Package
                      </div>
                      <div className="text-lg font-bold text-orange-900">
                        {most.id}
                      </div>
                      <div className="text-sm text-orange-700">
                        Weight: {most.weight.toFixed(1)}kg
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-orange-200">
                      <div className="text-sm font-semibold text-orange-800 mb-1">
                        Optimization Criteria
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Weight Priority:</span>
                          <span className="font-medium text-green-600">
                            ✓ Optimal
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Distance Factor:</span>
                          <span className="font-medium">
                            {most.distance.toFixed(1)}km
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vehicle Match:</span>
                          <span className="font-medium text-blue-600">
                            ✓ Compatible
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </AnimatedSection>

        <Separator className="my-6" />

        {/* Assignment Flow */}
        <AnimatedSection delay={400}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-red-200">
            <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Intelligent Assignment Flow & Route Planning Visualization
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Package */}
              <div className="text-center">
                <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 mb-3">
                  <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-bold text-blue-800">{most?.id}</div>
                  <div className="text-sm text-blue-600">
                    {most?.weight.toFixed(1)}kg
                  </div>
                </div>
                <div className="text-sm text-gray-600">Selected Package</div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-blue-500 to-red-500 rounded-full p-3">
                  <ArrowRightCircle className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>

              {/* Vehicle */}
              <div className="text-center">
                <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-3">
                  <Truck className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="font-bold text-red-800">{vehicleName}</div>
                  <div className="text-sm text-red-600">
                    Vehicle {vehicleId}
                  </div>
                </div>
                <div className="text-sm text-gray-600">Target Vehicle</div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <Separator className="my-6" />

        {/* Assignment Details */}
        <AnimatedSection delay={600}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-green-200">
            <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Comprehensive Assignment Details & Route Optimization Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Assignment */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Vehicle Assignment
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vehicle:</span>
                    <span className="font-bold text-green-800">
                      {vehicleName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Package:</span>
                    <span className="font-bold text-green-800">{most?.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Expression:</span>
                    <span className="font-mono text-sm bg-white px-2 py-1 rounded">
                      {expr}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Delivery Time:
                    </span>
                    <span className="font-bold text-green-600">
                      {rightTime} hrs
                    </span>
                  </div>
                </div>
              </div>

              {/* Route Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Route className="w-4 h-4" />
                  Route Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Distance:</span>
                    <span className="font-bold text-blue-800">
                      {distance.toFixed(1)}km
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Speed:</span>
                    <span className="font-bold text-blue-800">
                      {speed.toFixed(1)} km/hr
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Time:</span>
                    <span className="font-bold text-blue-800">
                      {currentTime.toFixed(2)} hrs
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Available After:
                    </span>
                    <span className="font-bold text-blue-600">
                      {availableAfter} hrs
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Assignment Summary */}
        <AnimatedSection delay={800}>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
            <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              Comprehensive Assignment Summary & Performance Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  <AnimatedCounter
                    value={(most?.weight || 0).toFixed(1)}
                    suffix="kg"
                  />
                </div>
                <div className="text-sm text-gray-600">Package Weight</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-blue-600">
                  <AnimatedCounter value={distance.toFixed(1)} suffix="km" />
                </div>
                <div className="text-sm text-gray-600">Distance</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-green-600">
                  <AnimatedCounter value={parseFloat(rightTime)} suffix="h" />
                </div>
                <div className="text-sm text-gray-600">Delivery Time</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-orange-600">
                  <AnimatedCounter
                    value={parseFloat(availableAfter)}
                    suffix="h"
                  />
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
