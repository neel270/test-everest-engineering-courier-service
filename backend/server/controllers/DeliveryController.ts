import { Request, Response } from "express";
import { DeliveryService } from "../services/DeliveryService";

export class DeliveryController {
  /**
   * Calculate delivery costs
   */
  static async calculateDeliveryCosts(req: Request, res: Response) {
    try {
      const result = await DeliveryService.calculateDeliveryCosts(req.body);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error("Calculate delivery costs error:", error);
      res.status(500).json({
        success: false,
        message:
          (error as Error).message || "Failed to calculate delivery costs",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
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
      console.error("Get delivery history error:", error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || "Failed to fetch delivery history",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
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
      console.error("Get delivery error:", error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || "Failed to fetch delivery",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
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
      console.error("Get delivery stats error:", error);
      res.status(500).json({
        success: false,
        message:
          (error as Error).message || "Failed to fetch delivery statistics",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
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
      console.error("Delete delivery error:", error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || "Failed to delete delivery",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
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
          message: "startDate and endDate are required",
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Valid startDate and endDate are required",
        });
      }

      const result = await DeliveryService.getDeliveriesByDateRange(start, end);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error("Get deliveries by date range error:", error);
      res.status(500).json({
        success: false,
        message:
          (error as Error).message ||
          "Failed to fetch deliveries by date range",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
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
          message: "Valid minCost and maxCost are required",
        });
      }

      const result = await DeliveryService.getDeliveriesByCostRange(min, max);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error("Get deliveries by cost range error:", error);
      res.status(500).json({
        success: false,
        message:
          (error as Error).message ||
          "Failed to fetch deliveries by cost range",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }

  /**
   * Get deliveries by vehicle ID
   */
  static async getDeliveriesByVehicle(req: Request, res: Response) {
    try {
      const { vehicleId } = req.params;

      if (!vehicleId) {
        return res.status(400).json({
          success: false,
          message: "Vehicle ID is required",
        });
      }

      const result = await DeliveryService.getDeliveriesByVehicle(vehicleId);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error("Get deliveries by vehicle error:", error);
      res.status(500).json({
        success: false,
        message:
          (error as Error).message || "Failed to fetch deliveries by vehicle",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }

  /**
   * Get deliveries with advanced filters
   */
  static async getDeliveriesWithFilters(req: Request, res: Response) {
    try {
      const { startDate, endDate, minCost, maxCost, vehicleId, page, limit, minTime, maxTime } =
        req.query;

      const filters: any = {};

      // Parse date filters - keep as ISO strings for MongoDB compatibility
      if (startDate) {
        const start = new Date(startDate as string);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Valid startDate is required",
          });
        }
        filters.startDate = start.toISOString();
      }

      if (endDate) {
        const end = new Date(endDate as string);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Valid endDate is required",
          });
        }
        filters.endDate = end.toISOString();
      }

      // Parse cost filters
      if (minCost !== undefined) {
        filters.minCost = parseFloat(minCost as string);
        if (isNaN(filters.minCost)) {
          return res.status(400).json({
            success: false,
            message: "Valid minCost is required",
          });
        }
      }

      if (maxCost !== undefined) {
        filters.maxCost = parseFloat(maxCost as string);
        if (isNaN(filters.maxCost)) {
          return res.status(400).json({
            success: false,
            message: "Valid maxCost is required",
          });
        }
      }

      // Vehicle filter
      if (vehicleId) {
        filters.vehicleId = vehicleId as string;
      }

      // Time range filter
      if (minTime !== undefined) {
        filters.minTime = parseFloat(minTime as string);
        if (isNaN(filters.minTime)) {
          return res.status(400).json({
            success: false,
            message: "Valid minTime is required",
          });
        }
      }

      if (maxTime !== undefined) {
        filters.maxTime = parseFloat(maxTime as string);
        if (isNaN(filters.maxTime)) {
          return res.status(400).json({
            success: false,
            message: "Valid maxTime is required",
          });
        }
      }

      // Pagination
      if (page) {
        filters.page = parseInt(page as string);
      }
      if (limit) {
        filters.limit = parseInt(limit as string);
      }
      console.log(filters, "filters 512");
      const result = await DeliveryService.getDeliveriesWithFilters(filters);
      res.json(result);
    } catch (error: Error | unknown) {
      console.error("Get deliveries with filters error:", error);
      res.status(500).json({
        success: false,
        message:
          (error as Error).message || "Failed to fetch deliveries with filters",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }
}
