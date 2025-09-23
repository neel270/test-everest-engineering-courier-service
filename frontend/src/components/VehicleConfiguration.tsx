import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

interface VehicleConfigurationProps {
  baseDeliveryCost: number;
  vehicleCount: number;
  maxSpeed: number;
  maxWeight: number;
  onBaseDeliveryCostChange: (value: number) => void;
  onVehicleCountChange: (value: number) => void;
  onMaxSpeedChange: (value: number) => void;
  onMaxWeightChange: (value: number) => void;
}

export const VehicleConfiguration: React.FC<VehicleConfigurationProps> = ({
  baseDeliveryCost,
  vehicleCount,
  maxSpeed,
  maxWeight,
  onBaseDeliveryCostChange,
  onVehicleCountChange,
  onMaxSpeedChange,
  onMaxWeightChange
}) => {
  return (
    <Card className="delivery-card">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-semibold">Delivery Configuration</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="baseCost" className="text-sm font-medium">Base Delivery Cost</Label>
          <Input
            id="baseCost"
            type="number"
            value={baseDeliveryCost}
            onChange={(e) => onBaseDeliveryCostChange(Number(e.target.value))}
            className="package-input mt-1"
            placeholder="Enter base cost"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="vehicleCount" className="text-sm font-medium">Number of Vehicles</Label>
            <Input
              id="vehicleCount"
              type="number"
              value={vehicleCount}
              onChange={(e) => onVehicleCountChange(Number(e.target.value))}
              className="package-input mt-1"
              placeholder="2"
              min="1"
            />
          </div>
          
          <div>
            <Label htmlFor="maxSpeed" className="text-sm font-medium">Max Speed (km/hr)</Label>
            <Input
              id="maxSpeed"
              type="number"
              value={maxSpeed}
              onChange={(e) => onMaxSpeedChange(Number(e.target.value))}
              className="package-input mt-1"
              placeholder="70"
              min="1"
            />
          </div>
          
          <div>
            <Label htmlFor="maxWeight" className="text-sm font-medium">Max Weight (kg)</Label>
            <Input
              id="maxWeight"
              type="number"
              value={maxWeight}
              onChange={(e) => onMaxWeightChange(Number(e.target.value))}
              className="package-input mt-1"
              placeholder="200"
              min="1"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
