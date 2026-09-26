import mongoose from 'mongoose';

const foodRequestSchema = new mongoose.Schema(
  {
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [120, 'Name cannot exceed 120 characters']
    },
    organizationName: {
      type: String,
      trim: true,
      default: ''
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email address is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined
      }
    },
    foodCategory: {
      type: String,
      enum: {
        values: [
          'Prepared Meals',
          'Bakery',
          'Fruits & Vegetables',
          'Packaged Food',
          'Dairy',
          'Any / All'
        ],
        message: '{VALUE} is not a valid food category'
      },
      default: 'Any / All'
    },
    quantityNeeded: {
      type: Number,
      required: [true, 'Quantity needed is required'],
      min: [1, 'Quantity must be at least 1']
    },
    unit: {
      type: String,
      enum: {
        values: ['meals', 'lbs', 'kg', 'boxes', 'trays'],
        message: '{VALUE} is not a valid unit'
      },
      default: 'meals'
    },
    urgency: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        message: '{VALUE} is not a valid urgency level'
      },
      default: 'MEDIUM'
    },
    dietaryRestrictions: {
      type: String,
      trim: true,
      default: 'None'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: ''
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'APPROVED', 'FULFILLED', 'CANCELLED'],
        message: '{VALUE} is not a valid request status'
      },
      default: 'PENDING',
      index: true
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

// Indexes
foodRequestSchema.index({ status: 1, urgency: 1, createdAt: -1 });
foodRequestSchema.index({ location: '2dsphere' });

export const FoodRequest = mongoose.model('FoodRequest', foodRequestSchema);
