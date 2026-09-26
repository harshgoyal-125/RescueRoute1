import { FoodRequest } from '../models/FoodRequest.js';
import { suggestionsForRequest } from '../services/requestSuggestions.js';

/**
 * Public endpoint to submit a food request (no authentication required).
 * POST /api/requests
 */
export async function createPublicRequest(req, res, next) {
  try {
    const {
      recipientName,
      organizationName,
      contactPhone,
      contactEmail,
      deliveryAddress,
      foodCategory,
      quantityNeeded,
      unit,
      urgency,
      dietaryRestrictions,
      notes,
      latitude,
      longitude,
      coordinates
    } = req.body;

    if (!recipientName || !contactPhone || !contactEmail || !deliveryAddress || !quantityNeeded) {
      return res.status(400).json({
        success: false,
        message: 'Recipient name, phone, email, address, and quantity needed are required.'
      });
    }

    // Determine GeoJSON coordinates
    let coords = null;
    if (Array.isArray(coordinates) && coordinates.length === 2) {
      coords = [Number(coordinates[0]), Number(coordinates[1])];
    } else if (latitude !== undefined && longitude !== undefined) {
      coords = [Number(longitude), Number(latitude)];
    }

    if (coords && (!coords.every(Number.isFinite) || Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates.' });
    }
    const newRequest = new FoodRequest({
      recipientName: recipientName.trim(),
      organizationName: organizationName ? organizationName.trim() : '',
      contactPhone: contactPhone.trim(),
      contactEmail: contactEmail.toLowerCase().trim(),
      deliveryAddress: deliveryAddress.trim(),
      ...(coords ? { location: { type: 'Point', coordinates: coords } } : {}),
      foodCategory: foodCategory || 'Any / All',
      quantityNeeded: Number(quantityNeeded),
      unit: unit || 'meals',
      urgency: urgency ? urgency.toUpperCase() : 'MEDIUM',
      dietaryRestrictions: dietaryRestrictions ? dietaryRestrictions.trim() : 'None',
      notes: notes ? notes.trim() : '',
      status: 'PENDING'
    });

    await newRequest.save();

    res.status(201).json({
      success: true,
      message: 'Food request submitted successfully.',
      data: newRequest
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all food requests with optional status and urgency filters.
 * GET /api/requests
 * Access: ADMIN
 */
export async function getAllRequests(req, res, next) {
  try {
    const { status, urgency } = req.query;
    const filter = {};

    if (status) {
      filter.status = status.toUpperCase();
    }
    if (urgency) {
      filter.urgency = urgency.toUpperCase();
    }

    const requests = await FoodRequest.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update status of a food request (e.g. APPROVED, FULFILLED, CANCELLED).
 * PATCH /api/requests/:id/status
 * Access: ADMIN
 */
export async function updateRequestStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['PENDING', 'APPROVED', 'FULFILLED', 'CANCELLED'];
    if (!status || !allowed.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(', ')}`
      });
    }

    const updated = await FoodRequest.findByIdAndUpdate(
      id,
      { status: status.toUpperCase() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Food request not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: `Request status updated to ${status.toUpperCase()}.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

/** Public lookup reveals only the request's actual workflow status, never contact or address. */
export async function trackPublicRequest(req, res, next) {
  try {
    const id = String(req.body?.trackingId || '').trim();
    const phone = String(req.body?.contactPhone || '').replace(/\D/g, '');
    if (!/^[0-9a-f]{24}$/i.test(id) || phone.length < 7 || phone.length > 15) {
      return res.status(400).json({ success: false, message: 'Enter a valid tracking ID and phone number.' });
    }

    const record = await FoodRequest.findById(id).select('contactPhone status').lean();
    const savedPhone = String(record?.contactPhone || '').replace(/\D/g, '');
    const samePhone = savedPhone === phone || (phone.length === savedPhone.length + 1 && phone.startsWith('1') && phone.slice(1) === savedPhone) || (savedPhone.length === phone.length + 1 && savedPhone.startsWith('1') && savedPhone.slice(1) === phone);
    // Never say which factor failed; keep the output free of requester details.
    if (!record || !samePhone) {
      return res.status(404).json({ success: false, message: 'Request not found for that ID and phone number.' });
    }

    return res.status(200).json({ success: true, data: { status: record.status } });
  } catch (error) {
    next(error);
  }
}

/** Admin-only read of current nearby, compatible donated food. Suggestions are not allocations. */
export async function getRequestSuggestions(req, res, next) {
  try {
    const foodRequest = await FoodRequest.findById(req.params.id).lean();
    if (!foodRequest) return res.status(404).json({ success: false, message: 'Food request not found.' });
    const suggestions = await suggestionsForRequest(foodRequest);
    return res.status(200).json({
      success: true,
      data: { suggestions, reserved: false, note: 'Suggestions only. No donation or delivery is assigned.' }
    });
  } catch (error) {
    next(error);
  }
}
