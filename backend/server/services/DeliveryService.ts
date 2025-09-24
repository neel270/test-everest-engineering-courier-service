import Delivery from "../models/Delivery";
import {
  DeliveryService as SharedDeliveryService,
  DeliveryResult,
} from "../lib/delivery-service";
import {
  DeliveryCalculationRequest,
  DeliveryFilters,
  ApiResponse,
} from "../types";
import { DeliveryRepository } from "../repositories/DeliveryRepository";
import { PackageRepository } from "../repositories/PackageRepository";
import { VehicleRepository } from "../repositories/VehicleRepository";
import { DIContainer } from "../core/DIContainer";
import { EventManager, DeliveryEvents } from "../events/EventManager";
import { LoggingDecorator, ValidationDecorator, RetryDecorator } from "../decorators/ServiceDecorators";

export class DeliveryService {
  private static deliveryRepository: DeliveryRepository;
  private static packageRepository: PackageRepository;
  private static vehicleRepository: VehicleRepository;
  private static eventManager: EventManager;

  private static initializeDependencies() {
    if (!this.deliveryRepository) {
      const container = DIContainer.getInstance();
      this.deliveryRepository = container.resolve('deliveryRepository');
      this.packageRepository = container.resolve('packageRepository');
      this.vehicleRepository = container.resolve('vehicleRepository');
      this.eventManager = EventManager.getInstance();
    }
  }

