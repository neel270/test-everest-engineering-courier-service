import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';
import { UserApiResponse, PaginatedUsersResponse } from '../types/api';
import { RegisterResponse, LoginResponse } from '../types/user';

export class UserService {
  /**
   * Register new user
   */
  static async registerUser(userData: {
    name: string;
    email: string;
    password: string;
    role?: 'admin' | 'user';
  }): Promise<RegisterResponse> {
    try {
      const { name, email, password, role = 'user' } = userData;

      // Validate input
      if (!name || !email || !password) {
        throw new Error('Name, email, and password are required');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        role
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: (user._id as any).toString() },
        process.env.JWT_SECRET || 'fallback-secret'
      );

      return {
        user: {
          id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token
      };
    } catch (error) {
      throw new Error(`Failed to register user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Login user
   */
  static async loginUser(credentials: { email: string; password: string }): Promise<LoginResponse> {
    try {
      const { email, password } = credentials;

      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Find user by email
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: (user._id as any).toString() },
        process.env.JWT_SECRET || 'fallback-secret'
      );

      return {
        user: {
          id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token
      };
    } catch (error) {
      throw new Error(`Failed to login: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile(userId: string|number): Promise<UserApiResponse> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        data: {
          id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all users with pagination
   */
  static async getAllUsers(page: number = 1, limit: number = 10): Promise<PaginatedUsersResponse> {
    try {
      const skip = (page - 1) * limit;
      const users = await User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password'); // Exclude password

      const total = await User.countDocuments();

      return {
        success: true,
        data: {
          data: users as any,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<UserApiResponse> {
    try {
      const user = await User.findById(id).select('-password');
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        data: user as any
      };
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user
   */
  static async updateUser(id: string, updateData: Partial<IUser>): Promise<UserApiResponse> {
    try {
      // Prevent password update through this method
      if (updateData.password) {
        delete updateData.password;
      }

      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        message: 'User updated successfully',
        data: user as any
      };
    } catch (error) {
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(id: string): Promise<UserApiResponse> {
    try {
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string|number, oldPassword: string, newPassword: string): Promise<UserApiResponse> {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isOldPasswordValid = await user.comparePassword(oldPassword);
      if (!isOldPasswordValid) {
        throw new Error('Old password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      throw new Error(`Failed to change password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Toggle user active status
   */
  static async toggleUserStatus(id: string): Promise<UserApiResponse> {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      user.isActive = !user.isActive;
      await user.save();

      return {
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        data: user as any
      };
    } catch (error) {
      throw new Error(`Failed to toggle user status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: 'admin' | 'user'): Promise<UserApiResponse> {
    try {
      const users = await User.find({ role }).sort({ createdAt: -1 }).select('-password');
      return {
        success: true,
        data: users as any
      };
    } catch (error) {
      throw new Error(`Failed to fetch users by role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}