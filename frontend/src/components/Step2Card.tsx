import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRightCircle } from "lucide-react";
import type { OptimizationStep } from '@/lib/delivery-service';

interface Step2CardProps {
  step?: OptimizationStep;
}

export function Step2Card({ step }: Step2CardProps) {

  const packages = step?.combos?.length
    ? Array.from(new Set(step.combos.flatMap(c => [c.aId, c.bId])))
        .map(id => ({ id, weight: step?.unassignedPackages.find(p => p.id === id)?.weight ?? 0 }))
    : (step?.unassignedPackages
        ? [...step.unassignedPackages].sort((a,b) => b.weight - a.weight).slice(0,3).map(p => ({ id: p.id, weight: p.weight }))
        : []);

  const vehicleAssignment = step?.vehicleAssignments?.[0];
  const vehicle = vehicleAssignment
    ? {
        id: vehicleAssignment.vehicleId,
        name: vehicleAssignment.name ?? `Vehicle ${String(vehicleAssignment.vehicleId).padStart(2,'0')}`,
        delivering: {
          id: vehicleAssignment.packages[0]?.id ?? 'PKG',
          distance: vehicleAssignment.maxDistance,
          speed: vehicleAssignment.vehicleSpeed ?? 70,
          time: parseFloat(vehicleAssignment.deliveryTime.toFixed(2)),
        },
        availableAfter: parseFloat((vehicleAssignment.returnTime).toFixed(2))
      }
    : {};

  return (
    <Card className="w-full max-w-3xl shadow-lg rounded-2xl">
      {/* Header */}
      <CardHeader className="pb-1">
        <CardTitle className="bg-[#1A1F1C] text-white px-4 py-1 rounded-md text-sm tracking-wide w-fit">
          STEP 02
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-[15px]">
        {/* Top Info */}
        <div>
          <p>
            Packages Remaining: <span className="font-semibold">{String(step?.packagesRemaining ?? 3).padStart(2,'0')}</span>
          </p>
          <p>
            Vehicles Available: <span className="font-semibold">{String(step?.vehiclesAvailable ?? 1).padStart(2,'0')}</span> |
            Current Time: <span className="font-semibold">{(step ? step.currentTime.toFixed(2) : '0.00')} hrs</span>
          </p>
        </div>
        <Separator />

        {/* Packages list + selected summary */}
        <div className="grid grid-cols-12 items-start gap-4">
          <div className="col-span-7">
            <div className="flex items-center gap-10 text-sm">
              {packages.map((p) => (
                <div key={p.id} className="min-w-[72px]">
                  <div className="text-[13px] font-semibold">{p.id}</div>
                  <div className="text-xs text-gray-500">{p.weight}kg</div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-5">
            <div className="flex items-start gap-2">
            <ArrowRightCircle className="w-4 h-4 text-gray-400 font-normal" />
              <div>
                <div className="text-[13px] font-semibold">01 package ({step?.heaviest?.id ?? 'PKG3'})</div>
                <div className="text-xs text-green-600">{step?.heaviest?.weight ?? 0} kg (Most Weight)</div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Vehicle row */}
        {vehicleAssignment && (
          <>
            <div className="grid grid-cols-12 items-center text-sm">
              <div className="col-span-3 text-[#E4A100] font-semibold">{vehicle.name}</div>
              <div className="col-span-7">
                <div>Delivering {vehicle.delivering.id}</div>
                <div className="text-xs text-gray-500">
                  {vehicle.delivering.distance}km/{vehicle.delivering.speed}km/hr
                </div>
              </div>
              <div className="col-span-2 text-right font-semibold">{vehicle.delivering.time} hrs</div>
            </div>

            <Separator />

            {/* Availability */}
            <div className="flex items-center justify-between text-sm font-medium">
              <p>
                {vehicle.name} will be available after (2*{(vehicle.delivering.time).toFixed(2)})
              </p>
              <p className="font-bold">{vehicle.availableAfter} hrs</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
