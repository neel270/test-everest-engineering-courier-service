import { BaseRepository } from './BaseRepository';
import VehicleModel from '../models/Vehicle';

export class VehicleRepository extends BaseRepository<any> {
  constructor() {
    super(VehicleModel);
  }

  async findByIds(ids: number[]): Promise<any[]> {
    return await this.model.find({ id: { $in: ids } });
  }

  async upsertVehicle(vehicleData: any): Promise<any> {
    return await this.upsert(
      { id: vehicleData.id },
      {
        id: vehicleData.id,
        name: vehicleData.name,
        maxSpeed: vehicleData.maxSpeed,
        maxCarriableWeight: vehicleData.maxCarriableWeight,
        availableTime: vehicleData.availableTime ?? 0,
      }
    );
  }

  async upsertMultipleVehicles(vehicles: any[]): Promise<any[]> {
    return await Promise.all(
      vehicles.map(vehicle => this.upsertVehicle(vehicle))
    );
  }

  async findAvailableVehicles(currentTime: number = 0): Promise<any[]> {
    return await this.find({
      availableTime: { $lte: currentTime }
    });
  }

  async findByCapacityRange(minCapacity: number, maxCapacity: number): Promise<any[]> {
    return await this.find({
      maxCarriableWeight: { $gte: minCapacity, $lte: maxCapacity }
    });
  }

  async findBySpeedRange(minSpeed: number, maxSpeed: number): Promise<any[]> {
    return await this.find({
      maxSpeed: { $gte: minSpeed, $lte: maxSpeed }
    });
  }

  async updateAvailability(vehicleId: number, availableTime: number): Promise<any | null> {
    return await this.update(
      { id: vehicleId },
      { availableTime }
    );
  }

  async getVehicleStatistics(): Promise<any> {
    const totalVehicles = await this.count();
    const capacityStats = await this.aggregate([
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: '$maxCarriableWeight' },
          averageCapacity: { $avg: '$maxCarriableWeight' },
          minCapacity: { $min: '$maxCarriableWeight' },
          maxCapacity: { $max: '$maxCarriableWeight' }
        }
      }
    ]);

    const speedStats = await this.aggregate([
      {
        $group: {
          _id: null,
          totalSpeed: { $sum: '$maxSpeed' },
          averageSpeed: { $avg: '$maxSpeed' },
          minSpeed: { $min: '$maxSpeed' },
          maxSpeed: { $max: '$maxSpeed' }
        }
      }
    ]);

    return {
      totalVehicles,
      capacityStats: capacityStats[0] || {},
      speedStats: speedStats[0] || {}
    };
  }

  async getVehiclesByAvailability(currentTime: number = 0): Promise<any> {
    const available = await this.find({
      availableTime: { $lte: currentTime }
    });

    const busy = await this.find({
      availableTime: { $gt: currentTime }
    });

    return {
      available: available.length,
      busy: busy.length,
      total: available.length + busy.length
    };
  }
}