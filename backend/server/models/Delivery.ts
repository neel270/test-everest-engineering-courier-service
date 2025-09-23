import mongoose, { Document, Schema } from 'mongoose';

export interface IDelivery extends Document {
  packages: mongoose.Types.ObjectId[]; // References to Package documents
  vehicles: mongoose.Types.ObjectId[]; // References to Vehicle documents
  baseDeliveryCost: number;
  results: Array<{
    id: string;
    discount: number;
    totalCost: number;
    originalCost: number;
    estimatedDeliveryTime: number;
  }>;
  optimizationSteps: Array<{
    step: number;
    description: string;
    packagesRemaining: number;
    vehiclesAvailable: number;
    currentTime: number;
    vehicleAssignments: Array<{
      vehicleId: number;
      packages: Array<{
        id: string;
        weight: number;
        distance: number;
        offerCode?: string;
      }>;
      totalWeight: number;
      maxDistance: number;
      deliveryTime: number;
      returnTime: number;
      availableAfter: number;
    }>;
    unassignedPackages: Array<{
      id: string;
      weight: number;
      distance: number;
      offerCode?: string;
    }>;
  }>;
  totalCost: number;
  totalDiscount: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySchema: Schema = new Schema({
  packages: [{ type: Schema.Types.ObjectId, ref: 'Package', required: true }],
  vehicles: [{ type: Schema.Types.ObjectId, ref: 'Vehicle', required: true }],
  baseDeliveryCost: {
    type: Number,
    required: true,
    min: 0
  },
  results: [{
    id: { type: String, required: true },
    discount: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    originalCost: { type: Number, required: true },
    estimatedDeliveryTime: { type: Number, required: true }
  }],
  optimizationSteps: [{
    step: { type: Number, required: true },
    description: { type: String, required: true },
    packagesRemaining: { type: Number, required: true },
    vehiclesAvailable: { type: Number, required: true },
    currentTime: { type: Number, required: true },
    vehicleAssignments: [{
      vehicleId: { type: Number, required: true },
      packages: [{
        id: { type: String, required: true },
        weight: { type: Number, required: true },
        distance: { type: Number, required: true },
        offerCode: { type: String, required: false }
      }],
      totalWeight: { type: Number, required: true },
      maxDistance: { type: Number, required: true },
      deliveryTime: { type: Number, required: true },
      returnTime: { type: Number, required: true },
      availableAfter: { type: Number, required: true }
    }],
    unassignedPackages: [{
      id: { type: String, required: true },
      weight: { type: Number, required: true },
      distance: { type: Number, required: true },
      offerCode: { type: String, required: false }
    }],
    assignedPackages: [{
      id: { type: String, required: true },
      weight: { type: Number, required: true },
      distance: { type: Number, required: true },
      offerCode: { type: String, required: false }
    }],
  }],
  totalCost: {
    type: Number,
    required: true
  },
  totalDiscount: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IDelivery>('Delivery', DeliverySchema);