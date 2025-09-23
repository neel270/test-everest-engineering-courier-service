import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicle extends Document {
  id: number;
  name: string;
  maxSpeed: number;
  maxCarriableWeight: number;
  availableTime: number;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema: Schema = new Schema({
  id: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  maxSpeed: {
    type: Number,
    required: true,
    min: 0
  },
  maxCarriableWeight: {
    type: Number,
    required: true,
    min: 0
  },
  availableTime: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Auto-generate ID before saving
VehicleSchema.pre('save', async function(next) {
  if (this.isNew && this.id == null) {
    try {
      // Find the highest existing ID with proper typing
      const VehicleModel = this.constructor as any;
      const lastVehicle = await VehicleModel.findOne({}, {}, { sort: { 'id': -1 } });
      this.id = lastVehicle && lastVehicle.id ? lastVehicle.id + 1 : 1;
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error) {
        return next(error);
      }
      return next(new Error('Unknown error occurred during ID generation'));
    }
  }
  next();
});

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema);