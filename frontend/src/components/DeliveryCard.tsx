import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Clock, DollarSign, Eye } from "lucide-react";
import { DeliveryService } from "@/lib/delivery-service";
import { DeliveryResponse } from "@/types/delivery";

interface DeliveryCardProps {
  delivery: DeliveryResponse;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({ delivery }) => {
  const totalPackages = delivery.packages.length;
  const totalVehicles = delivery.vehicles.length;
  const totalTime = Math.max(...delivery.optimizationSteps.map(step => step.currentTime));
  const createdDate = new Date(delivery.createdAt).toLocaleDateString();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Delivery #{delivery.id.slice(-8)}</CardTitle>
            <p className="text-sm text-muted-foreground">Created: {createdDate}</p>
          </div>
          <Badge variant="outline" className="ml-2">
            {totalPackages} packages
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary">
              <Package className="w-4 h-4" />
              <span className="font-semibold">{totalPackages}</span>
            </div>
            <div className="text-xs text-muted-foreground">Packages</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary">
              <Truck className="w-4 h-4" />
              <span className="font-semibold">{totalVehicles}</span>
            </div>
            <div className="text-xs text-muted-foreground">Vehicles</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">{DeliveryService.formatTime(totalTime)}</span>
            </div>
            <div className="text-xs text-muted-foreground">Total Time</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary">
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold">${delivery.totalCost}</span>
            </div>
            <div className="text-xs text-muted-foreground">Total Cost</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link to={`/deliveries/${delivery.id}`}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};