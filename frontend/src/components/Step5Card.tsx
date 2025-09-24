import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Truck,
  Timer,
  Zap,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import {
  AnimatedCard,
  AnimatedSection,
  AnimatedListItem,
  AnimatedCounter,
  AnimatedProgressBar,
} from "@/components/ui/animations";
import type { OptimizationStep } from "@/lib/delivery-service";

interface Step5CardProps {
  step?: OptimizationStep;
}

export function Step5Card({ step }: Step5CardProps) {
  // Use proper data from step prop without static fallbacks
  const currentTime = step?.currentTime ?? 0;
  const packagesRemaining = step?.packagesRemaining ?? 0;
  const vehiclesAvailable = step?.vehiclesAvailable ?? 0;

  const rows = step?.availability?.vehicleReturns?.length
    ? step.availability.vehicleReturns.map((v) => ({
        name: v.name || `Vehicle ${String(v.vehicleId).padStart(2, "0")}`,
        returningIn: parseFloat(v.returningIn.toFixed(2)),
        vehicleId: v.vehicleId,
      }))
    : [];

  const firstAvailable = step?.availability?.firstAvailable
    ? {
        name:
          step.availability.firstAvailable.name ||
          `Vehicle ${String(
            step.availability.firstAvailable.vehicleId
          ).padStart(2, "0")}`,
        after: parseFloat(step.availability.firstAvailable.delta.toFixed(2)),
        expr: step.availability.firstAvailable.expression,
        vehicleId: step.availability.firstAvailable.vehicleId,
      }
    : undefined;

  const progress = step
    ? Math.min(((step.packagesRemaining || 0) / 10) * 100, 100)
    : 0;

  // Only render if we have step data
  if (!step) {
    return (
      <AnimatedCard className="w-full max-w-4xl shadow-xl rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50">
        <CardContent className="space-y-4 text-[15px] pt-6">
          <div className="text-center text-gray-500 py-8">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No step data available</p>
          </div>
        </CardContent>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard className="w-full max-w-5xl shadow-xl rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardHeader className="text-center pb-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-2xl">
        <CardTitle className="flex items-center justify-center gap-3 text-xl">
          <div className="p-2 bg-white/20 rounded-full">
            <Timer className="w-6 h-6" />
          </div>
          Step 5: Fleet Availability Status
          <div className="p-2 bg-white/20 rounded-full">
            <CheckCircle className="w-6 h-6" />
          </div>
        </CardTitle>
        <div className="flex items-center justify-center gap-6 text-sm mt-3">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Truck className="w-4 h-4" />
            <span>Packages: </span>
            <AnimatedCounter
              value={packagesRemaining}
              className="font-bold text-lg"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Timer className="w-4 h-4" />
            <span>Vehicles: </span>
            <AnimatedCounter
              value={vehiclesAvailable}
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
          <p className="text-xs mt-1 opacity-90">Fleet Status Progress</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 text-[15px] pt-6">
        {/* Fleet Status Overview */}
        <AnimatedSection delay={200}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200">
            <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Fleet Status Overview
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-600">
                  <AnimatedCounter value={rows.length} />
                </div>
                <div className="text-sm text-gray-600">Vehicles Returning</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                <div className="text-2xl font-bold text-blue-600">
                  {firstAvailable ? "1" : "0"}
                </div>
                <div className="text-sm text-gray-600">Available Now</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                <div className="text-2xl font-bold text-purple-600">
                  <AnimatedCounter value={vehiclesAvailable} />
                </div>
                <div className="text-sm text-gray-600">Total Fleet</div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <Separator className="my-6" />

        {/* Other Returning Vehicles */}
        {rows.length > 0 && (
          <AnimatedSection delay={300}>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
              <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Vehicles Returning to Base
              </h3>

              <div className="space-y-3">
                {rows.map((r, index) => (
                  <AnimatedListItem key={r.vehicleId} index={index}>
                    <div
                      className={`
                      p-4 rounded-lg border-2 transition-all duration-300
                      ${
                        index === 0
                          ? "border-blue-400 bg-blue-50 shadow-lg"
                          : "border-gray-200 bg-white hover:border-blue-300"
                      }
                    `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                            p-2 rounded-full transition-colors duration-300
                            ${
                              index === 0
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-600"
                            }
                          `}
                          >
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <div
                              className={`
                              font-bold text-lg transition-colors duration-300
                              ${index === 0 ? "text-blue-800" : "text-gray-700"}
                            `}
                            >
                              {r.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Vehicle ID: {r.vehicleId}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`
                            text-2xl font-bold transition-colors duration-300
                            ${index === 0 ? "text-blue-600" : "text-gray-600"}
                          `}
                          >
                            {r.returningIn} hrs
                          </div>
                          <div className="text-sm text-gray-500">
                            Return time
                          </div>
                          {index === 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-800 mt-1"
                            >
                              Next to Return
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Progress bar for return time */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Return Progress</span>
                          <span>{r.returningIn} hours remaining</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`
                              h-2 rounded-full transition-all duration-1000 ease-out
                              ${index === 0 ? "bg-blue-500" : "bg-gray-400"}
                            `}
                            style={{
                              width: `${Math.min(
                                (r.returningIn / 10) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </AnimatedListItem>
                ))}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* First Available Vehicle - Highlighted */}
        {firstAvailable && (
          <>
            <Separator className="my-6" />
            <AnimatedSection delay={500}>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-300 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-500 text-white rounded-full animate-bounce">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-green-800">
                      🚛 FIRST AVAILABLE VEHICLE
                    </h3>
                    <p className="text-green-600">
                      Ready for immediate assignment
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 text-white rounded-full">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-xl text-green-800">
                            {firstAvailable.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Vehicle ID: {firstAvailable.vehicleId}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Available
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Available after:
                        </span>
                        <span className="font-bold text-green-600 text-lg">
                          {firstAvailable.after.toFixed(2)} hrs
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Expression:
                        </span>
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {firstAvailable.expr}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className="font-bold text-green-600">
                          Ready for Assignment
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-gray-700 mb-3">
                      Assignment Capabilities
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <ArrowRight className="w-4 h-4 text-green-500" />
                        <span>Ready to receive packages</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <ArrowRight className="w-4 h-4 text-green-500" />
                        <span>Optimized routing available</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <ArrowRight className="w-4 h-4 text-green-500" />
                        <span>Next delivery slot open</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <ArrowRight className="w-4 h-4 text-green-500" />
                        <span>Full fleet integration</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-green-200">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">
                          Priority Status
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          High Priority
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </>
        )}

        {/* Fleet Summary */}
        <AnimatedSection delay={700}>
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
            <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              Fleet Summary & Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-3">
                  Current Status
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Fleet Utilization:</span>
                    <span className="font-medium">
                      {vehiclesAvailable > 0
                        ? Math.round((rows.length / vehiclesAvailable) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available Now:</span>
                    <span className="font-medium text-green-600">
                      {firstAvailable ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Available:</span>
                    <span className="font-medium">
                      {rows.length > 0
                        ? `${rows[0].returningIn.toFixed(1)} hrs`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-3">
                  Recommendations
                </h4>
                <div className="space-y-2 text-sm">
                  {firstAvailable ? (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Assign {firstAvailable.name} immediately</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span>Prepare next package for assignment</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        <span>Wait for next vehicle return</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>Monitor fleet status</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </CardContent>
    </AnimatedCard>
  );
}
