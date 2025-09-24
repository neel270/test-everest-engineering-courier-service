import { BaseRepository } from './BaseRepository';
import Delivery from '../models/Delivery';

export class DeliveryRepository extends BaseRepository<any> {
  constructor() {
    super(Delivery);
  }

  async findWithPackagesAndVehicles(): Promise<any[]> {
    return await this.model
      .find()
      .populate({ path: 'packages', select: 'id weight distance offerCode' })
      .populate({
        path: 'vehicles',
        select: 'id name maxSpeed maxCarriableWeight availableTime',
      });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    return await this.model.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).sort({ createdAt: -1 });
  }

  async findByCostRange(minCost: number, maxCost: number): Promise<any[]> {
    return await this.model.find({
      totalCost: { $gte: minCost, $lte: maxCost },
    }).sort({ createdAt: -1 });
  }

  async findByVehicle(vehicleId: string): Promise<any[]> {
    return await this.model.find({
      vehicles: vehicleId,
    })
      .sort({ createdAt: -1 })
      .populate({ path: 'packages', select: 'id weight distance offerCode' })
      .populate({
        path: 'vehicles',
        select: 'id name maxSpeed maxCarriableWeight availableTime',
      });
  }

  async getStatistics(): Promise<any> {
    const totalDeliveries = await this.count();
    const totalCost = await this.aggregate([
      { $group: { _id: null, total: { $sum: '$totalCost' } } },
    ]);
    const totalDiscount = await this.aggregate([
      { $group: { _id: null, total: { $sum: '$totalDiscount' } } },
    ]);

    const averageCost =
      totalDeliveries > 0 ? (totalCost[0]?.total || 0) / totalDeliveries : 0;
    const averageDiscount =
      totalDeliveries > 0
        ? (totalDiscount[0]?.total || 0) / totalDeliveries
        : 0;

    return {
      totalDeliveries,
      totalCost: totalCost[0]?.total || 0,
      totalDiscount: totalDiscount[0]?.total || 0,
      averageCost,
      averageDiscount,
    };
  }

  async findWithFilters(filters: any): Promise<any[]> {
    const {
      startDate,
      endDate,
      minCost,
      maxCost,
      vehicleId,
      minTime,
      maxTime,
    } = filters;

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

    return await this.model
      .find(query)
      .sort({ createdAt: -1 })
      .populate({ path: 'packages' })
      .populate({ path: 'vehicles' });
  }
}