import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { OptimizationStep } from "@/lib/delivery-service";

interface Step5CardProps {
  step?: OptimizationStep;
}

export function Step5Card({ step }: Step5CardProps) {
  // Fallback static data
  const currentTime = step?.currentTime ?? 2.84;
  const rows = step?.availability?.vehicleReturns?.length
    ? step.availability.vehicleReturns.map((v) => ({
        name: v.name || `Vehicle ${String(v.vehicleId).padStart(2,'0')}`,
        returningIn: parseFloat(v.returningIn.toFixed(2)),
      }))
    : [];
  const firstAvailable = step?.availability?.firstAvailable
    ? {
        name: step.availability.firstAvailable.name || `Vehicle ${String(step.availability.firstAvailable.vehicleId).padStart(2,'0')}`,
        after: parseFloat(step.availability.firstAvailable.delta.toFixed(2)),
        expr: step.availability.firstAvailable.expression,
      }
    : undefined;

  return (
    <Card className="w-full max-w-3xl shadow-lg rounded-2xl">
      {/* Header */}
      <CardHeader className="pb-1">
        <CardTitle className="bg-[#1A1F1C] text-white px-4 py-1 rounded-md text-sm tracking-wide w-fit">
          STEP 05
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-[15px]">
        {/* Top Info */}
        <div>
          <p>
            Packages Remaining:{" "}
            <span className="font-semibold">
              {String(step?.packagesRemaining ?? 1).padStart(2, "0")}
            </span>
          </p>
          <p>
            Vehicles Available: {" "}
            <span className="font-semibold text-red-500">
              {(step?.vehiclesAvailable ?? 0) === 0 ? '' : String(step?.vehiclesAvailable).padStart(2,'0')}
            </span>{" "}
            | Current Time:{" "}
            <span className="font-semibold">{currentTime.toFixed(2)} hrs</span>
          </p>
        </div>
        <Separator />

        {/* Returning rows */}
        {rows.length > 0 && (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.name} className="grid grid-cols-12 items-center text-sm">
                <div className="col-span-3 text-[#E4A100] font-semibold">{r.name}</div>
                <div className="col-span-7 text-muted-foreground">Returning in</div>
                <div className="col-span-2 text-right font-semibold">{r.returningIn} hrs</div>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* First available summary */}
        {firstAvailable && (
          <>
            <div className="grid grid-cols-12 items-center text-sm font-medium">
              <div className="col-span-8">
                {firstAvailable.name} will be available first after
              </div>
              <div className="col-span-4 text-right font-bold">{firstAvailable.after.toFixed(2)} hrs</div>
            </div>
            {firstAvailable.expr && (
              <div className="text-xs text-gray-500 mt-1">{firstAvailable.expr}</div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