  /**
    * Calculate delivery costs and save to database using Repository Pattern
    */
  @LoggingDecorator.logMethodCall
  @ValidationDecorator.validateInput
  @RetryDecorator.withRetry(3, 1000)
  static async calculateDeliveryCosts(
    deliveryData: DeliveryCalculationRequest
  ): Promise<ApiResponse<any>> {
    try {
      // Initialize dependencies if not already done
      this.initializeDependencies();

      const { packages, vehicles, baseDeliveryCost } = deliveryData;

      // Validate input
      if (!packages || !vehicles || !baseDeliveryCost) {
        throw new Error(
          "Packages, vehicles, and base delivery cost are required"
        );
      }

      // Emit calculation started event
      this.eventManager.emit(DeliveryEvents.CALCULATION_STARTED, {
        packageCount: packages.length,
        vehicleCount: vehicles.length,
        baseCost: baseDeliveryCost,
      });

      // Create delivery service instance
      const deliveryService = new SharedDeliveryService(baseDeliveryCost);

      // Ensure all vehicles have availableTime property
      const vehiclesWithAvailability = vehicles.map((vehicle) => ({
        ...vehicle,
        availableTime: vehicle.availableTime ?? 0,
      }));

      // Calculate results (includes updated vehicles with availability after early assignments)
      const {
        results,
        optimizationSteps,
        vehicles: updatedVehicles,
        planningText,
      } = deliveryService.calculateAllDeliveryResults(
        packages,
        vehiclesWithAvailability
      );

      // Calculate totals
      const totalCost = results.reduce(
        (sum: number, result: DeliveryResult) => sum + result.totalCost,
        0
      );
      const totalDiscount = results.reduce(
        (sum: number, result: DeliveryResult) => sum + result.discount,
        0
      );

      // Upsert Packages and Vehicles using Repository Pattern
      const packageDocs = await this.packageRepository.upsertMultiplePackages(packages);
      const vehicleDocs = await this.vehicleRepository.upsertMultipleVehicles(updatedVehicles);

      const delivery = new Delivery({
        packages: packageDocs.map((d) => d._id),
        vehicles: vehicleDocs.map((d) => d._id),
        baseDeliveryCost,
        results,
        optimizationSteps,
        totalCost,
        totalDiscount,
      });

      await delivery.save();

      // Emit delivery calculated event
      this.eventManager.emit(DeliveryEvents.DELIVERY_CALCULATED, {
        deliveryId: delivery._id,
        totalCost,
        totalDiscount,
        totalPackages: packages.length,
        totalVehicles: updatedVehicles.length,
      });

      return {
        success: true,
        data: {
          deliveryId: delivery._id,
          results,
          optimizationSteps,
          vehicles: updatedVehicles, // return enriched vehicles for client convenience
          summary: {
            totalCost,
            totalDiscount,
            totalPackages: packages.length,
            totalVehicles: updatedVehicles.length,
          },
          planningText,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to calculate delivery costs: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get delivery history with pagination
   */
  static async getDeliveryHistory(
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<any>> {
    try {
      const skip = (page - 1) * limit;
      const deliveries = await Delivery.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "packages", select: "id" })
        .populate({
          path: "vehicles",
          select: "id name maxSpeed maxCarriableWeight availableTime",
        });

      const total = await Delivery.countDocuments();

      return {
        success: true,
        data: {
          items: deliveries,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch delivery history: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get delivery by ID
   */
  static async getDeliveryById(id: string): Promise<ApiResponse<any>> {
    try {
      const delivery = await Delivery.findById(id)
        .populate({ path: "packages", select: "id weight distance offerCode" })
        .populate({
          path: "vehicles",
          select: "id name maxSpeed maxCarriableWeight availableTime",
        });
      if (!delivery) {
        throw new Error("Delivery not found");
      }
      return {
        success: true,
        data: delivery,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch delivery: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get delivery statistics
   */
  static async getDeliveryStats(): Promise<ApiResponse<any>> {
    try {
      const totalDeliveries = await Delivery.countDocuments();
      const totalCost = await Delivery.aggregate([
        { $group: { _id: null, total: { $sum: "$totalCost" } } },
      ]);
      const totalDiscount = await Delivery.aggregate([
        { $group: { _id: null, total: { $sum: "$totalDiscount" } } },
      ]);

      const averageCost =
        totalDeliveries > 0 ? (totalCost[0]?.total || 0) / totalDeliveries : 0;
      const averageDiscount =
        totalDeliveries > 0
          ? (totalDiscount[0]?.total || 0) / totalDeliveries
          : 0;

      return {
        success: true,
        data: {
          totalDeliveries,
          totalCost: totalCost[0]?.total || 0,
          totalDiscount: totalDiscount[0]?.total || 0,
          averageCost,
          averageDiscount,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch delivery statistics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Delete delivery by ID
   */
  static async deleteDelivery(id: string): Promise<ApiResponse> {
    try {
      const delivery = await Delivery.findByIdAndDelete(id);
      if (!delivery) {
        throw new Error("Delivery not found");
      }

      return {
        success: true,
        message: "Delivery deleted successfully",
      };
    } catch (error) {
      throw new Error(
        `Failed to delete delivery: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get deliveries by date range
   */
  static async getDeliveriesByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<ApiResponse<any>> {
    try {
      const deliveries = await Delivery.find({
        createdAt: { $gte: startDate, $lte: endDate },
      }).sort({ createdAt: -1 });

      return {
        success: true,
        data: deliveries,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch deliveries by date range: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get deliveries by cost range
   */
  static async getDeliveriesByCostRange(
    minCost: number,
    maxCost: number
  ): Promise<ApiResponse<any>> {
    try {
      const deliveries = await Delivery.find({
        totalCost: { $gte: minCost, $lte: maxCost },
      }).sort({ createdAt: -1 });

      return {
        success: true,
        data: deliveries,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch deliveries by cost range: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get deliveries by vehicle ID
   */
  static async getDeliveriesByVehicle(
    vehicleId: string
  ): Promise<ApiResponse<any>> {
    try {
      const deliveries = await Delivery.find({
        vehicles: vehicleId,
      })
        .sort({ createdAt: -1 })
        .populate({ path: "packages", select: "id weight distance offerCode" })
        .populate({
          path: "vehicles",
          select: "id name maxSpeed maxCarriableWeight availableTime",
        });

      return {
        success: true,
        data: deliveries,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch deliveries by vehicle: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get deliveries with advanced filtering
   */
  static async getDeliveriesWithFilters(
    filters: DeliveryFilters & { page?: number; limit?: number }
  ): Promise<ApiResponse<any>> {
    try {
      const {
        startDate,
        endDate,
        minCost,
        maxCost,
        vehicleId,
        minTime,
        maxTime,
        page = 1,
        limit = 10,
      } = filters;

      const skip = (page - 1) * limit;
      let query: any = {};

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
      }

      // Cost range filter
      if (minCost !== undefined || maxCost !== undefined) {
        query.totalCost = {};
        if (minCost !== undefined) query.totalCost.$gte = minCost;
        if (maxCost !== undefined) query.totalCost.$lte = maxCost;
      }

      // Vehicle filter
      if (vehicleId) {
        query.vehicles = vehicleId;
      }

      // Time range filter - filter by estimated delivery time in results
      if (minTime !== undefined || maxTime !== undefined) {
        query['results.estimatedDeliveryTime'] = {};
        if (minTime !== undefined) query['results.estimatedDeliveryTime'].$gte = minTime;
        if (maxTime !== undefined) query['results.estimatedDeliveryTime'].$lte = maxTime;
      }
      const deliveries = await Delivery.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "packages" })
        .populate({ path: "vehicles" });

      const total = await Delivery.countDocuments(query);
      return {
        success: true,
        data: {
          items: deliveries,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch deliveries with filters: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
