import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
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
      required: [true, 'Shelter ID is required'],
      index: true
    },
    donorName: {
      type: String,
      trim: true
    },
    shelterName: {
      type: String,
      trim: true
    },
    foodType: {
      type: String,
      required: true
    },
    foodName: {
      type: String,
      required: true
    },
    quantity: {
      type: String,
      required: true
    },
    distance: {
      type: String,
      required: true
    },
    distanceMiles: {
      type: Number,
      required: true,
      min: 0
    },
    distanceKm: {
      type: Number,
      default: 0,
      min: 0
    },
    expiry: {
      type: String,
      required: true
    },
    matchScore: {
      type: Number,
      required: [true, 'Match score is required'],
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100']
    },
    scoreBreakdown: {
      distanceScore: { type: Number, default: 0 },
      capacityScore: { type: Number, default: 0 },
      foodScore: { type: Number, default: 0 },
      urgencyScore: { type: Number, default: 0 },
      needScore: { type: Number, default: 0 }
    },
    capacityCompatibility: {
      type: String,
      default: 'Compatible'
    },
    foodCompatibility: {
      type: String,
      default: 'Direct Match'
    },
    urgency: {
      type: String,
      default: 'Standard'
    },
    reasons: {
      type: [String],
      required: [true, 'At least one match reason is required'],
      validate: [v => Array.isArray(v) && v.length > 0, 'Reasons cannot be empty']
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'COMPLETED'],
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

matchSchema.index({ shelterId: 1, status: 1 });
matchSchema.index({ donationId: 1, shelterId: 1 }, { unique: true });

export const Match = mongoose.model('Match', matchSchema);
