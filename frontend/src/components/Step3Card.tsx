import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Clock, Truck, Timer, Zap, ArrowRight } from "lucide-react";
import {
  AnimatedCard,
  AnimatedSection,
  AnimatedListItem,
  AnimatedCounter,
  AnimatedProgressBar,
} from "@/components/ui/animations";
import type { OptimizationStep } from "@/lib/delivery-service";

interface Step3CardProps {
  step?: OptimizationStep;
}

export function Step3Card({ step }: Step3CardProps) {
  const currentTime = step?.currentTime ?? 0;
  const rows = step?.availability?.vehicleReturns?.length
    ? step.availability.vehicleReturns.map((v) => ({
        name: `${String(v.name).padStart(2, "0")}`,
        returningIn: v.returningIn.toFixed(2),
        vehicleId: v.vehicleId,
      }))
    : [];
  const firstAvailable = step?.availability?.firstAvailable
    ? {
        name: `${String(step.availability.firstAvailable.name).padStart(
          2,
          "0"
        )}`,
        after: step.availability.firstAvailable.delta.toFixed(2),
        expr: step.availability.firstAvailable.expression,
        vehicleId: step.availability.firstAvailable.vehicleId,
      }
    : {};

  const progress = step ? Math.min(((step.packagesRemaining || 0) / 10) * 100, 100) : 0;

  return (
    <AnimatedCard className="w-full shadow-xl rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="text-center pb-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-2xl">
        <CardTitle className="flex items-center justify-center gap-3 text-xl">
          <div className="p-2 bg-white/20 rounded-full">
            <Timer className="w-6 h-6" />
          </div>
          Step 3: Vehicle Availability & Scheduling
          <div className="p-2 bg-white/20 rounded-full">
            <Clock className="w-6 h-6" />
          </div>
        </CardTitle>
        <div className="flex items-center justify-center gap-6 text-sm mt-3">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Truck className="w-4 h-4" />
            <span>Packages: </span>
            <AnimatedCounter
              value={step?.packagesRemaining ?? 2}
              className="font-bold text-lg"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Timer className="w-4 h-4" />
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
              value={currentTime}
              suffix=" hrs"
              className="font-bold text-lg"
            />
          </div>
        </div>
        <div className="mt-3">
          <AnimatedProgressBar progress={progress} className="w-full max-w-xs mx-auto" />
          <p className="text-xs mt-1 opacity-90">Scheduling Progress</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 text-[15px] pt-6">
        {/* Vehicle Return Schedule */}
        <AnimatedSection delay={200}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200">
            <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              Vehicle Return Schedule
            </h3>

            {rows.length > 0 ? (
              <div className="space-y-3">
                {rows.map((r, index) => (
                  <AnimatedListItem key={r.vehicleId} index={index}>
                    <div className={`
                      p-4 rounded-lg border-2 transition-all duration-300
                      ${index === 0
                        ? 'border-purple-400 bg-purple-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                      }
                    `}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`
                            p-2 rounded-full transition-colors duration-300
                            ${index === 0 ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'}
                          `}>
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className={`
                              font-bold text-lg transition-colors duration-300
                              ${index === 0 ? 'text-purple-800' : 'text-gray-700'}
                            `}>
                              {r.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Vehicle ID: {r.vehicleId}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`
                            text-2xl font-bold transition-colors duration-300
                            ${index === 0 ? 'text-purple-600' : 'text-gray-600'}
                          `}>
                            {r.returningIn} hrs
                          </div>
                          <div className="text-sm text-gray-500">Return time</div>
                          {index === 0 && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800 mt-1">
                              Next Available
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
                              ${index === 0 ? 'bg-purple-500' : 'bg-gray-400'}
                            `}
                            style={{ width: `${Math.min((parseFloat(r.returningIn) / 10) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </AnimatedListItem>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No vehicles currently returning</p>
                <p className="text-sm">All vehicles are available or in transit</p>
              </div>
            )}
          </div>
        </AnimatedSection>

        <Separator className="my-6" />

        {/* First Available Vehicle - Highlighted */}
        {firstAvailable && firstAvailable.name && (
          <AnimatedSection delay={400}>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-300 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-500 text-white rounded-full animate-pulse">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-800">🚛 First Available Vehicle</h3>
                  <p className="text-green-600">Ready for next assignment</p>
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
                        <div className="font-bold text-lg text-green-800">
                          {firstAvailable.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Vehicle ID: {firstAvailable.vehicleId}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Available Now
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Available after:</span>
                      <span className="font-bold text-green-600">
                        {firstAvailable.after} hrs
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Expression:</span>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {firstAvailable.expr}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-gray-700 mb-3">Assignment Ready</h4>
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
                  </div>

                  <div className="mt-4 pt-3 border-t border-green-200">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Status</div>
                      <div className="text-lg font-bold text-green-600">Ready</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Summary Statistics */}
        <AnimatedSection delay={600}>
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Fleet Status Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  <AnimatedCounter value={rows.length} />
                </div>
                <div className="text-sm text-gray-600">Returning</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-green-600">
                  {firstAvailable.name ? '1' : '0'}
                </div>
                <div className="text-sm text-gray-600">Available</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-purple-600">
                  <AnimatedCounter value={step?.vehiclesAvailable ?? 0} />
                </div>
                <div className="text-sm text-gray-600">Total Fleet</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-orange-600">
                  <AnimatedCounter value={currentTime} suffix="h" />
                </div>
                <div className="text-sm text-gray-600">Current Time</div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </CardContent>
    </AnimatedCard>
  );
}
