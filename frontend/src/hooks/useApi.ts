import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, packageApi, vehicleApi, deliveryApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

// Query keys
export const queryKeys = {
  auth: {
    profile: ['auth', 'profile'] as const,
    users: ['auth', 'users'] as const,
    user: (id: string) => ['auth', 'users', id] as const,
    usersByRole: (role: string) => ['auth', 'users', 'role', role] as const,
  },
  packages: {
    all: ['packages'] as const,
    paginated: (page: number, limit: number) => ['packages', 'paginated', page, limit] as const,
    byId: (id: string) => ['packages', id] as const,
    byOfferCode: (offerCode: string) => ['packages', 'offer', offerCode] as const,
    byWeightRange: (min: number, max: number) => ['packages', 'weight-range', min, max] as const,
  },
  vehicles: {
    all: ['vehicles'] as const,
    paginated: (page: number, limit: number) => ['vehicles', 'paginated', page, limit] as const,
    byId: (id: string) => ['vehicles', id] as const,
    available: ['vehicles', 'available'] as const,
    bySpeedRange: (min: number, max: number) => ['vehicles', 'speed-range', min, max] as const,
    byWeightCapacity: (min: number, max: number) => ['vehicles', 'weight-capacity', min, max] as const,
  },
  deliveries: {
    history: ['deliveries', 'history'] as const,
    paginated: (page: number, limit: number) => ['deliveries', 'paginated', page, limit] as const,
    byId: (id: string) => ['deliveries', id] as const,
    stats: ['deliveries', 'stats'] as const,
    byDateRange: (start: string, end: string) => ['deliveries', 'date-range', start, end] as const,
    byCostRange: (min: number, max: number) => ['deliveries', 'cost-range', min, max] as const,
  },
};

// Auth hooks
export const useAuth = {
  // Get user profile
  useProfile: () => {
    return useQuery({
      queryKey: queryKeys.auth.profile,
      queryFn: async () => {
        const response = await authApi.getProfile();
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch profile');
        }
        return response.data;
      },
      retry: false,
    });
  },

  // Get all users
  useUsers: (page: number = 1, limit: number = 10) => {
    return useQuery({
      queryKey: queryKeys.auth.users,
      queryFn: async () => {
        const response = await authApi.getUsers({ page, limit });
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch users');
        }
        return response.data;
      },
    });
  },

  // Get user by ID
  useUser: (id: string) => {
    return useQuery({
      queryKey: queryKeys.auth.user(id),
      queryFn: async () => {
        const response = await authApi.getUserById(id);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch user');
        }
        return response.data;
      },
      enabled: !!id,
    });
  },

  // Get users by role
  useUsersByRole: (role: 'admin' | 'user') => {
    return useQuery({
      queryKey: queryKeys.auth.usersByRole(role),
      queryFn: async () => {
        const response = await authApi.getUsersByRole(role);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch users by role');
        }
        return response.data;
      },
      enabled: !!role,
    });
  },

  // Register user mutation
  useRegister: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: authApi.register,
      onSuccess: (data) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message || 'User registered successfully',
          });
          // Store token if registration includes it
          if (data.data && typeof data.data === 'object' && 'token' in data.data) {
            localStorage.setItem('authToken', (data.data as { token: string }).token);
          }
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to register user',
          variant: 'destructive',
        });
      },
    });
  },

  // Login user mutation
  useLogin: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: authApi.login,
      onSuccess: (data) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message || 'Login successful',
          });
          // Store token
          if (data.data && typeof data.data === 'object' && 'token' in data.data) {
            localStorage.setItem('authToken', (data.data as { token: string }).token);
          }
          // Invalidate profile query to refetch user data
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to login',
          variant: 'destructive',
        });
      },
    });
  },

  // Update user mutation
  useUpdateUser: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: any }) =>
        authApi.updateUser(id, data),
      onSuccess: (data, variables) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message || 'User updated successfully',
          });
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.users });
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.user(variables.id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update user',
          variant: 'destructive',
        });
      },
    });
  },

  // Delete user mutation
  useDeleteUser: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: authApi.deleteUser,
      onSuccess: (data, id) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message || 'User deleted successfully',
          });
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.users });
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.user(id) });
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete user',
          variant: 'destructive',
        });
      },
    });
  },

  // Change password mutation
  useChangePassword: () => {
    return useMutation({
      mutationFn: authApi.changePassword,
      onSuccess: (data) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message || 'Password changed successfully',
          });
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to change password',
          variant: 'destructive',
        });
      },
    });
  },

  // Toggle user status mutation
  useToggleUserStatus: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: authApi.toggleUserStatus,
      onSuccess: (data, id) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message || 'User status updated successfully',
          });
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.users });
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.user(id) });
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update user status',
          variant: 'destructive',
        });
      },
    });
  },
};

