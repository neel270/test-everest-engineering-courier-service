import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRightCircle } from "lucide-react";
import type { OptimizationStep } from '@/lib/delivery-service';

interface Step6CardProps { step?: OptimizationStep }

export function Step6Card({ step }: Step6CardProps) {
  // Derive values from step; fallback to static demo if missing
  const currentTime = step?.currentTime ?? 3.56;
  const pkg = step?.packagesRemaining === 1
    ? step.unassignedPackages[0]
    : step?.vehicleAssignments?.[0]?.packages?.[0];
  const packageItem = pkg ? { id: pkg.id, weight: pkg.weight } : {  };
  const va = step?.vehicleAssignments?.[0];
  const deliverId = va?.packages?.[0]?.id ?? '';
  const deliverTime = va ? parseFloat(va.deliveryTime.toFixed(2)) : 3.98;
  const speed = va?.vehicleSpeed ?? 70;
  const distance = va?.maxDistance ?? 30;
  const vehicle = {
    name: `Vehicle ${String(va?.vehicleId ?? 1).padStart(2,'0')}`,
    delivering: {
      id: deliverId,
      time: deliverTime,
      explain: `Current Time + ${distance}km/${speed}km/hr`,
      expr: `(${(currentTime).toFixed(2)}+ ${(va ? (va.deliveryTime).toFixed(2) : '0.42')})`,
    },
  };

  return (
    <Card className="w-full max-w-3xl shadow-lg rounded-2xl">
      {/* Header */}
      <CardHeader className="pb-1">
        <CardTitle className="bg-[#1A1F1C] text-white px-4 py-1 rounded-md text-sm tracking-wide w-fit">
          STEP 06
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-[15px]">
        {/* Top Info */}
        <div>
          <p>
            Packages Remaining: <span className="font-semibold">{String(step?.packagesRemaining ?? 1).padStart(2,'0')}</span>
          </p>
          <p>
            Vehicles Available: <span className="font-semibold">{String(step?.vehiclesAvailable ?? 1).padStart(2,'0')}</span> |
            Current Time: <span className="font-semibold">{currentTime.toFixed(2)} hrs</span>
          </p>
        </div>
        <Separator />

        {/* Package selection row */}
        <div className="grid grid-cols-12 items-center">
          <div className="col-span-6">
            <div className="text-[13px] font-semibold">{packageItem.id}</div>
            <div className="text-xs text-gray-500">{packageItem.weight}kg</div>
          </div>
          <div className="col-span-6 flex items-center gap-3">
          <ArrowRightCircle className="w-4 h-4 text-gray-400 font-normal" />
            <div>
              <div className="text-[13px] font-semibold">01 package</div>
              <div className="text-xs text-green-600">50kg</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Vehicle row */}
        <div className="grid grid-cols-12 items-center text-sm">
          <div className="col-span-3 text-[#E4A100] font-semibold">{vehicle.name}</div>
          <div className="col-span-7">
            <div>Delivering {vehicle.delivering.id} {vehicle.delivering.expr}</div>
            <div className="text-xs text-gray-500">{vehicle.delivering.explain}</div>
          </div>
          <div className="col-span-2 text-right font-semibold">{vehicle.delivering.time} hrs</div>
        </div>

        <Separator />
      </CardContent>
    </Card>
  );
}
