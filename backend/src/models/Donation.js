import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required'],
      index: true
    },
    donorName: {
      type: String,
      trim: true,
      default: ''
    },
    foodType: {
      type: String,
      required: [true, 'Food category is required'],
      enum: {
        values: [
          'Prepared Meals',
          'Bakery',
          'Fruits & Vegetables',
          'Packaged Food',
          'Dairy',
          'Other'
        ],
        message: '{VALUE} is not an accepted food category'
      }
    },
    dietaryType: {
      type: String,
      enum: {
        values: ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan', 'Other'],
        message: '{VALUE} is not an accepted dietary type'
      },
      default: 'Vegetarian'
    },
    foodName: {
      type: String,
      required: [true, 'Food title/name is required'],
      trim: true,
      minlength: [2, 'Food name must be at least 2 characters'],
      maxlength: [150, 'Food name cannot exceed 150 characters']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity amount is required'],
      min: [1, 'Quantity must be at least 1']
    },
    unit: {
      type: String,
      required: [true, 'Quantity unit is required'],
      enum: {
        values: ['meals', 'lbs', 'kg', 'boxes', 'trays'],
        message: '{VALUE} is not a valid unit'
      }
    },
    pickupLocation: {
      type: String,
      required: [true, 'Pickup location is required'],
      trim: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: undefined
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined
      }
    },
    availableUntil: {
      type: Date,
      required: [true, 'Expiration deadline is required'],
      index: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    contactInfo: {
      type: String,
      required: [true, 'On-site contact info is required'],
      trim: true
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: [
          'POSTED',
          'MATCHED',
          'DRIVER_ASSIGNED',
          'PICKED_UP',
          'DELIVERED',
          'CANCELLED'
        ],
        message: '{VALUE} is not a valid donation status'
      },
      default: 'POSTED',
      index: true
    },
    matchedWith: {
      type: String,
      trim: true,
      default: null
    },
    matchedShelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    driverAssigned: {
      type: String,
      trim: true,
      default: null
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

// Compound indexes for fast query filtering and matching
donationSchema.index({ status: 1, availableUntil: 1 });
donationSchema.index({ donorId: 1, createdAt: -1 });
donationSchema.index({ location: '2dsphere' });

export const Donation = mongoose.model('Donation', donationSchema);
