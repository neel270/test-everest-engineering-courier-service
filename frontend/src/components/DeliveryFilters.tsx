import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { vehicleApi } from "@/lib/api";

interface DeliveryFiltersProps {
  filters: {
    startDate?: string;
    endDate?: string;
    minCost?: number;
    maxCost?: number;
    vehicleId?: string;
  };
  onFiltersChange: (filters: {
    startDate?: string;
    endDate?: string;
    minCost?: number;
    maxCost?: number;
    vehicleId?: string;
  }) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

export const DeliveryFilters: React.FC<DeliveryFiltersProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
}) => {
  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const response = await vehicleApi.getVehicles();
      return response.data;
    },
  });

  const vehicles = (vehiclesData as { items: unknown[] })?.items || [];

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const handleCostChange = (field: 'minCost' | 'maxCost', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onFiltersChange({
      ...filters,
      [field]: numValue,
    });
  };

  const handleVehicleChange = (vehicleId: string) => {
    onFiltersChange({
      ...filters,
      vehicleId: vehicleId === 'all' ? undefined : vehicleId,
    });
  };

  const hasActiveFilters =
    filters.startDate ||
    filters.endDate ||
    filters.minCost !== undefined ||
    filters.maxCost !== undefined ||
    filters.vehicleId;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="ml-auto"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
            />
          </div>

          {/* Vehicle Filter */}
          <div className="space-y-2">
            <Label>Vehicle</Label>
            <select
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
              value={filters.vehicleId || 'all'}
              onChange={(e) => handleVehicleChange(e.target.value)}
            >
              <option value="all">All Vehicles</option>
              {vehicles.map((vehicle: { _id: string; id: number; maxSpeed: number }) => (
                <option key={vehicle._id} value={vehicle._id}>
                  Vehicle {vehicle.id} - {vehicle.maxSpeed} km/h
                </option>
              ))}
            </select>
          </div>

          {/* Cost Range */}
          <div className="space-y-2">
            <Label>Min Cost ($)</Label>
            <Input
              type="number"
              placeholder="0"
              value={filters.minCost || ''}
              onChange={(e) => handleCostChange('minCost', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Max Cost ($)</Label>
            <Input
              type="number"
              placeholder="1000"
              value={filters.maxCost || ''}
              onChange={(e) => handleCostChange('maxCost', e.target.value)}
            />
          </div>

          {/* Apply Button */}
          <div className="flex items-end">
            <Button onClick={onApplyFilters} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground mb-2">Active Filters:</div>
            <div className="flex flex-wrap gap-2">
              {filters.startDate && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800">
                  From: {formatDate(filters.startDate)}
                </span>
              )}
              {filters.endDate && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800">
                  To: {formatDate(filters.endDate)}
                </span>
              )}
              {filters.vehicleId && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800">
                  Vehicle: {vehicles.find((v: { _id: string; id: number }) => v._id === filters.vehicleId)?.id || 'Unknown'}
                </span>
              )}
              {filters.minCost !== undefined && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-800">
                  Min: ${filters.minCost}
                </span>
              )}
              {filters.maxCost !== undefined && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-800">
                  Max: ${filters.maxCost}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};