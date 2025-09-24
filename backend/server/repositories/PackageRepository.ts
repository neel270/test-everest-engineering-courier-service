import { BaseRepository } from './BaseRepository';
import PackageModel from '../models/Package';

export class PackageRepository extends BaseRepository<any> {
  constructor() {
    super(PackageModel);
  }

  async findByIds(ids: string[]): Promise<any[]> {
    return await this.model.find({ id: { $in: ids } });
  }

  async upsertPackage(packageData: any): Promise<any> {
    return await this.upsert(
      { id: packageData.id },
      {
        id: packageData.id,
        weight: packageData.weight,
        distance: packageData.distance,
        offerCode: packageData.offerCode || '',
      }
    );
  }

  async upsertMultiplePackages(packages: any[]): Promise<any[]> {
    return await Promise.all(
      packages.map(pkg => this.upsertPackage(pkg))
    );
  }

  async findByOfferCode(offerCode: string): Promise<any[]> {
    return await this.find({ offerCode });
  }

  async findByWeightRange(minWeight: number, maxWeight: number): Promise<any[]> {
    return await this.find({
      weight: { $gte: minWeight, $lte: maxWeight }
    });
  }

  async findByDistanceRange(minDistance: number, maxDistance: number): Promise<any[]> {
    return await this.find({
      distance: { $gte: minDistance, $lte: maxDistance }
    });
  }

  async getPackageStatistics(): Promise<any> {
    const totalPackages = await this.count();
    const weightStats = await this.aggregate([
      {
        $group: {
          _id: null,
          totalWeight: { $sum: '$weight' },
          averageWeight: { $avg: '$weight' },
          minWeight: { $min: '$weight' },
          maxWeight: { $max: '$weight' }
        }
      }
    ]);

    const distanceStats = await this.aggregate([
      {
        $group: {
          _id: null,
          totalDistance: { $sum: '$distance' },
          averageDistance: { $avg: '$distance' },
          minDistance: { $min: '$distance' },
          maxDistance: { $max: '$distance' }
        }
      }
    ]);

    return {
      totalPackages,
      weightStats: weightStats[0] || {},
      distanceStats: distanceStats[0] || {}
    };
  }
}