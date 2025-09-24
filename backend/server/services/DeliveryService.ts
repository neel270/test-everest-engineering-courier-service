import Delivery from "../models/Delivery";
import VehicleModel from "../models/Vehicle";
import PackageModel from "../models/Package";
import {
  DeliveryService as SharedDeliveryService,
  DeliveryResult,
} from "../lib/delivery-service";

export class DeliveryService {
  /**
   * Calculate delivery costs and save to database
   */
  static async calculateDeliveryCosts(deliveryData: {
    packages: Array<{
      id: string;
      weight: number;
      distance: number;
      offerCode?: string;
    }>;
    vehicles: Array<{
      id: number;
      name: string;
      maxSpeed: number;
      maxCarriableWeight: number;
      availableTime?: number;
    }>;
    baseDeliveryCost: number;
  }) {
    try {
      const { packages, vehicles, baseDeliveryCost } = deliveryData;

      // Validate input
      if (!packages || !vehicles || !baseDeliveryCost) {
        throw new Error(
          "Packages, vehicles, and base delivery cost are required"
        );
      }

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
      console.log(updatedVehicles, "updatedVehicles 45");
      // Calculate totals
      const totalCost = results.reduce(
        (sum: number, result: DeliveryResult) => sum + result.totalCost,
        0
      );
      const totalDiscount = results.reduce(
        (sum: number, result: DeliveryResult) => sum + result.discount,
        0
      );

      // Upsert Packages and Vehicles, then store references on Delivery
      const packageDocs = await Promise.all(
        packages.map(async (pkg) =>
          PackageModel.findOneAndUpdate(
            { id: pkg.id },
            {
              id: pkg.id,
              weight: pkg.weight,
              distance: pkg.distance,
              offerCode: pkg.offerCode || "",
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          )
        )
      );
      const vehicleDocs = await Promise.all(
        updatedVehicles.map(async (veh) =>
          VehicleModel.findOneAndUpdate(
            { id: veh.id },
            {
              id: veh.id,
              name: veh.name,
              maxSpeed: veh.maxSpeed,
              maxCarriableWeight: veh.maxCarriableWeight,
              availableTime: veh.availableTime ?? 0,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          )
        )
      );

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
  static async getDeliveryHistory(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      const deliveries = await Delivery.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("totalCost totalDiscount createdAt")
        .populate({ path: "packages", select: "id" })
        .populate({
          path: "vehicles",
          select: "id name maxSpeed maxCarriableWeight availableTime",
        });

      const total = await Delivery.countDocuments();

      return {
        success: true,
        data: {
          deliveries,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalDeliveries: total,
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
  static async getDeliveryById(id: string) {
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
  static async getDeliveryStats() {
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
  static async deleteDelivery(id: string) {
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
  static async getDeliveriesByDateRange(startDate: Date, endDate: Date) {
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
  static async getDeliveriesByCostRange(minCost: number, maxCost: number) {
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
}