// Package hooks
export const usePackages = {
  // Get all packages
  usePackages: (page: number = 1, limit: number = 10) => {
    return useQuery({
      queryKey: queryKeys.packages.paginated(page, limit),
      queryFn: async () => {
        const response = await packageApi.getPackages({ page, limit });
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch packages');
        }
        return response.data;
      },
    });
  },

  // Get package by ID
  usePackage: (id: string) => {
    return useQuery({
      queryKey: queryKeys.packages.byId(id),
      queryFn: async () => {
        const response = await packageApi.getPackageById(id);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch package');
        }
        return response.data;
      },
      enabled: !!id,
    });
  },

  // Get packages by offer code
  usePackagesByOfferCode: (offerCode: string) => {
    return useQuery({
      queryKey: queryKeys.packages.byOfferCode(offerCode),
      queryFn: async () => {
        const response = await packageApi.getPackagesByOfferCode(offerCode);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch packages by offer code');
        }
        return response.data;
      },
      enabled: !!offerCode,
    });
  },

  // Get packages by weight range
  usePackagesByWeightRange: (minWeight: number, maxWeight: number) => {
    return useQuery({
      queryKey: queryKeys.packages.byWeightRange(minWeight, maxWeight),
      queryFn: async () => {
        const response = await packageApi.getPackagesByWeightRange(minWeight, maxWeight);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch packages by weight range');
        }
        return response.data;
      },
      enabled: minWeight >= 0 && maxWeight > minWeight,
    });
  },

  // Create package mutation
  useCreatePackage: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: packageApi.createPackage,
      onSuccess: (data) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message || 'Package created successfully',
          });
          // Invalidate package queries
          queryClient.invalidateQueries({ queryKey: queryKeys.packages.all });
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create package',
          variant: 'destructive',
        });
      },
    });
  },

  // Update package mutation
  useUpdatePackage: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: any }) =>
        packageApi.updatePackage(id, data),
      onSuccess: (data, variables) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message || 'Package updated successfully',
          });
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: queryKeys.packages.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.packages.byId(variables.id) });
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update package',
          variant: 'destructive',
        });
      },
    });
  },

  // Delete package mutation
  useDeletePackage: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: packageApi.deletePackage,
      onSuccess: (data, id) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message || 'Package deleted successfully',
          });
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: queryKeys.packages.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.packages.byId(id) });
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete package',
          variant: 'destructive',
        });
      },
    });
  },
};

