import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Truck, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useVehicles } from '@/hooks/useApi';
import { VehicleForm } from './VehicleForm';

interface Vehicle {
  _id: string;
  id: number;
  name: string;
  maxSpeed: number;
  maxCarriableWeight: number;
  availableTime: number;
  createdAt: string;
  updatedAt: string;
}

interface VehicleListProps {
  onVehicleSelect?: (vehicle: Vehicle) => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({ onVehicleSelect }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const vehiclesQuery = useVehicles.useVehicles(currentPage, 10);
  const deleteVehicleMutation = useVehicles.useDeleteVehicle();

  useEffect(() => {
    if (vehiclesQuery.data) {
      const response = vehiclesQuery.data as {
        data: Vehicle[];
        pagination: { totalPages: number; currentPage: number };
      };
      setVehicles(response.data);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.currentPage);
    }
  }, [vehiclesQuery.data]);

  const handleDelete = async (vehicleId: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicleMutation.mutateAsync(vehicleId);
        // Refresh the list
        vehiclesQuery.refetch();
      } catch (error) {
        console.error('Failed to delete vehicle:', error);
      }
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingVehicle(null);
    vehiclesQuery.refetch();
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.id.toString().includes(searchTerm)
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    vehiclesQuery.refetch();
  };

  if (showForm) {
    return (
      <VehicleForm
        vehicle={editingVehicle}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Vehicle Management
          </CardTitle>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-delivery-orange to-courier-blue hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search vehicles by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                      <p className="text-sm text-muted-foreground">ID: {vehicle.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(vehicle)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(vehicle._id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Max Speed:</span>
                      <Badge variant="outline">{vehicle.maxSpeed} km/hr</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Max Weight:</span>
                      <Badge variant="outline">{vehicle.maxCarriableWeight} kg</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant={vehicle.availableTime === 0 ? "default" : "secondary"}>
                        {vehicle.availableTime === 0 ? "Available" : "Busy"}
                      </Badge>
                    </div>
                  </div>

                  {onVehicleSelect && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onVehicleSelect(vehicle)}
                    >
                      Select Vehicle
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVehicles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No vehicles found matching your search.' : 'No vehicles found. Add your first vehicle!'}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};