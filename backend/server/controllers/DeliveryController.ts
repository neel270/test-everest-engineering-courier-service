import { Request, Response } from 'express';
import { DeliveryService } from '../services/DeliveryService';

export class DeliveryController {
  /**
   * Calculate delivery costs
   */
  static async calculateDeliveryCosts(req: Request, res: Response) {
    try {
      const result = await DeliveryService.calculateDeliveryCosts(req.body);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Calculate delivery costs error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to calculate delivery costs',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get delivery history
   */
  static async getDeliveryHistory(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await DeliveryService.getDeliveryHistory(page, limit);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get delivery history error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch delivery history',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get delivery by ID
   */
  static async getDeliveryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await DeliveryService.getDeliveryById(id);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get delivery error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch delivery',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get delivery statistics
   */
  static async getDeliveryStats(_req: Request, res: Response) {
    try {
      const result = await DeliveryService.getDeliveryStats();
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get delivery stats error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch delivery statistics',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Delete delivery
   */
  static async deleteDelivery(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await DeliveryService.deleteDelivery(id);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Delete delivery error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to delete delivery',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get deliveries by date range
   */
  static async getDeliveriesByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate are required'
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Valid startDate and endDate are required'
        });
      }

      const result = await DeliveryService.getDeliveriesByDateRange(start, end);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get deliveries by date range error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch deliveries by date range',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Get deliveries by cost range
   */
  static async getDeliveriesByCostRange(req: Request, res: Response) {
    try {
      const { minCost, maxCost } = req.query;
      const min = parseFloat(minCost as string);
      const max = parseFloat(maxCost as string);

      if (isNaN(min) || isNaN(max)) {
        return res.status(400).json({
          success: false,
          message: 'Valid minCost and maxCost are required'
        });
      }

      const result = await DeliveryService.getDeliveriesByCostRange(min, max);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error('Get deliveries by cost range error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch deliveries by cost range',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
}