// Vehicle hooks
export const useVehicles = {
  // Get all vehicles
  useVehicles: (page: number = 1, limit: number = 10) => {
    return useQuery({
      queryKey: queryKeys.vehicles.paginated(page, limit),
      queryFn: async () => {
        const response = await vehicleApi.getVehicles({ page, limit });
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch vehicles');
        }
        return response.data;
      },
    });
  },

  // Get vehicle by ID
  useVehicle: (id: string) => {
    return useQuery({
      queryKey: queryKeys.vehicles.byId(id),
      queryFn: async () => {
        const response = await vehicleApi.getVehicleById(id);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch vehicle');
        }
        return response.data;
      },
      enabled: !!id,
    });
  },

  // Get available vehicles
  useAvailableVehicles: () => {
    return useQuery({
      queryKey: queryKeys.vehicles.available,
      queryFn: async () => {
        const response = await vehicleApi.getAvailableVehicles();
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch available vehicles');
        }
        return response.data;
      },
    });
  },

  // Get all vehicles for delivery calculation
  useAllVehiclesForDelivery: () => {
    return useQuery({
      queryKey: ['vehicles', 'delivery', 'all'],
      queryFn: async () => {
        const response = await vehicleApi.getAllVehiclesForDelivery();
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch vehicles for delivery');
        }
        return response.data;
      },
    });
  },

  // Get vehicles by speed range
  useVehiclesBySpeedRange: (minSpeed: number, maxSpeed: number) => {
    return useQuery({
      queryKey: queryKeys.vehicles.bySpeedRange(minSpeed, maxSpeed),
      queryFn: async () => {
        const response = await vehicleApi.getVehiclesBySpeedRange(minSpeed, maxSpeed);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch vehicles by speed range');
        }
        return response.data;
      },
      enabled: minSpeed >= 0 && maxSpeed > minSpeed,
    });
  },

  // Get vehicles by weight capacity
  useVehiclesByWeightCapacity: (minWeight: number, maxWeight: number) => {
    return useQuery({
      queryKey: queryKeys.vehicles.byWeightCapacity(minWeight, maxWeight),
      queryFn: async () => {
        const response = await vehicleApi.getVehiclesByWeightCapacity(minWeight, maxWeight);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch vehicles by weight capacity');
        }
        return response.data;
      },
      enabled: minWeight >= 0 && maxWeight > minWeight,
    });
  },

  // Create vehicle mutation
  useCreateVehicle: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: vehicleApi.createVehicle,
      onSuccess: (data) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message || 'Vehicle created successfully',
          });
          // Invalidate vehicle queries
          queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create vehicle',
          variant: 'destructive',
        });
      },
    });
  },

  // Update vehicle mutation
  useUpdateVehicle: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: any }) =>
        vehicleApi.updateVehicle(id, data),
      onSuccess: (data, variables) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message || 'Vehicle updated successfully',
          });
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.byId(variables.id) });
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update vehicle',
          variant: 'destructive',
        });
      },
    });
  },

  // Delete vehicle mutation
  useDeleteVehicle: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: vehicleApi.deleteVehicle,
      onSuccess: (data, id) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message || 'Vehicle deleted successfully',
          });
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.byId(id) });
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete vehicle',
          variant: 'destructive',
        });
      },
    });
  },

  // Update vehicle availability mutation
  useUpdateVehicleAvailability: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, availableTime }: { id: string; availableTime: number }) =>
        vehicleApi.updateVehicleAvailability(id, availableTime),
      onSuccess: (data, variables) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message || 'Vehicle availability updated successfully',
          });
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.byId(variables.id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.available });
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update vehicle availability',
          variant: 'destructive',
        });
      },
    });
  },
};

// Delivery hooks
export const useDeliveries = {
  // Get delivery history
  useDeliveryHistory: (page: number = 1, limit: number = 10) => {
    return useQuery({
      queryKey: queryKeys.deliveries.paginated(page, limit),
      queryFn: async () => {
        const response = await deliveryApi.getDeliveryHistory({ page, limit });
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch delivery history');
        }
        return response.data;
      },
    });
  },

  // Get delivery by ID
  useDelivery: (id: string) => {
    return useQuery({
      queryKey: queryKeys.deliveries.byId(id),
      queryFn: async () => {
        const response = await deliveryApi.getDeliveryById(id);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch delivery');
        }
        return response.data;
      },
      enabled: !!id,
    });
  },

  // Get delivery stats
  useDeliveryStats: () => {
    return useQuery({
      queryKey: queryKeys.deliveries.stats,
      queryFn: async () => {
        const response = await deliveryApi.getDeliveryStats();
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch delivery statistics');
        }
        return response.data;
      },
    });
  },

  // Get deliveries by date range
  useDeliveriesByDateRange: (startDate: string, endDate: string) => {
    return useQuery({
      queryKey: queryKeys.deliveries.byDateRange(startDate, endDate),
      queryFn: async () => {
        const response = await deliveryApi.getDeliveriesByDateRange(startDate, endDate);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch deliveries by date range');
        }
        return response.data;
      },
      enabled: !!startDate && !!endDate,
    });
  },

  // Get deliveries by cost range
  useDeliveriesByCostRange: (minCost: number, maxCost: number) => {
    return useQuery({
      queryKey: queryKeys.deliveries.byCostRange(minCost, maxCost),
      queryFn: async () => {
        const response = await deliveryApi.getDeliveriesByCostRange(minCost, maxCost);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch deliveries by cost range');
        }
        return response.data;
      },
      enabled: minCost >= 0 && maxCost > minCost,
    });
  },

  // Calculate delivery costs mutation
  useCalculateDeliveryCosts: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: deliveryApi.calculateDeliveryCosts,
      onSuccess: (data) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message || 'Delivery costs calculated successfully',
          });
          // Invalidate delivery queries
          queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.history });
          queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.stats });
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to calculate delivery costs',
          variant: 'destructive',
        });
      },
    });
  },

  // Delete delivery mutation
  useDeleteDelivery: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: deliveryApi.deleteDelivery,
      onSuccess: (data, id) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message || 'Delivery deleted successfully',
          });
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.history });
          queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.byId(id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.stats });
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete delivery',
          variant: 'destructive',
        });
      },
    });
  },
};