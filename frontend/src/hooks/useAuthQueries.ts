import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

// Login mutation hook
export const useLogin = () => {
  const { login } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await authApi.login(credentials);
      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }
      return response.data;
    },
    onSuccess: (data: { token: string; user: User }) => {
      if (data?.token && data?.user) {
        login(data.token, data.user);
        toast({
          title: 'Success',
          description: 'Logged in successfully!',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Register mutation hook
export const useRegister = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await authApi.register(userData);
      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Account created successfully! Please log in.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Get user profile query hook
export const useUserProfile = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await authApi.getProfile();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch profile');
      }
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Change password mutation hook
export const useChangePassword = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (passwordData: ChangePasswordData) => {
      const response = await authApi.changePassword(passwordData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to change password');
      }
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Password changed successfully!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Password Change Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Get all users query hook (admin only)
export const useUsers = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const response = await authApi.getUsers(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch users');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get users by role query hook
export const useUsersByRole = (role: 'admin' | 'user') => {
  return useQuery({
    queryKey: ['users', 'role', role],
    queryFn: async () => {
      const response = await authApi.getUsersByRole(role);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch users by role');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Update user mutation hook
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const response = await authApi.updateUser(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update user');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast({
        title: 'Success',
        description: 'User updated successfully!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Toggle user status mutation hook
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await authApi.toggleUserStatus(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to toggle user status');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'User status updated successfully!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Delete user mutation hook
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await authApi.deleteUser(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete user');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'User deleted successfully!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};