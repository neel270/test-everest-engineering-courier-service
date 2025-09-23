import mongoose, { Document, Schema } from 'mongoose';

export interface IPackage extends Document {
  id: string;
  weight: number;
  distance: number;
  offerCode?: string;
  estimatedDeliveryTime?: number; // in hours
  deliveryTimeWindow?: {
    start: Date;
    end: Date;
  };
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  distance: {
    type: Number,
    required: true,
    min: 0
  },
  offerCode: {
    type: String,
    required: false,
    trim: true
  },
  estimatedDeliveryTime: {
    type: Number,
    required: false,
    min: 0
  },
  deliveryTimeWindow: {
    start: {
      type: Date,
      required: false
    },
    end: {
      type: Date,
      required: false
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    required: false
  }
}, {
  timestamps: true
});

export default mongoose.model<IPackage>('Package', PackageSchema);