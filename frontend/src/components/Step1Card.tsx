import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, ArrowRightCircle } from "lucide-react";
import type { OptimizationStep, Vehicle } from "@/lib/delivery-service";

interface Step1CardProps {
  step?: OptimizationStep;
}

export function Step1Card({ step }: Step1CardProps) {
  return (
    <Card className="w-full max-w-3xl shadow-lg rounded-2xl">
      {/* Header */}
      <CardHeader className="pb-2">
        <CardTitle className="bg-[#1A1F1C] text-white px-4 py-1 rounded-md text-sm tracking-wide w-fit">
          STEP 01
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-[15px]">
        {/* Top Info */}
        <div>
          <p>
            Packages Remaining:{" "}
            <span className="font-semibold">
              {String(step?.packagesRemaining ?? 0).padStart(2, "0")}
            </span>
          </p>
          <p>
            Vehicles Available:{" "}
            <span className="font-semibold">
              {String(step?.vehiclesAvailable ?? 0).padStart(2, "0")}
            </span>{" "}
            | Current Time:{" "}
            <span className="font-semibold">
              {step ? step.currentTime.toFixed(2) : "0.00"} hrs
            </span>
          </p>
        </div>
        <Separator />

        {/* Step 1: Choose packages to deliver together */}
        <div>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {(step?.combos && step.combos.length > 0 ? step.combos : []).map(
                (c, idx) => (
                  <tr key={idx}>
                    <td className="py-2 w-1/6">
                      <p className="font-semibold flex">
                        {c.aId}{" "}
                        <sub className="text-xs text-gray-500 font-normal">
                          {c.aWeight}kg
                        </sub>
                      </p>
                    </td>
                    {c.bId && ( <td width={"5%"}>
                      <Plus className="w-4 h-4 text-gray-400" />
                    </td>)}
                    {c.bId && (
                      <td className="py-2  w-1/5 ">
                        <p className="font-semibold flex">
                          {c.bId}{" "}
                          <sub className="text-xs text-gray-500 font-normal">
                            {c.bWeight}kg
                          </sub>
                        </p>
                      </td>
                    )}
                    <td>
                      <ArrowRightCircle className="w-4 h-4 text-gray-400 font-normal" />
                    </td>
                    <td className={`py-2 font-medium text-right w-2/5`}>
                      {c.count} packages{" "}
                      <span className={`text-xs text-gray-500 font-normal`}>
                        {c.total} kg
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
        <Separator />

        {/* Vehicle Info Table */}
        {step?.vehicleAssignments && step.vehicleAssignments.length > 0 && (
          <div>
            <table className="w-full text-sm border-collapse">
              <tbody>
                {step.vehicleAssignments.map((va) => {
                  const name =
                    va.name ??
                    `Vehicle ${String(va.vehicleId).padStart(2, "0")}`;
                  const speed = va.vehicleSpeed ?? 70;
                  const pkgTimes = va.packages.map((p) => ({
                    id: p.id,
                    distance: p.distance,
                    time: parseFloat((p.distance / speed).toFixed(2)),
                  }));
                  return pkgTimes.map((pt, i) => (
                    <tr key={`${va.vehicleId}-${pt.id}-${i}`}>
                      {i === 0 && (
                        <td
                          rowSpan={pkgTimes.length}
                          className="text-[#E4A100] font-semibold align-top pr-3"
                        >
                          {name}
                        </td>
                      )}
                      <td className="py-2">
                        <div>Delivering {pt.id}</div>
                        <div className="text-xs text-gray-500">
                          {pt.distance}km/{speed}km/hr
                        </div>
                      </td>
                      <td className="py-2 text-right font-semibold">
                        {i === 0
                          ? va.deliveryTime.toFixed(2)
                          : pt.time.toFixed(2)}{" "}
                        hrs
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}

        <Separator />

        {/* Availability */}
        {step?.vehicleAssignments &&
          step.vehicleAssignments.length > 0 &&
          (() => {
            const va = step.vehicleAssignments[0];
            const vname =
              va.name ?? `Vehicle ${String(va.vehicleId).padStart(2, "0")}`;
            return (
              <div>
                <p className="text-sm font-medium">
                  {vname} will be available after (2*
                  {va.deliveryTime.toFixed(2)})
                  <span className="font-bold float-right">
                    {va.returnTime.toFixed(2)} hrs
                  </span>
                </p>
              </div>
            );
          })()}
      </CardContent>
    </Card>
  );
}
