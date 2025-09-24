import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ArrowRightCircle,
  Package,
  Truck,
  Clock,
  Zap,
} from "lucide-react";
import {
  AnimatedCard,
  AnimatedSection,
  AnimatedListItem,
  AnimatedCounter,
  AnimatedProgressBar,
} from "@/components/ui/animations";
import type { OptimizationStep } from "@/lib/delivery-service";

interface Step1CardProps {
  step?: OptimizationStep;
}

export function Step1Card({ step }: Step1CardProps) {
  const maxWeight =
    step?.combos?.reduce((max, c) => Math.max(max, c.total), 0) ?? 0;

  const progress = step
    ? Math.min(((step.packagesRemaining || 0) / 10) * 100, 100)
    : 0;

  return (
    <AnimatedCard className="w-full shadow-xl rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="text-center pb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
        <CardTitle className="flex items-center justify-center gap-3 text-xl">
          <div className="p-2 bg-white/20 rounded-full">
            <Package className="w-6 h-6" />
          </div>
          Step 1: Package Selection & Optimization
          <div className="p-2 bg-white/20 rounded-full">
            <Zap className="w-6 h-6" />
          </div>
        </CardTitle>
        <div className="flex items-center justify-center gap-6 text-sm mt-3">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Package className="w-4 h-4" />
            <span>Packages Remaining: </span>
            <AnimatedCounter
              value={step?.packagesRemaining ?? 0}
              className="font-bold text-lg"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Truck className="w-4 h-4" />
            <span>Vehicles: </span>
            <AnimatedCounter
              value={step?.vehiclesAvailable ?? 0}
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
          <AnimatedProgressBar
            progress={progress}
            className="w-full max-w-xs mx-auto"
          />
          <p className="text-xs mt-1 opacity-90">Optimization Progress</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 text-[15px] pt-6">
        {/* Package Combinations Section */}
        <AnimatedSection delay={200}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Package Combinations Analysis
            </h3>

            <div className="space-y-3">
              {(step?.combos && step.combos.length > 0 ? step.combos : []).map(
                (c, idx) => (
                  <AnimatedListItem key={idx} index={idx}>
                    <div
                      className={`
                    p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md
                    ${
                      maxWeight === c.total
                        ? "border-green-300 bg-green-50 shadow-green-100"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }
                  `}
                    >
                      <div className="flex items-center justify-between">
                        {/* Package IDs */}
                        <div className="flex items-center gap-2 flex-1">
                          {c.packageIds.map((packageId, pkgIdx) => (
                            <div
                              key={pkgIdx}
                              className="flex items-center gap-2"
                            >
                              <div
                                className={`
                              px-3 py-2 rounded-lg font-semibold text-white transition-all duration-300
                              ${
                                maxWeight === c.total
                                  ? "bg-green-500 shadow-lg"
                                  : "bg-blue-500 hover:bg-blue-600"
                              }
                            `}
                              >
                                {packageId}
                                <sub className="text-xs opacity-90 ml-1">
                                  {c.packageWeights[pkgIdx]}kg
                                </sub>
                              </div>
                              {pkgIdx < c.packageIds.length - 1 && (
                                <div className="flex items-center gap-1">
                                  <Plus className="w-4 h-4 text-blue-400" />
                                  <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Arrow */}
                        <div className="mx-4 flex items-center">
                          <ArrowRightCircle className="w-6 h-6 text-blue-400 animate-pulse" />
                        </div>

                        {/* Result */}
                        <div
                          className={`
                        px-4 py-2 rounded-lg font-semibold text-right min-w-[120px]
                        ${
                          maxWeight === c.total
                            ? "bg-green-500 text-white shadow-lg"
                            : "bg-gray-100 text-gray-700"
                        }
                      `}
                        >
                          <div>{c.count} packages</div>
                          <div
                            className={`
                          text-sm transition-all duration-300
                          ${
                            maxWeight === c.total
                              ? "text-green-100"
                              : "text-gray-500"
                          }
                        `}
                          >
                            {c.total} kg
                            {maxWeight === c.total && (
                              <span className="ml-1 text-xs">⚡ Optimal</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </AnimatedListItem>
                )
              )}
            </div>
          </div>
        </AnimatedSection>

        <Separator className="my-6" />

        {/* Vehicle Assignments Section */}
        {step?.vehicleAssignments && step.vehicleAssignments.length > 0 && (
          <AnimatedSection delay={400}>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-indigo-200">
              <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                Vehicle Assignment Details
              </h3>

              <div className="space-y-4">
                {step.vehicleAssignments.map((va, vaIndex) => {
                  const name =
                    va.name ??
                    `Vehicle ${String(va.vehicleId).padStart(2, "0")}`;
                  const speed = va.vehicleSpeed ?? 70;
                  const pkgTimes = va.perPackageTimes;

                  return (
                    <AnimatedListItem key={va.vehicleId} index={vaIndex}>
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500 text-white rounded-full">
                              <Truck className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-indigo-800">
                                {name}
                              </h4>
                              <Badge
                                variant="secondary"
                                className="bg-indigo-100 text-indigo-800"
                              >
                                {va.packages.length} packages
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-indigo-600">
                              {va.returnTime.toFixed(2)} hrs
                            </div>
                            <div className="text-xs text-gray-500">
                              Available after
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {pkgTimes.map((pt, i) => (
                            <div
                              key={i}
                              className="bg-white rounded-lg p-3 border border-gray-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-blue-500" />
                                  <span className="font-semibold">{pt.id}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-green-600">
                                    {pt.deliveryTime.toFixed(2)} hrs
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {pt.distance.toFixed(1)}km @ {speed}km/hr
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AnimatedListItem>
                  );
                })}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Summary Statistics */}
        {step?.combos && step.combos.length > 0 && (
          <>
            <Separator className="my-6" />
            <AnimatedSection delay={600}>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Optimization Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      <AnimatedCounter value={step.combos.length} />
                    </div>
                    <div className="text-sm text-gray-600">Combinations</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-blue-600">
                      <AnimatedCounter value={maxWeight} suffix="kg" />
                    </div>
                    <div className="text-sm text-gray-600">Max Weight</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-purple-600">
                      <AnimatedCounter value={step.packagesRemaining || 0} />
                    </div>
                    <div className="text-sm text-gray-600">Remaining</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-orange-600">
                      <AnimatedCounter value={step.vehiclesAvailable || 0} />
                    </div>
                    <div className="text-sm text-gray-600">Vehicles</div>
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
