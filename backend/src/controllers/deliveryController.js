import mongoose from 'mongoose';
import { Delivery } from '../models/Delivery.js';
import { Donation } from '../models/Donation.js';
import { User } from '../models/User.js';
import { Match } from '../models/Match.js';

/**
 * Retrieves deliveries scoped by the caller's role and authorization.
 * GET /api/deliveries
 */
export async function getDeliveries(req, res, next) {
  try {
    const { status } = req.query;
    const query = {};

    // Role-based scoping
    if (req.user.role === 'DRIVER') {
      // Drivers see their own assigned deliveries or unassigned routes awaiting pickup
      query.$or = [
        { driverId: req.user._id },
        { driverId: null, status: { $in: ['MATCHED', 'DRIVER_ASSIGNED'] } }
      ];
    } else if (req.user.role === 'SHELTER') {
      // Shelters see incoming deliveries designated for their organization
      query.$or = [
        { shelterId: req.user._id },
        { destination: req.user.organizationName || req.user.name }
      ];
    } else if (req.user.role === 'DONOR') {
      // Donors see deliveries for their posted surplus batches
      const donorDonations = await Donation.find({ donorId: req.user._id }).select('_id').lean();
      const donationIds = donorDonations.map(d => d._id);
      query.donationId = { $in: donationIds };
    }
    // ADMIN can see all deliveries

    // Optional status filter
    if (status && status !== 'ALL') {
      const allowed = ['MATCHED', 'DRIVER_ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];
      if (allowed.includes(status)) {
        query.status = status;
      }
    }

    const deliveries = await Delivery.find(query)
      .sort({ createdAt: -1 })
      .populate('donationId', 'foodName foodType status availableUntil donorId pickupLocation location')
      .populate('shelterId', 'name organizationName address location')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        deliveries,
        count: deliveries.length
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves a single delivery by ID with strict authorization verification.
 * GET /api/deliveries/:id
 */
export async function getDeliveryById(req, res, next) {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('donationId')
      .lean();

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery record not found.'
      });
    }

    // Role-based authorization check
    if (req.user.role === 'DRIVER') {
      const isAssignedToCaller = delivery.driverId && delivery.driverId.toString() === req.user._id.toString();
      const isUnassigned = !delivery.driverId;
      if (!isAssignedToCaller && !isUnassigned) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot access delivery records assigned to another volunteer driver.'
        });
      }
    } else if (req.user.role === 'SHELTER') {
      const isShelterDest = delivery.shelterId && delivery.shelterId.toString() === req.user._id.toString();
      const isDestName = delivery.destination === (req.user.organizationName || req.user.name);
      if (!isShelterDest && !isDestName) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot access deliveries destined for another shelter.'
        });
      }
    } else if (req.user.role === 'DONOR') {
      const donation = delivery.donationId;
      const isOwner = donation && donation.donorId && donation.donorId.toString() === req.user._id.toString();
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot access delivery records for another donor.'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: { delivery }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Assigns an unassigned delivery to the requesting driver.
 * POST /api/deliveries/:id/assign
 */
export async function assignDelivery(req, res, next) {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery record not found.'
      });
    }

    // Terminal states cannot be assigned
    if (delivery.status !== 'MATCHED' && !(delivery.status === 'DRIVER_ASSIGNED' && !delivery.driverId)) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign a delivery with terminal status '${delivery.status}'.`
      });
    }

    // If already assigned to someone else
    if (delivery.driverId && !delivery.driverId.equals(req.user._id)) {
      return res.status(409).json({
        success: false,
        message: 'This delivery has already been assigned to another volunteer driver.'
      });
    }

    // Atomic assignment update
    const claimedDelivery = await Delivery.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { driverId: null },
          { driverId: req.user._id }
        ]
      },
      {
        $set: {
          driverId: req.user._id,
          driverName: req.user.name,
          status: 'DRIVER_ASSIGNED',
          assignedAt: new Date()
        }
      },
      { new: true }
    );

    if (!claimedDelivery) {
      return res.status(409).json({
        success: false,
        message: 'Conflict: This delivery has already been claimed by another driver.'
      });
    }

    // Synchronize donation status
    if (claimedDelivery.donationId) {
      await Donation.findByIdAndUpdate(claimedDelivery.donationId, {
        status: 'DRIVER_ASSIGNED',
        driverId: req.user._id,
        driverAssigned: req.user.name
      });
    }

    // Update driver workload counter
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'driverDetails.activePickups': 1 }
    });

    res.status(200).json({
      success: true,
      message: 'Delivery successfully assigned to driver.',
      data: { delivery: claimedDelivery }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates delivery status along strict state machine lifecycle.
 * PATCH /api/deliveries/:id/status
 */
export async function updateDeliveryStatus(req, res, next) {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Target status is required in request body.'
      });
    }

    const allowedStatuses = ['DRIVER_ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Allowed values: ${allowedStatuses.join(', ')}.`
      });
    }

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found.'
      });
    }

    // Role and ownership check:
    // Only assigned DRIVER or ADMIN may progress delivery status
    if (req.user.role === 'DRIVER') {
      if (!delivery.driverId || !delivery.driverId.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot update a delivery assigned to another volunteer driver.'
        });
      }
    } else if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only assigned drivers or administrators can update dispatch delivery status.'
      });
    }

    // Verify state machine lifecycle transition
    const canTransition = Delivery.canTransition(delivery.status, status);
    if (!canTransition) {
      return res.status(400).json({
        success: false,
        message: `Illegal status transition from '${delivery.status}' to '${status}'.`
      });
    }

    // Server-side timestamp assignment
    const updateSet = {
      status
    };

    if (status === 'PICKED_UP') {
      updateSet.pickedUpAt = new Date();
    } else if (status === 'DELIVERED') {
      updateSet.deliveredAt = new Date();
    } else if (status === 'DRIVER_ASSIGNED') {
      updateSet.assignedAt = new Date();
      if (!delivery.driverId && req.user.role === 'DRIVER') {
        updateSet.driverId = req.user._id;
        updateSet.driverName = req.user.name;
      }
    }

    // Atomic update enforcing current status state match
    const updatedDelivery = await Delivery.findOneAndUpdate(
      {
        _id: req.params.id,
        status: delivery.status
      },
      { $set: updateSet },
      { new: true }
    );

    if (!updatedDelivery) {
      return res.status(409).json({
        success: false,
        message: 'Conflict: Delivery status was concurrently modified by another process.'
      });
    }

    // Synchronize linked Donation status
    if (updatedDelivery.donationId) {
      await Donation.findByIdAndUpdate(updatedDelivery.donationId, {
        status,
        ...(status === 'DELIVERED' ? { matchedWith: updatedDelivery.destination } : {})
      });

      // Synchronize linked Match status when delivery is complete
      if (status === 'DELIVERED') {
        await Match.updateMany(
          { donationId: updatedDelivery.donationId, status: 'ACCEPTED' },
          { $set: { status: 'COMPLETED' } }
        );
      }
    }

    // Update driver workload and completion counters upon successful delivery
    if (status === 'DELIVERED' && updatedDelivery.driverId) {
      await User.findByIdAndUpdate(updatedDelivery.driverId, {
        $inc: {
          'driverDetails.activePickups': -1,
          'driverDetails.completedDeliveries': 1,
          'driverDetails.totalDistanceKm': updatedDelivery.distanceKm || 0
        }
      });
    }

    res.status(200).json({
      success: true,
      message: `Delivery status updated to '${status}'.`,
      data: { delivery: updatedDelivery }
    });
  } catch (error) {
    next(error);
  }
}
