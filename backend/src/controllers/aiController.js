import mongoose from 'mongoose';
import * as geminiService from '../services/geminiService.js';
import { Match } from '../models/Match.js';
import { User } from '../models/User.js';

const MAX_TEXT_LENGTH = 2000;


/**
 * Handles free-text donation parsing using Gemini AI.
 * POST /api/ai/parse-donation
 */
export async function parseDonation(req, res, next) {
  try {
    const { text } = req.body;

    // 1. Validate presence
    if (text === undefined || text === null) {
      return res.status(400).json({
        success: false,
        message: 'Text input is required for AI donation parsing.'
      });
    }

    // 2. Validate type
    if (typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Text input must be a string.'
      });
    }

    const trimmed = text.trim();

    // 3. Validate non-empty
    if (trimmed.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text input cannot be empty.'
      });
    }

    // 4. Validate maximum length (DoS prevention)
    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Text input exceeds maximum length of ${MAX_TEXT_LENGTH} characters.`
      });
    }

    // 5. Invoke Gemini parser service
    const parsedData = await geminiService.parseDonationText(trimmed);

    res.status(200).json({
      success: true,
      message: 'Donation details extracted successfully.',
      data: parsedData
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'AI parsing unavailable. You can enter the donation details manually.'
    });
  }
}

/**
 * Explains a deterministic shelter match recommendation using Gemini AI.
 * The underlying score and decision remain 100% deterministic and server-side.
 * POST /api/ai/explain-match
 */
export async function explainMatch(req, res, next) {
  try {
    const { matchId } = req.body;

    // 1. Validate presence of matchId
    if (!matchId) {
      return res.status(400).json({
        success: false,
        message: 'matchId is required in request body.'
      });
    }

    // 2. Validate ObjectID format
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid matchId format.'
      });
    }

    // 3. Retrieve authoritative match record from database
    const match = await Match.findById(matchId).populate('donationId');
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match recommendation not found.'
      });
    }

    // 4. Role-based authorization & IDOR prevention
    if (req.user.role === 'SHELTER') {
      if (!match.shelterId.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot access match records for another shelter.'
        });
      }
    } else if (req.user.role === 'DONOR') {
      const donation = match.donationId;
      if (!donation || !donation.donorId || !donation.donorId.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot access match records for another donor.'
        });
      }
    } else if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access restricted to matched donors, shelters, or administrators.'
      });
    }

    // 5. Retrieve shelter profile for accurate capacity/context
    const shelter = await User.findById(match.shelterId).lean();

    // 6. Build authoritative deterministic payload (client cannot forge score/reasons)
    const authoritativePayload = {
      donation: {
        foodType: match.foodType || match.donationId?.foodType,
        foodName: match.foodName || match.donationId?.foodName,
        quantity: match.donationId?.quantity || match.quantity,
        quantityUnit: match.donationId?.unit || 'meals',
        availableUntil: match.donationId?.availableUntil
          ? new Date(match.donationId.availableUntil).toISOString()
          : match.expiry
      },
      shelter: {
        name: shelter?.organizationName || match.shelterName || 'Recipient Shelter',
        capacity: shelter?.capacity?.max ?? null,
        currentNeed: match.urgency || 'Standard'
      },
      match: {
        distanceKm: match.distanceKm ?? null,
        matchScore: match.matchScore,
        scoreBreakdown: {
          distance: match.scoreBreakdown?.distanceScore || 0,
          capacity: match.scoreBreakdown?.capacityScore || 0,
          foodCompatibility: match.scoreBreakdown?.foodScore || 0,
          urgency: match.scoreBreakdown?.urgencyScore || 0,
          need: match.scoreBreakdown?.needScore || 0
        },
        reasons: match.reasons || []
      }
    };

    // 7. Generate explanation using Gemini (with automatic deterministic fallback)
    const explanation = await geminiService.generateMatchExplanation(authoritativePayload);

    // 8. Return explanation without modifying the match in DB
    res.status(200).json({
      success: true,
      message: 'Match explanation generated successfully.',
      data: explanation
    });
  } catch (error) {
    next(error);
  }
}

