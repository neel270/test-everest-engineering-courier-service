import Package, { IPackage } from '../models/Package';

export class PackageService {
  /**
   * Get all packages with optional pagination
   */
  static async getAllPackages(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      const packages = await Package.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Package.countDocuments();

      return {
        success: true,
        data: {
          packages,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPackages: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch packages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get package by ID
   */
  static async getPackageById(id: string) {
    try {
      const packageData = await Package.findById(id);
      if (!packageData) {
        throw new Error('Package not found');
      }
      return {
        success: true,
        data: packageData
      };
    } catch (error) {
      throw new Error(`Failed to fetch package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create new package
   */
  static async createPackage(packageData: Partial<IPackage>) {
    try {
      // Validate required fields
      if (!packageData.id || !packageData.weight || !packageData.distance) {
        throw new Error('ID, weight, and distance are required');
      }

      // Check if package with same ID already exists
      const existingPackage = await Package.findOne({ id: packageData.id });
      if (existingPackage) {
        throw new Error('Package with this ID already exists');
      }

      const newPackage = new Package(packageData);
      await newPackage.save();

      return {
        success: true,
        message: 'Package created successfully',
        data: newPackage
      };
    } catch (error) {
      throw new Error(`Failed to create package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update package by ID
   */
  static async updatePackage(id: string, updateData: Partial<IPackage>) {
    try {
      const packageData = await Package.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!packageData) {
        throw new Error('Package not found');
      }

      return {
        success: true,
        message: 'Package updated successfully',
        data: packageData
      };
    } catch (error) {
      throw new Error(`Failed to update package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete package by ID
   */
  static async deletePackage(id: string) {
    try {
      const packageData = await Package.findByIdAndDelete(id);
      if (!packageData) {
        throw new Error('Package not found');
      }

      return {
        success: true,
        message: 'Package deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get packages by offer code
   */
  static async getPackagesByOfferCode(offerCode: string) {
    try {
      const packages = await Package.find({ offerCode }).sort({ createdAt: -1 });
      return {
        success: true,
        data: packages
      };
    } catch (error) {
      throw new Error(`Failed to fetch packages by offer code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get packages by weight range
   */
  static async getPackagesByWeightRange(minWeight: number, maxWeight: number) {
    try {
      const packages = await Package.find({
        weight: { $gte: minWeight, $lte: maxWeight }
      }).sort({ createdAt: -1 });

      return {
        success: true,
        data: packages
      };
    } catch (error) {
      throw new Error(`Failed to fetch packages by weight range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}