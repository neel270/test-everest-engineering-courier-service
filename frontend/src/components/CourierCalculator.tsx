import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Loader2, Car } from "lucide-react";
import deliveryTruck from "@/assets/delivery-truck.png";
import {
  DeliveryService,
  type PackageData,
  type Vehicle,
  type OptimizationStep,
} from "@/lib/delivery-service";
import { useDeliveries, useVehicles } from "@/hooks/useApi";
import { PackageList } from "./PackageList";
import { DeliveryResults } from "./DeliveryResults";
import { OfferCodesReference } from "./OfferCodesReference";
// Removed individual optimization step lists in favor of a single combined view
import { DeliveryTimeline } from "./DeliveryTimeline";
import { CLIInstructions } from "./CLIInstructions";

export const CourierCalculator = () => {
  const [baseDeliveryCost, setBaseDeliveryCost] = useState<number>(100);
  const [packageList, setPackageList] = useState<PackageData[]>([
    { id: "PKG1", weight: 50, distance: 30, offerCode: "OFR001" },
    { id: "PKG2", weight: 75, distance: 125, offerCode: "OFR001" },
    { id: "PKG3", weight: 175, distance: 100, offerCode: "OFR003" },
    { id: "PKG4", weight: 110, distance: 60, offerCode: "OFR002" },
    { id: "PKG5", weight: 155, distance: 95, offerCode: "OFR001" },
    // { id: "PKG6", weight: 35, distance: 45, offerCode: "OFR002" },
    // { id: "PKG7", weight: 90, distance: 80, offerCode: "OFR003" },
    // { id: "PKG8", weight: 120, distance: 70, offerCode: "OFR001" },
    // { id: "PKG9", weight: 65, distance: 55, offerCode: "OFR002" },
    // { id: "PKG10", weight: 85, distance: 110, offerCode: "OFR003" },
  ]);
  const [results, setResults] = useState<
    Array<{
      id: string;
      discount: number;
      totalCost: number;
      originalCost: number;
      estimatedDeliveryTime: number;
    }>
  >([]);
  const [optimizationSteps, setOptimizationSteps] = useState<
    OptimizationStep[]
  >([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [deliveryService, setDeliveryService] = useState(
    () => new DeliveryService(baseDeliveryCost)
  );

  // Update delivery service when baseDeliveryCost changes
  useEffect(() => {
    setDeliveryService(new DeliveryService(baseDeliveryCost));
  }, [baseDeliveryCost]);

  // React Query hooks
  const calculateDeliveryCosts = useDeliveries.useCalculateDeliveryCosts();
  const { data: vehicles, isLoading: vehiclesLoading } =
    useVehicles.useAllVehiclesForDelivery();

  const addPackage = () => {
    const newId = `PKG${packageList.length + 1}`;
    setPackageList([
      ...packageList,
      { id: newId, weight: 0, distance: 0, offerCode: "" },
    ]);
  };

  const updatePackage = (
    index: number,
    field: keyof PackageData,
    value: string | number
  ) => {
    const updatedPackages = [...packageList];
    updatedPackages[index] = { ...updatedPackages[index], [field]: value };
    setPackageList(updatedPackages);
  };

  const removePackage = (index: number) => {
    if (packageList.length > 1) {
      setPackageList(packageList.filter((_, i) => i !== index));
    }
  };

  const validateOfferCode = (pkg: PackageData): boolean => {
    return deliveryService.validateOfferCode(pkg);
  };

  const calculateAllCosts = async () => {
    if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
      console.error("No vehicles available for delivery calculation");
      return;
    }

    setIsCalculating(true);

    // Use vehicles from database
    const dbVehicles = vehicles.map((vehicle) => ({
      id: vehicle.id,
      name: vehicle.name,
      maxSpeed: vehicle.maxSpeed,
      maxCarriableWeight: vehicle.maxCarriableWeight,
      availableTime: vehicle.availableTime || 0,
    }));

    try {
      const response = await calculateDeliveryCosts.mutateAsync({
        packages: packageList,
        vehicles: dbVehicles,
        baseDeliveryCost,
      });

      if (
        response.success &&
        response.data &&
        typeof response.data === "object" &&
        "results" in response.data
      ) {
        const data = response.data as {
          results: Array<{
            id: string;
            discount: number;
            totalCost: number;
            originalCost: number;
            estimatedDeliveryTime: number;
          }>;
          optimizationSteps: OptimizationStep[];
        };
        setResults(data.results);
        // Enrich steps with DB vehicle names
        const vehNameMap = new Map<number, string>();
        if (vehicles && Array.isArray(vehicles)) {
          vehicles.forEach((v) =>
            vehNameMap.set(
              v.id,
              v.name || `Vehicle ${String(v.id).padStart(2, "0")}`
            )
          );
        }
        const enrichedSteps = (data.optimizationSteps || []).map((step) => ({
          ...step,
          vehicleAssignments: (step.vehicleAssignments || []).map((va) => ({
            ...va,
            name:
              vehNameMap.get(va.vehicleId) ||
              `Vehicle ${String(va.vehicleId).padStart(2, "0")}`,
          })),
          availability: step.availability
            ? {
                ...step.availability,
                vehicleReturns:
                  step.availability.vehicleReturns?.map((vr) => ({
                    ...vr,
                    name:
                      vehNameMap.get(vr.vehicleId) ||
                      vr.name ||
                      `Vehicle ${String(vr.vehicleId).padStart(2, "0")}`,
                  })) || [],
                firstAvailable: step.availability.firstAvailable
                  ? {
                      ...step.availability.firstAvailable,
                      name:
                        vehNameMap.get(
                          step.availability.firstAvailable.vehicleId
                        ) ||
                        step.availability.firstAvailable.name ||
                        `Vehicle ${String(
                          step.availability.firstAvailable.vehicleId
                        ).padStart(2, "0")}`,
                    }
                  : undefined,
              }
            : undefined,
        })) as OptimizationStep[];
        setOptimizationSteps(enrichedSteps);
      }
    } catch (error) {
      console.error("Failed to calculate delivery costs:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-delivery-orange-light/10 to-courier-blue-light/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img
              src={deliveryTruck}
              alt="Delivery Truck"
              className="w-16 h-16"
            />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-delivery-orange to-courier-blue bg-clip-text text-transparent">
              Kiki's Courier Service
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Calculate delivery costs with special offer codes. Enter your
            package details below to get instant cost estimates with available
            discounts.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 pb-4">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Base Delivery Cost Configuration */}
            <Card className="delivery-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">₹</span>
                </div>
                <h2 className="text-xl font-semibold">Base Delivery Cost</h2>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="baseDeliveryCost"
                  className="text-sm text-muted-foreground"
                >
                  Set the base cost for delivery calculations (₹)
                </Label>
                <Input
                  id="baseDeliveryCost"
                  type="number"
                  min="0"
                  step="1"
                  value={baseDeliveryCost}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setBaseDeliveryCost(value);
                  }}
                  className="text-lg font-medium"
                  placeholder="Enter base delivery cost"
                />
                <p className="text-xs text-muted-foreground">
                  This is the fixed cost added to each delivery before weight
                  and distance charges
                </p>
              </div>
            </Card>

            {/* Vehicle Information */}
            {vehicles && Array.isArray(vehicles) && vehicles.length > 0 && (
              <Card className="delivery-card">
                <div className="flex items-center gap-3 mb-4">
                  <Car className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-semibold">Available Vehicles</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="p-3 border rounded-lg bg-card/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">Vehicle {vehicle.id}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {vehicle.name}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>Speed: {vehicle.maxSpeed} km/h</div>
                        <div>Capacity: {vehicle.maxCarriableWeight} kg</div>
                        <div className="text-xs text-muted-foreground">
                          Available:{" "}
                          {vehicle.availableTime === 0
                            ? "Now"
                            : DeliveryService.formatTime(vehicle.availableTime)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <PackageList
              packageList={packageList}
              onAddPackage={addPackage}
              onUpdatePackage={updatePackage}
              onRemovePackage={removePackage}
              validateOfferCode={validateOfferCode}
            />

            <Button
              onClick={calculateAllCosts}
              disabled={
                isCalculating ||
                vehiclesLoading ||
                !vehicles ||
                !Array.isArray(vehicles) ||
                vehicles.length === 0
              }
              className="w-full bg-gradient-to-r from-delivery-orange to-courier-blue hover:opacity-90 transition-opacity text-white font-semibold py-3"
            >
              {isCalculating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculating...
                </div>
              ) : vehiclesLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading vehicles...
                </div>
              ) : !vehicles ||
                !Array.isArray(vehicles) ||
                vehicles.length === 0 ? (
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  No vehicles available
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Calculate Delivery Costs ({vehicles.length} vehicles
                  available)
                </div>
              )}
            </Button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <DeliveryResults results={results} />
            
            <OfferCodesReference offers={deliveryService.offers} />
            <CLIInstructions />
          </div>
        </div>
          <DeliveryTimeline steps={optimizationSteps} />

      </div>
    </div>
  );
};
