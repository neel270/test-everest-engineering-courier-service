import { Request, Response } from 'express';
import { VehicleService } from '../services/VehicleService';

export class VehicleController {
  /**
   * Get all vehicles
   */
  static async getAllVehicles(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await VehicleService.getAllVehicles(page, limit);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get vehicles error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch vehicles',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get vehicle by ID
   */
  static async getVehicleById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await VehicleService.getVehicleById(id);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get vehicle error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch vehicle',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Create new vehicle
   */
  static async createVehicle(req: Request, res: Response) {
    try {
      const result = await VehicleService.createVehicle(req.body);
      res.status(201).json(result);
    } catch (error: Error | unknown) {
      console.error('Create vehicle error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to create vehicle',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Update vehicle
   */
  static async updateVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await VehicleService.updateVehicle(id, req.body);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Update vehicle error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to update vehicle',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Delete vehicle
   */
  static async deleteVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await VehicleService.deleteVehicle(id);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Delete vehicle error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to delete vehicle',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get available vehicles
   */
  static async getAvailableVehicles(_req: Request, res: Response) {
    try {
      const result = await VehicleService.getAvailableVehicles();
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get available vehicles error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch available vehicles',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get all vehicles for delivery calculation
   */
  static async getAllVehiclesForDelivery(_req: Request, res: Response) {
    try {
      const result = await VehicleService.getAllVehiclesForDelivery();
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get all vehicles for delivery error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch vehicles for delivery',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get vehicles by speed range
   */
  static async getVehiclesBySpeedRange(req: Request, res: Response) {
    try {
      const { minSpeed, maxSpeed } = req.query;
      const min = parseFloat(minSpeed as string);
      const max = parseFloat(maxSpeed as string);

      if (isNaN(min) || isNaN(max)) {
        return res.status(400).json({
          success: false,
          message: 'Valid minSpeed and maxSpeed are required'
        });
      }

      const result = await VehicleService.getVehiclesBySpeedRange(min, max);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get vehicles by speed range error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch vehicles by speed range',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get vehicles by weight capacity range
   */
  static async getVehiclesByWeightCapacity(req: Request, res: Response) {
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

      const result = await VehicleService.getVehiclesByWeightCapacity(min, max);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get vehicles by weight capacity error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch vehicles by weight capacity',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Update vehicle availability
   */
  static async updateVehicleAvailability(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { availableTime } = req.body;

      if (typeof availableTime !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Valid availableTime is required'
        });
      }

      const result = await VehicleService.updateVehicleAvailability(id, availableTime);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Update vehicle availability error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to update vehicle availability',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
}