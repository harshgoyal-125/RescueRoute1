import mongoose from 'mongoose';
import { Match } from '../models/Match.js';
import { Donation } from '../models/Donation.js';
import { Delivery } from '../models/Delivery.js';
import { User } from '../models/User.js';
import { findCandidatesForDonation, ExpiredDonationError } from '../services/matchingService.js';
import { findBestAvailableDriver } from '../services/dispatchService.js';

/**
 * Deterministically finds matching shelters for a donation.
 * POST /api/matches/find
 */
export async function findMatches(req, res, next) {
  try {
    const { donationId } = req.body;

    if (!donationId || !mongoose.isValidObjectId(donationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing donation ID format. Must be a 24-character hexadecimal ObjectId.'
      });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found.'
      });
    }

    // IDOR protection: A donor can only query matching for their own donation
    if (req.user.role === 'DONOR' && !donation.donorId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot request matches for another donor\'s listing.'
      });
    }

    // Food safety rule: Reject expired donations
    if (new Date(donation.availableUntil).getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Donation has expired and cannot be matched for food safety reasons.'
      });
    }

    if (donation.status === 'CANCELLED' || donation.status === 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: `Cannot run matching for donation with status '${donation.status}'.`
      });
    }

    const matches = await findCandidatesForDonation(donation);

    res.status(200).json({
      success: true,
      data: {
        donationId: donation._id,
        count: matches.length,
        matches
      }
    });
  } catch (error) {
    if (error.name === 'ExpiredDonationError' || error instanceof ExpiredDonationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

/**
 * Retrieves pending matches for shelter organizations or admins.
 * GET /api/matches
 */
export async function getMatches(req, res, next) {
  try {
    const query = { status: 'PENDING' };

    // Scoping: Shelters only see matches designated for their organization
    if (req.user.role === 'SHELTER') {
      query.shelterId = req.user._id;
    }

    const matches = await Match.find(query)
      .sort({ matchScore: -1, createdAt: -1 })
      .populate('donationId', 'status foodName foodType quantity unit pickupLocation availableUntil contactInfo location')
      .populate('shelterId', 'name organizationName address location')
      .lean();

    const now = Date.now();
    // Filter out matches whose donations are no longer available or have expired
    const validMatches = matches.filter(m => {
      if (!m.donationId) return false;
      const isStatusValid = m.donationId.status === 'POSTED' || m.donationId.status === 'MATCHED';
      const isNotExpired = new Date(m.donationId.availableUntil).getTime() > now;
      return isStatusValid && isNotExpired;
    });

    res.status(200).json({
      success: true,
      data: {
        matches: validMatches,
        count: validMatches.length
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves a single match recommendation by ID.
 * GET /api/matches/:id
 */
export async function getMatchById(req, res, next) {
  try {
    const match = await Match.findById(req.params.id)
      .populate('donationId')
      .lean();

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match recommendation not found.'
      });
    }

    if (req.user.role === 'SHELTER' && !match.shelterId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot access match records for another shelter.'
      });
    }

    res.status(200).json({
      success: true,
      data: { match }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Accepts a match recommendation and dispatches delivery routing.
 * Uses atomic updates to prevent race conditions when multiple shelters claim simultaneously.
 * POST /api/matches/:id/accept or PATCH /api/matches/:id/accept
 */
export async function acceptMatch(req, res, next) {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match recommendation not found.'
      });
    }

    // Role check: Only the matched recipient shelter or an ADMIN can claim
    if (req.user.role !== 'ADMIN' && !match.shelterId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the matched recipient shelter can claim this surplus batch.'
      });
    }

    if (match.status === 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: 'This match has already been accepted.'
      });
    }

    if (match.status === 'DECLINED' || match.status === 'EXPIRED') {
      return res.status(400).json({
        success: false,
        message: `This match recommendation is no longer valid (status: ${match.status}).`
      });
    }

    // Verify donation exists and is not expired
    const donation = await Donation.findById(match.donationId);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Linked donation no longer exists.'
      });
    }

    if (new Date(donation.availableUntil).getTime() <= Date.now()) {
      match.status = 'EXPIRED';
      await match.save();
      return res.status(400).json({
        success: false,
        message: 'Cannot accept match: donation has expired and cannot be accepted for food safety reasons.'
      });
    }

    // Determine available volunteer driver
    const assignedDriver = await findBestAvailableDriver(donation.location?.coordinates);
    const targetStatus = assignedDriver ? 'DRIVER_ASSIGNED' : 'MATCHED';

    // Atomic race-condition prevention:
    // Only claim if donation status is still 'POSTED' or 'MATCHED'
    const claimedDonation = await Donation.findOneAndUpdate(
      {
        _id: match.donationId,
        status: 'POSTED'
      },
      {
        $set: {
          status: targetStatus,
          matchedWith: req.user.organizationName || req.user.name,
          matchedShelterId: req.user._id,
          driverId: assignedDriver ? assignedDriver._id : null,
          driverAssigned: assignedDriver ? assignedDriver.name : null
        }
      },
      { new: true }
    );

    if (!claimedDonation) {
      match.status = 'DECLINED';
      await match.save();
      return res.status(409).json({
        success: false,
        message: 'Conflict: This donation has already been claimed by another shelter or is no longer available.'
      });
    }

    // Transition this match to ACCEPTED
    match.status = 'ACCEPTED';
    await match.save();

    // Expire any other pending matches for this donation
    await Match.updateMany(
      {
        donationId: match.donationId,
        _id: { $ne: match._id },
        status: 'PENDING'
      },
      {
        $set: { status: 'EXPIRED' }
      }
    );

    // Create delivery order for volunteer drivers
    const delivery = new Delivery({
      donationId: claimedDonation._id,
      shelterId: req.user._id,
      driverId: assignedDriver ? assignedDriver._id : null,
      driverName: assignedDriver ? assignedDriver.name : 'Unassigned',
      pickup: claimedDonation.donorName || 'Food Donor',
      pickupAddress: claimedDonation.pickupLocation,
      destination: req.user.organizationName || req.user.name,
      destinationAddress: req.user.address || 'Address not provided',
      pickupCoordinates: claimedDonation.location?.coordinates,
      destinationCoordinates: req.user.location?.coordinates,
      food: claimedDonation.foodName,
      quantity: `${claimedDonation.quantity} ${claimedDonation.unit}`,
      deadline: new Date(claimedDonation.availableUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      status: targetStatus,
      assignedAt: assignedDriver ? new Date() : null,
      distanceKm: match.distanceKm ?? 0,
      donorContact: claimedDonation.contactInfo,
      recipientContact: `${req.user.name} ${req.user.phone || ''}`.trim(),
      instructions: claimedDonation.description
    });

    await delivery.save();

    if (assignedDriver) {
      await User.findByIdAndUpdate(assignedDriver._id, {
        $inc: { 'driverDetails.activePickups': 1 }
      });
    }

    const message = assignedDriver
      ? 'Donation match accepted. Volunteer driver assigned and dispatch route created.'
      : 'Donation match accepted. Delivery created and queued for driver dispatch.';

    res.status(200).json({
      success: true,
      message,
      data: {
        match,
        delivery
      }
    });
  } catch (error) {
    next(error);
  }
}
