import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { AuthRequest } from '../middleware/auth';

export class UserController {
  /**
   * Register new user
   */
  static async registerUser(req: Request, res: Response) {
    try {
      const result = await UserService.registerUser(req.body);
      res.status(201).json(result);
    } catch (error: Error | unknown) {
      console.error('Register user error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to register user',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Login user
   */
  static async loginUser(req: Request, res: Response) {
    try {
      const result = await UserService.loginUser(req.body);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Login user error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to login',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const result = await UserService.getUserProfile(userId);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get user profile error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch user profile',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get all users
   */
  static async getAllUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await UserService.getAllUsers(page, limit);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch users',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserService.getUserById(id);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch user',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Update user
   */
  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserService.updateUser(id, req.body);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to update user',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserService.deleteUser(id);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to delete user',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Change user password
   */
  static async changePassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { oldPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Old password and new password are required'
        });
      }

      const result = await UserService.changePassword(userId, oldPassword, newPassword);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to change password',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Toggle user active status
   */
  static async toggleUserStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserService.toggleUserStatus(id);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Toggle user status error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to toggle user status',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(req: Request, res: Response) {
    try {
      const { role } = req.params;

      if (role !== 'admin' && role !== 'user') {
        return res.status(400).json({
          success: false,
          message: 'Role must be either admin or user'
        });
      }

      const result = await UserService.getUsersByRole(role as 'admin' | 'user');
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get users by role error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch users by role',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
}