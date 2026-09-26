import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      ]
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // Excluded by default in queries for security
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['DONOR', 'SHELTER', 'DRIVER', 'ADMIN'],
        message: '{VALUE} is not a supported role'
      },
      uppercase: true
    },
    organizationName: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    avatar: {
      type: String,
      default: '👤'
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
    isAvailable: {
      type: Boolean,
      default: true,
      index: true
    },
    // Applicable for SHELTER
    capacity: {
      current: {
        type: Number,
        default: 0,
        min: [0, 'Current capacity cannot be negative']
      },
      max: {
        type: Number,
        default: 100,
        min: [1, 'Max capacity must be at least 1']
      }
    },
    foodPreferences: {
      type: [String],
      default: ['Prepared Meals', 'Bakery', 'Fruits & Vegetables', 'Dairy']
    },
    preferredRadiusMiles: {
      type: Number,
      default: 8,
      min: [1, 'Preferred radius must be at least 1 mile'],
      max: [100, 'Preferred radius cannot exceed 100 miles']
    },
    // Applicable for DRIVER
    driverDetails: {
      vehicle: { type: String, default: 'Standard Vehicle' },
      activePickups: { type: Number, default: 0 },
      completedDeliveries: { type: Number, default: 0 },
      totalDistanceKm: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ location: '2dsphere' });

// Password hashing helper method
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Password comparison instance method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
