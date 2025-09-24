import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { deliveryApi } from "@/lib/api";
import { DeliveryTimeline } from "@/components/DeliveryTimeline";
import { DeliveryService } from "@/lib/delivery-service";
import {
  Package,
  Truck,
  Clock,
  DollarSign,
  ArrowLeft,
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle
} from "lucide-react";

interface Delivery {
  _id: string;
  packages: string[];
  vehicles: string[];
  baseDeliveryCost: number;
  totalCost: number;
  totalDiscount: number;
  results: Array<{
    id: string;
    discount: number;
    totalCost: number;
    originalCost: number;
    estimatedDeliveryTime: number;
  }>;
  optimizationSteps: Array<{
    step: number;
    description: string;
    packagesRemaining: number;
    vehiclesAvailable: number;
    currentTime: number;
    vehicleAssignments: Array<{
      vehicleId: number;
      name: string;
      packages: Array<{
        id: string;
        weight: number;
        distance: number;
        offerCode?: string;
      }>;
      totalWeight: number;
      maxDistance: number;
      deliveryTime: number;
      returnTime: number;
      availableAfter: number;
      vehicleSpeed?: number;
      perPackageTimes?: Array<{
        id: string;
        distance: number;
        deliveryTime: number;
      }>;
    }>;
    unassignedPackages: Array<{
      id: string;
      weight: number;
      distance: number;
      offerCode?: string;
    }>;
    assignedPackages?: Array<{
      id: string;
      weight: number;
      distance: number;
      offerCode?: string;
    }>;
    meta?: {
      maxSpeed: number;
      maxLoad: number;
    };
    combos?: Array<{
      packageIds: string[];
      packageWeights: number[];
      total: number;
      count: number;
    }>;
    heaviest?: { id: string; weight: number };
    availability?: {
      vehicleReturns: Array<{
        vehicleId: number;
        name: string;
        returningIn: number;
      }>;
      firstAvailable?: {
        vehicleId: number;
        name: string;
        delta: number;
        expression: string;
        packages: Array<{
          id: string;
          weight: number;
          distance: number;
          offerCode?: string;
        }>;
        totalWeight: number;
        maxDistance: number;
        deliveryTime: number;
        returnTime: number;
        availableAfter: number;
        vehicleSpeed?: number;
      };
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

const DeliveryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["delivery", id],
    queryFn: async () => {
      if (!id) throw new Error("Delivery ID is required");
      const response = await deliveryApi.getDeliveryById(id);
      return response.data as Delivery;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/deliveries">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Deliveries
            </Link>
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load delivery details. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const delivery = data;
  const totalPackages = delivery.packages.length;
  const totalVehicles = delivery.vehicles.length;
  const totalTime = Math.max(...delivery.optimizationSteps.map(step => step.currentTime));
  const createdDate = new Date(delivery.createdAt).toLocaleDateString();
  const createdTime = new Date(delivery.createdAt).toLocaleTimeString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/deliveries">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Deliveries
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Delivery Details</h1>
            <p className="text-muted-foreground">
              #{delivery._id.slice(-8)} • Created {createdDate} at {createdTime}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          <CheckCircle className="w-4 h-4 mr-1" />
          Completed
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>Packages</span>
                </div>
                <span className="font-semibold">{totalPackages}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="w-4 h-4" />
                  <span>Vehicles</span>
                </div>
                <span className="font-semibold">{totalVehicles}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Total Time</span>
                </div>
                <span className="font-semibold">{DeliveryService.formatTime(totalTime)}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <span>Base Cost</span>
                </div>
                <span className="font-semibold">${delivery.baseDeliveryCost}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>Total Discount</span>
                </div>
                <span className="font-semibold text-green-600">
                  -${delivery.totalDiscount}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total Cost</span>
                <span className="text-primary">${delivery.totalCost}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Savings</span>
                <span className="text-green-600">
                  {((delivery.totalDiscount / (delivery.totalCost + delivery.totalDiscount)) * 100).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Package Details */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Package Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {delivery.results.map((result) => (
                  <div key={result.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">{result.id}</div>
                      <div className="text-sm text-muted-foreground">
                        {DeliveryService.formatTime(result.estimatedDeliveryTime)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${result.totalCost}</div>
                      {result.discount > 0 && (
                        <div className="text-sm text-green-600">
                          -${result.discount} ({result.discount}% off)
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2">
          <DeliveryTimeline steps={delivery.optimizationSteps} />
        </div>
      </div>
    </div>
  );
};

export default DeliveryView;