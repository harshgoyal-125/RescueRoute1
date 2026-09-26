import mongoose from 'mongoose';
import { Donation } from '../models/Donation.js';
import { generateMatchesForDonation } from '../services/matchingService.js';

export async function createDonation(req, res, next) {
  try {
    const {
      foodType,
      foodName,
      quantity,
      unit,
      pickupLocation,
      availableUntil,
      description,
      contactInfo,
      location
    } = req.body;

    // Strict validation
    if (!foodType || !foodName || !quantity || !unit || !pickupLocation || !availableUntil || !description || !contactInfo) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: foodType, foodName, quantity, unit, pickupLocation, availableUntil, description, contactInfo.'
      });
    }

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number.'
      });
    }

    const expiryDate = new Date(availableUntil);
    if (isNaN(expiryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expiration date format.'
      });
    }

    if (expiryDate.getTime() <= Date.now()) {
      return res.status(400).json({ success: false, message: 'Expiration deadline must be in the future.' });
    }
    if (location?.coordinates && (!Array.isArray(location.coordinates) || location.coordinates.length !== 2 || !location.coordinates.every(Number.isFinite) || Math.abs(location.coordinates[0]) > 180 || Math.abs(location.coordinates[1]) > 90)) {
      return res.status(400).json({ success: false, message: 'Coordinates must be [longitude, latitude].' });
    }

    // Whitelist and construct donation
    const donation = new Donation({
      donorId: req.user._id,
      donorName: req.user.organizationName || req.user.name,
      foodType,
      dietaryType: req.body.dietaryType || 'Vegetarian',
      foodName: foodName.trim(),
      quantity: numQuantity,
      unit,
      pickupLocation: pickupLocation.trim(),
      availableUntil: expiryDate,
      description: description.trim(),
      contactInfo: contactInfo.trim(),
      status: 'POSTED',
      ...(location?.coordinates ? { location } : pickupLocation.trim() === req.user.address?.trim() && req.user.location?.coordinates?.length === 2 ? { location: req.user.location } : {})
    });

    await donation.save();

    // Trigger algorithmic matching for active shelters
    try {
      await generateMatchesForDonation(donation);
    } catch (matchErr) {
      console.warn('[Matching Service Warning]:', matchErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Donation posted successfully.',
      data: { donation }
    });
  } catch (error) {
    next(error);
  }
}

export async function getDonations(req, res, next) {
  try {
    const { status, foodType } = req.query;
    const { page, limit, skip } = req.pagination;

    const query = {};

    // Role-based visibility
    if (req.user.role === 'DONOR') {
      query.donorId = req.user._id;
    }

    // Filter by status if provided and valid
    if (status && status !== 'ALL') {
      const allowedStatuses = ['POSTED', 'MATCHED', 'DRIVER_ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];
      if (allowedStatuses.includes(status)) {
        query.status = status;
      }
    }

    if (foodType && foodType !== 'ALL') {
      query.foodType = foodType;
    }

    const [donations, total] = await Promise.all([
      Donation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Donation.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        donations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getDonationById(req, res, next) {
  try {
    const donation = await Donation.findById(req.params.id).lean();

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found.'
      });
    }

    // Ownership check: DONOR can only view their own donations
    if (req.user.role === 'DONOR' && !donation.donorId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this donation.'
      });
    }

    res.status(200).json({
      success: true,
      data: { donation }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDonation(req, res, next) {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found.'
      });
    }

    // Ownership check
    if (req.user.role !== 'ADMIN' && !donation.donorId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify another organization\'s donation.'
      });
    }

    const { status, description, pickupLocation, contactInfo } = req.body;

    // Handle status transitions
    if (status) {
      if (status === 'CANCELLED') {
        if (donation.status === 'DELIVERED') {
          return res.status(400).json({
            success: false,
            message: 'Cannot cancel a donation that has already been delivered.'
          });
        }
        donation.status = 'CANCELLED';
      } else if (req.user.role === 'ADMIN') {
        donation.status = status;
      }
    }

    if (description) donation.description = description.trim();
    if (pickupLocation) donation.pickupLocation = pickupLocation.trim();
    if (contactInfo) donation.contactInfo = contactInfo.trim();

    await donation.save();

    res.status(200).json({
      success: true,
      message: 'Donation updated successfully.',
      data: { donation }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDonation(req, res, next) {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found.'
      });
    }

    if (req.user.role !== 'ADMIN' && !donation.donorId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot delete another organization\'s donation.'
      });
    }

    if (donation.status === 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a delivered donation record.'
      });
    }

    await donation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Donation deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}
