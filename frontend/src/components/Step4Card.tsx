import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    : ({ id: "PKG5", weight: 155, distance: 95, offerCode: "" } as PackageData);

  const va = step?.vehicleAssignments?.[0];
  const currentTime = step?.currentTime ?? 2.84;
  const delTime = va ? va.deliveryTime : 1.35;
  const vehicleId = va ? va.vehicleId : 2;
  const vehicleName = `Vehicle ${String(vehicleId).padStart(2, "0")}`;
  const speed = va?.vehicleSpeed ?? 70;
  const distance = va?.maxDistance ?? most?.distance ?? 95;
  const expr = `(${currentTime.toFixed(2)}+ ${delTime.toFixed(2)})`;
  const rightTime = (currentTime + delTime).toFixed(2);
  const availableAfter = (currentTime + 2 * delTime).toFixed(2);

  return (
    <Card className="w-full max-w-xl shadow-lg rounded-2xl">
      {/* Header */}
      <CardHeader className="pb-2">
        <CardTitle className="bg-[#1A1F1C] text-white px-4 py-1 rounded-md text-sm tracking-wide w-fit">
          STEP 04
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
              {String(step?.vehiclesAvailable ?? 1).padStart(2, "0")}
            </span>{" "}
            | Current Time:{" "}
            <span className="font-semibold">{currentTime.toFixed(2)} hrs</span>
          </p>
        </div>
        <Separator />

        {/* Package Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-semibold">{p1?.id ?? "PKG1"}</span>
              <sub className="text-xs text-gray-500 font-normal">
                {p1 ? p1.weight : 50}kg
              </sub>
              <span className="font-semibold">{p2?.id ?? "PKG5"}</span>
              <sub className="text-xs text-gray-500 font-normal">
                {p2 ? p2.weight : 155}kg
              </sub>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">⊙</span>
              <span className="text-sm text-gray-600">
                01 package ({most?.id ?? "PKG5"})
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-green-600 font-medium">
              {most ? most.weight : 155} kg (Most Weight)
            </span>
          </div>
        </div>
        <Separator />

        {/* Vehicle Info */}
        <div className="space-y-1 flex justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[#E4A100] font-semibold">{vehicleName}</span>
          </div>
          <div className="text-sm">
            <p>
              Delivering {most?.id ?? "PKG5"} {expr}
            </p>
            <p className="text-gray-500">
              Current Time + {distance}km/{speed}km/hr
            </p>
          </div>
          <span className="font-semibold">{rightTime} hrs</span>
        </div>

        <Separator />

        {/* Availability */}
        <p className="text-sm font-medium">
          {vehicleName} will be available after ({currentTime.toFixed(2)} + 2*
          {delTime.toFixed(2)})
          <span className="font-bold float-right">{availableAfter} hrs</span>
        </p>
      </CardContent>
    </Card>
  );
}
