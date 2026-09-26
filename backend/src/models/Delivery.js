import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema(
  {
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: [true, 'Donation ID is required'],
      index: true
    },
    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    driverName: {
      type: String,
      trim: true,
      default: 'Unassigned'
    },
    pickup: {
      type: String,
      required: [true, 'Pickup origin is required'],
      trim: true
    },
    pickupAddress: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true
    },
    pickupCoordinates: {
      type: [Number], // [longitude, latitude]
      default: undefined
    },
    destination: {
      type: String,
      required: [true, 'Destination shelter is required'],
      trim: true
    },
    destinationAddress: {
      type: String,
      required: [true, 'Destination address is required'],
      trim: true
    },
    destinationCoordinates: {
      type: [Number], // [longitude, latitude]
      default: undefined
    },
    food: {
      type: String,
      required: [true, 'Food summary is required'],
      trim: true
    },
    quantity: {
      type: String,
      required: [true, 'Quantity summary is required'],
      trim: true
    },
    deadline: {
      type: String,
      required: [true, 'Deadline is required'],
      trim: true
    },
    date: {
      type: String,
      required: [true, 'Date is required']
    },
    distanceKm: {
      type: Number,
      default: 0,
      min: 0
    },
    donorContact: {
      type: String,
      trim: true,
      default: ''
    },
    recipientContact: {
      type: String,
      trim: true,
      default: ''
    },
    instructions: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: [
          'MATCHED',
          'DRIVER_ASSIGNED',
          'PICKED_UP',
          'DELIVERED',
          'CANCELLED'
        ],
        message: '{VALUE} is not a valid delivery status'
      },
      default: 'DRIVER_ASSIGNED',
      index: true
    },
    assignedAt: {
      type: Date,
      default: null
    },
    pickedUpAt: {
      type: Date,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Delivery status transition matrix
const ALLOWED_DELIVERY_TRANSITIONS = {
  MATCHED: ['DRIVER_ASSIGNED', 'CANCELLED'],
  DRIVER_ASSIGNED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [], // Terminal state
  CANCELLED: []  // Terminal state
};

deliverySchema.statics.canTransition = function (currentStatus, targetStatus) {
  const allowed = ALLOWED_DELIVERY_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(targetStatus));
};

deliverySchema.index({ driverId: 1, status: 1 });
deliverySchema.index({ createdAt: -1 });

export const Delivery = mongoose.model('Delivery', deliverySchema);
