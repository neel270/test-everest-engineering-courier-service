import Vehicle, { IVehicle } from '../models/Vehicle';
import { VehicleApiResponse, PaginatedVehiclesResponse } from '../types/api';

export class VehicleService {
  /**
   * Get all vehicles with optional pagination
   */
  static async getAllVehicles(page: number = 1, limit: number = 10): Promise<PaginatedVehiclesResponse> {
    try {
      const skip = (page - 1) * limit;
      const vehicles = await Vehicle.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Vehicle.countDocuments();

      return {
        success: true,
        data: {
          data: vehicles as any,
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
      throw new Error(`Failed to fetch vehicles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get vehicle by ID
   */
  static async getVehicleById(id: string): Promise<VehicleApiResponse> {
    try {
      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }
      return {
        success: true,
        data: vehicle as any
      };
    } catch (error) {
      throw new Error(`Failed to fetch vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create new vehicle
   */
  static async createVehicle(vehicleData: Partial<IVehicle>): Promise<VehicleApiResponse> {
    try {
      // Validate required fields
      if (!vehicleData.name || !vehicleData.maxSpeed || !vehicleData.maxCarriableWeight) {
        throw new Error('Name, max speed, and max carriable weight are required');
      }

      const newVehicle = new Vehicle(vehicleData);
      await newVehicle.save();

      return {
        success: true,
        message: 'Vehicle created successfully',
        data: newVehicle as any
      };
    } catch (error) {
      throw new Error(`Failed to create vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update vehicle by ID
   */
  static async updateVehicle(id: string, updateData: Partial<IVehicle>): Promise<VehicleApiResponse> {
    try {
      const vehicle = await Vehicle.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      return {
        success: true,
        message: 'Vehicle updated successfully',
        data: vehicle as any
      };
    } catch (error) {
      throw new Error(`Failed to update vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete vehicle by ID
   */
  static async deleteVehicle(id: string): Promise<VehicleApiResponse> {
    try {
      const vehicle = await Vehicle.findByIdAndDelete(id);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      return {
        success: true,
        message: 'Vehicle deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available vehicles (with availableTime = 0)
   */
  static async getAvailableVehicles(): Promise<VehicleApiResponse> {
    try {
      const vehicles = await Vehicle.find({ availableTime: 0 }).sort({ createdAt: -1 });
      return {
        success: true,
        data: vehicles as any
      };
    } catch (error) {
      throw new Error(`Failed to fetch available vehicles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all vehicles for delivery calculation
   */
  static async getAllVehiclesForDelivery(): Promise<VehicleApiResponse> {
    try {
      const vehicles = await Vehicle.find().sort({ createdAt: -1 });
      return {
        success: true,
        data: vehicles as any
      };
    } catch (error) {
      throw new Error(`Failed to fetch vehicles for delivery: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get vehicles by speed range
   */
  static async getVehiclesBySpeedRange(minSpeed: number, maxSpeed: number): Promise<VehicleApiResponse> {
    try {
      const vehicles = await Vehicle.find({
        maxSpeed: { $gte: minSpeed, $lte: maxSpeed }
      }).sort({ createdAt: -1 });

      return {
        success: true,
        data: vehicles as any
      };
    } catch (error) {
      throw new Error(`Failed to fetch vehicles by speed range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get vehicles by weight capacity range
   */
  static async getVehiclesByWeightCapacity(minWeight: number, maxWeight: number): Promise<VehicleApiResponse> {
    try {
      const vehicles = await Vehicle.find({
        maxCarriableWeight: { $gte: minWeight, $lte: maxWeight }
      }).sort({ createdAt: -1 });

      return {
        success: true,
        data: vehicles as any
      };
    } catch (error) {
      throw new Error(`Failed to fetch vehicles by weight capacity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update vehicle availability time
   */
  static async updateVehicleAvailability(id: string, availableTime: number): Promise<VehicleApiResponse> {
    try {
      const vehicle = await Vehicle.findByIdAndUpdate(
        id,
        { availableTime },
        { new: true, runValidators: true }
      );

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      return {
        success: true,
        message: 'Vehicle availability updated successfully',
        data: vehicle as any
      };
    } catch (error) {
      throw new Error(`Failed to update vehicle availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}