import { Request, Response } from 'express';
import { PackageService } from '../services/PackageService';

export class PackageController {
  /**
   * Get all packages
   */
  static async getAllPackages(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await PackageService.getAllPackages(page, limit);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get packages error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch packages',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get package by ID
   */
  static async getPackageById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await PackageService.getPackageById(id);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get package error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch package',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Create new package
   */
  static async createPackage(req: Request, res: Response) {
    try {
      const result = await PackageService.createPackage(req.body);
      res.status(201).json(result);
    } catch (error: Error | unknown) {
      console.error('Create package error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to create package',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Update package
   */
  static async updatePackage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await PackageService.updatePackage(id, req.body);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Update package error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to update package',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Delete package
   */
  static async deletePackage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await PackageService.deletePackage(id);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Delete package error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to delete package',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get packages by offer code
   */
  static async getPackagesByOfferCode(req: Request, res: Response) {
    try {
      const { offerCode } = req.params;
      const result = await PackageService.getPackagesByOfferCode(offerCode);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get packages by offer code error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch packages by offer code',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get packages by weight range
   */
  static async getPackagesByWeightRange(req: Request, res: Response) {
    try {
      const { minWeight, maxWeight } = req.query;
      const min = parseFloat(minWeight as string);
      const max = parseFloat(maxWeight as string);

      if (isNaN(min) || isNaN(max)) {
        return res.status(400).json({
          success: false,
          message: 'Valid minWeight and maxWeight are required'
        });
      }

      const result = await PackageService.getPackagesByWeightRange(min, max);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get packages by weight range error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch packages by weight range',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
}