import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useVehicles } from '@/hooks/useApi';

// Zod validation schema
const vehicleSchema = z.object({
  name: z.string()
    .min(1, 'Vehicle name is required')
    .min(2, 'Vehicle name must be at least 2 characters')
    .max(50, 'Vehicle name must be less than 50 characters'),
  maxSpeed: z.number()
    .min(1, 'Max speed must be greater than 0')
    .max(300, 'Max speed cannot exceed 300 km/hr'),
  maxCarriableWeight: z.number()
    .min(1, 'Max weight must be greater than 0')
    .max(50000, 'Max weight cannot exceed 50,000 kg')
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

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

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  onClose: () => void;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ vehicle, onClose }) => {
  const createVehicleMutation = useVehicles.useCreateVehicle();
  const updateVehicleMutation = useVehicles.useUpdateVehicle();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: vehicle?.name || '',
      maxSpeed: vehicle?.maxSpeed || 0,
      maxCarriableWeight: vehicle?.maxCarriableWeight || 0,
    }
  });

  // Reset form when vehicle prop changes
  useEffect(() => {
    if (vehicle) {
      reset({
        name: vehicle.name,
        maxSpeed: vehicle.maxSpeed,
        maxCarriableWeight: vehicle.maxCarriableWeight,
      });
    } else {
      reset({
        name: '',
        maxSpeed: 0,
        maxCarriableWeight: 0,
      });
    }
  }, [vehicle, reset]);

  const onSubmit = async (data: VehicleFormData) => {
    try {
      if (vehicle) {
        // Update existing vehicle
        await updateVehicleMutation.mutateAsync({
          id: vehicle._id,
          data
        });
      } else {
        // Create new vehicle
        await createVehicleMutation.mutateAsync(data);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save vehicle:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Vehicle Name</Label>
              <Input
                id="name"
                type="text"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
                placeholder="Enter vehicle name"
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="maxSpeed">Max Speed (km/hr)</Label>
              <Input
                id="maxSpeed"
                type="number"
                {...register('maxSpeed', { valueAsNumber: true })}
                className={errors.maxSpeed ? 'border-destructive' : ''}
                placeholder="Enter max speed"
                min="1"
              />
              {errors.maxSpeed && (
                <p className="text-sm text-destructive mt-1">{errors.maxSpeed.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="maxCarriableWeight">Max Weight (kg)</Label>
              <Input
                id="maxCarriableWeight"
                type="number"
                {...register('maxCarriableWeight', { valueAsNumber: true })}
                className={errors.maxCarriableWeight ? 'border-destructive' : ''}
                placeholder="Enter max weight"
                min="1"
              />
              {errors.maxCarriableWeight && (
                <p className="text-sm text-destructive mt-1">{errors.maxCarriableWeight.message}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-delivery-orange to-courier-blue hover:opacity-90 transition-opacity"
              >
                {isSubmitting ? 'Saving...' : (vehicle ? 'Update Vehicle' : 'Create Vehicle')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};