import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
      }
    : {};

  return (
    <Card className="w-full max-w-xl shadow-lg rounded-2xl">
      {/* Header */}
      <CardHeader className="pb-2">
        <CardTitle className="bg-[#1A1F1C] text-white px-4 py-1 rounded-md text-sm tracking-wide w-fit">
          STEP 03
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-[15px]">
        {/* Top Info */}
        <div>
          <p>
            Packages Remaining:{" "}
            <span className="font-semibold">
              {String(step?.packagesRemaining ?? 2).padStart(2, "0")}
            </span>
          </p>
          <p>
            Vehicles Available:{" "}
            <span className="font-semibold">
              {(step?.vehiclesAvailable ?? 0) === 0 ? '0' : String(step?.vehiclesAvailable).padStart(2,'0')}
            </span> | 
            Current Time:{" "}
            <span className="font-semibold">{currentTime.toFixed(2)} hrs</span>
          </p>
        </div>
        <Separator />

        {/* Vehicle List */}
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.name} className="flex justify-between items-center">
              <span className="text-[#E4A100] font-semibold">{r.name}</span>
              <span className="text-gray-600">Returning in</span>
              <span className="font-semibold">{r.returningIn} hrs</span>
            </div>
          ))}
        </div>

        <Separator />

        {/* Availability Note */}
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm">
            <span className="font-semibold">{firstAvailable.name}</span> will be
            available first after{" "}
            <span className="font-bold float-right">
              {firstAvailable.after} hrs
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">{firstAvailable.expr}</p>
        </div>
      </CardContent>
    </Card>
  );
}
