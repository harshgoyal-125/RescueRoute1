import { User } from '../models/User.js';
import { Match } from '../models/Match.js';
import {
  MATCHING_WEIGHTS,
  MATCHING_CONSTRAINTS,
  NORMALIZED_FOOD_CATEGORIES
} from '../config/matchingConfig.js';

export class ExpiredDonationError extends Error {
  constructor(message = 'Donation has expired and cannot be matched for food safety reasons.') {
    super(message);
    this.name = 'ExpiredDonationError';
    this.statusCode = 400;
  }
}

/**
 * Calculates straight-line geographic distance using the Haversine formula.
 * Order of coordinates is GeoJSON standard: [longitude, latitude].
 * Returns straight-line distance in kilometers rounded to 1 decimal place, or null if coordinates are invalid.
 */
export function calculateStraightLineDistanceKm(coord1, coord2) {
  if (!coord1 || !coord2 || !Array.isArray(coord1) || !Array.isArray(coord2) || coord1.length < 2 || coord2.length < 2) {
    return null;
  }

  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  if (
    typeof lon1 !== 'number' || typeof lat1 !== 'number' ||
    typeof lon2 !== 'number' || typeof lat2 !== 'number' ||
    isNaN(lon1) || isNaN(lat1) || isNaN(lon2) || isNaN(lat2)
  ) {
    return null;
  }

  // Validate standard latitude and longitude boundaries
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 || lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
    return null;
  }

  const R_KM = MATCHING_CONSTRAINTS.EARTH_RADIUS_KM;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R_KM * c * 10) / 10;
}

/**
 * Helper to convert kilometers to miles.
 */
export function kmToMiles(km) {
  if (km === null || km === undefined || isNaN(km)) return 0;
  return Math.round(km * MATCHING_CONSTRAINTS.KM_TO_MILES_FACTOR * 10) / 10;
}

/**
 * Deterministically normalizes food categories from user/donor inputs.
 */
export function normalizeFoodCategory(category) {
  if (!category || typeof category !== 'string') return NORMALIZED_FOOD_CATEGORIES.OTHER;
  const clean = category.trim().toUpperCase().replace(/[\s\-_&]+/g, '_');

  if (clean.includes('PREPARED') || clean.includes('MEAL') || clean.includes('COOKED')) {
    return NORMALIZED_FOOD_CATEGORIES.PREPARED_MEALS;
  }
  if (clean.includes('BAKERY') || clean.includes('BREAD') || clean.includes('PASTRY') || clean.includes('BAGEL')) {
    return NORMALIZED_FOOD_CATEGORIES.BAKERY;
  }
  if (clean.includes('FRUIT') || clean.includes('VEG') || clean.includes('PRODUCE')) {
    return NORMALIZED_FOOD_CATEGORIES.PRODUCE;
  }
  if (clean.includes('PACKAGE') || clean.includes('CANNED') || clean.includes('DRY') || clean.includes('GRAIN')) {
    return NORMALIZED_FOOD_CATEGORIES.PACKAGED_FOOD;
  }
  if (clean.includes('DAIRY') || clean.includes('MILK') || clean.includes('CHEESE') || clean.includes('YOGURT')) {
    return NORMALIZED_FOOD_CATEGORIES.DAIRY;
  }
  if (clean.includes('MEAT') || clean.includes('POULTRY') || clean.includes('CHICKEN') || clean.includes('BEEF')) {
    return NORMALIZED_FOOD_CATEGORIES.MEAT_POULTRY;
  }
  return NORMALIZED_FOOD_CATEGORIES.OTHER;
}

/**
 * Checks whether a shelter accepts the given food donation category.
 * If shelter has no preferences specified (or empty), treats it as open acceptance.
 */
export function checkFoodCompatibility(donationFoodType, shelterPreferences) {
  if (!shelterPreferences || !Array.isArray(shelterPreferences) || shelterPreferences.length === 0) {
    return {
      compatible: true,
      isDirectMatch: true,
      score: 100,
      label: 'Open Acceptance',
      reason: 'Shelter accepts all standard surplus food categories'
    };
  }

  const normDonation = normalizeFoodCategory(donationFoodType);
  const normShelter = shelterPreferences.map(p => normalizeFoodCategory(p));

  const isMatch = normShelter.includes(normDonation);
  return {
    compatible: isMatch,
    isDirectMatch: isMatch,
    score: isMatch ? 100 : 0,
    label: isMatch ? 'Direct Dietary Match' : 'Incompatible Food Type',
    reason: isMatch
      ? `Shelter actively accepts ${donationFoodType}`
      : `Shelter does not accept ${donationFoodType}`
  };
}

/**
 * Calculates deterministic capacity score (0-100) based on donation quantity vs shelter available capacity.
 */
export function calculateCapacityScore(donationQuantity, currentCapacity, maxCapacity) {
  const max = typeof maxCapacity === 'number' && maxCapacity > 0 ? maxCapacity : 100;
  const cur = typeof currentCapacity === 'number' && currentCapacity >= 0 ? currentCapacity : 0;
  const available = Math.max(0, max - cur);
  const qty = Number(donationQuantity) || 1;

  if (available <= 0) {
    return {
      score: 0,
      availableCapacity: 0,
      isEligible: false,
      label: 'No Capacity',
      reason: 'Shelter is currently at maximum storage capacity'
    };
  }

  if (available >= qty) {
    return {
      score: 100,
      availableCapacity: available,
      isEligible: true,
      label: 'Sufficient Capacity',
      reason: `Shelter has ${available} open meal slots, comfortably fitting this batch of ${qty}`
    };
  }

  // Partial capacity: scaled proportionally up to 60% of capacity weight
  const ratio = available / qty;
  const score = Math.max(10, Math.round(ratio * 60));
  return {
    score,
    availableCapacity: available,
    isEligible: true,
    label: 'Partial Capacity',
    reason: `Shelter has ${available} open slots (${Math.round(ratio * 100)}% fit for ${qty} items)`
  };
}

/**
 * Calculates deterministic urgency score (0-100) based on operational deadline.
 * Enforces food-safety rule: expired donations (deadline <= now) are flagged as expired.
 */
export function calculateUrgencyScore(availableUntilDate, referenceTime = new Date()) {
  const deadline = new Date(availableUntilDate);
  const now = new Date(referenceTime);

  if (isNaN(deadline.getTime())) {
    return {
      score: 40,
      isExpired: false,
      hoursRemaining: 24,
      label: 'Standard Urgency',
      reason: 'Operational pickup deadline is unspecified'
    };
  }

  const msRemaining = deadline.getTime() - now.getTime();
  if (msRemaining <= 0) {
    return {
      score: 0,
      isExpired: true,
      hoursRemaining: 0,
      label: 'Expired',
      reason: 'Operational deadline has passed; cannot match expired food'
    };
  }

  const hoursRemaining = msRemaining / (1000 * 60 * 60);

  if (hoursRemaining <= 2) {
    return {
      score: 100,
      isExpired: false,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      label: 'Critical Urgency (<2h remaining)',
      reason: `Critical urgency: operational deadline in ${Math.round(hoursRemaining * 10) / 10} hours`
    };
  }
  if (hoursRemaining <= 6) {
    return {
      score: 85,
      isExpired: false,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      label: 'High Urgency (<6h remaining)',
      reason: `High urgency: operational deadline in ${Math.round(hoursRemaining * 10) / 10} hours`
    };
  }
  if (hoursRemaining <= 12) {
    return {
      score: 65,
      isExpired: false,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      label: 'Moderate Urgency (<12h remaining)',
      reason: `Moderate urgency: ${Math.round(hoursRemaining * 10) / 10} hours remaining for meal distribution`
    };
  }
  if (hoursRemaining <= 24) {
    return {
      score: 45,
      isExpired: false,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      label: 'Standard Urgency (<24h remaining)',
      reason: `Standard urgency: ${Math.round(hoursRemaining * 10) / 10} hours remaining within current service window`
    };
  }

  return {
    score: 25,
    isExpired: false,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    label: 'Low Urgency (>24h remaining)',
    reason: `Extended window: ${Math.round((hoursRemaining / 24) * 10) / 10} days remaining until operational deadline`
  };
}

/**
 * Calculates deterministic straight-line distance score (0-100).
 */
export function calculateDistanceScore(distanceKm, maxRadiusKm = MATCHING_CONSTRAINTS.MAX_DISTANCE_KM) {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return {
      score: 0,
      inRange: false,
      reason: 'Invalid coordinates; unable to calculate straight-line distance'
    };
  }

  if (distanceKm > maxRadiusKm) {
    return {
      score: 0,
      inRange: false,
      reason: `Outside maximum service radius (${distanceKm} km straight-line > ${maxRadiusKm} km limit)`
    };
  }

  // Linear decay within configured radius with a 20-point baseline for in-radius candidates
  const ratio = Math.max(0, 1 - (distanceKm / maxRadiusKm));
  const score = Math.round(20 + (ratio * 80));

  return {
    score,
    inRange: true,
    reason: `Within ${distanceKm} km straight-line distance (${maxRadiusKm} km max radius)`
  };
}

/**
 * Calculates deterministic recipient need score (0-100) based on shelter occupancy rate.
 */
export function calculateRecipientNeedScore(currentCapacity, maxCapacity) {
  const max = typeof maxCapacity === 'number' && maxCapacity > 0 ? maxCapacity : 100;
  const cur = typeof currentCapacity === 'number' && currentCapacity >= 0 ? currentCapacity : 0;
  const occupancy = cur / max;

  if (occupancy >= 0.7) {
    return {
      score: 100,
      reason: `High recipient demand: shelter operating at ${Math.round(occupancy * 100)}% capacity`
    };
  }
  if (occupancy >= 0.4) {
    return {
      score: 75,
      reason: `Active recipient demand: shelter operating at ${Math.round(occupancy * 100)}% capacity`
    };
  }
  return {
    score: 50,
    reason: `Standard recipient demand: shelter operating at ${Math.round(occupancy * 100)}% capacity`
  };
}

/**
 * Deterministically computes the total weighted match score normalized to 0-100.
 */
export function computeTotalMatchScore({
  distanceScore,
  capacityScore,
  foodScore,
  urgencyScore,
  needScore
}) {
  const total = Math.round(
    (distanceScore * MATCHING_WEIGHTS.DISTANCE) +
    (capacityScore * MATCHING_WEIGHTS.CAPACITY) +
    (foodScore * MATCHING_WEIGHTS.FOOD_COMPATIBILITY) +
    (urgencyScore * MATCHING_WEIGHTS.URGENCY) +
    (needScore * MATCHING_WEIGHTS.RECIPIENT_PRIORITY)
  );

  return Math.min(100, Math.max(1, total));
}

/**
 * Core matching engine: finds, filters, scores, and ranks candidate shelters for a donation.
 * Throws ExpiredDonationError if donation is expired.
 */
export async function findCandidatesForDonation(donation, options = {}) {
  if (!donation) {
    throw new Error('Donation object is required for matching.');
  }

  // 1. Food safety check: Expired food cannot be matched
  const urgencyResult = calculateUrgencyScore(donation.availableUntil);
  if (urgencyResult.isExpired) {
    throw new ExpiredDonationError('Donation has expired and cannot be matched for food safety reasons.');
  }

  const maxRadiusKm = options.maxDistanceKm || MATCHING_CONSTRAINTS.MAX_DISTANCE_KM;
  const resultLimit = options.limit || MATCHING_CONSTRAINTS.RESULT_LIMIT;

  const donorCoords = donation.location?.coordinates;

  // 2. Fetch all registered and available shelters
  const shelters = await User.find({
    role: 'SHELTER',
    isAvailable: { $ne: false }
  }).lean();

  const candidates = [];

  for (const shelter of shelters) {
    const reasons = [];

    // Filter 1: Location & Distance calculation
    const shelterCoords = shelter.location?.coordinates;
    const distanceKm = calculateStraightLineDistanceKm(donorCoords, shelterCoords);

    if (distanceKm === null) {
      continue; // Exclude shelters with invalid coordinates
    }

    const distResult = calculateDistanceScore(distanceKm, maxRadiusKm);
    if (!distResult.inRange) {
      continue; // Exclude shelters outside the configured matching radius
    }
    reasons.push(distResult.reason);

    // Filter 2: Dietary / Food Category Compatibility
    const foodResult = checkFoodCompatibility(donation.foodType, shelter.foodPreferences);
    if (!foodResult.compatible) {
      continue; // Exclude incompatible shelters - do not silently match incompatible food
    }
    reasons.push(foodResult.reason);

    // Filter 3: Capacity Check
    const capResult = calculateCapacityScore(
      donation.quantity,
      shelter.capacity?.current,
      shelter.capacity?.max
    );
    if (!capResult.isEligible) {
      continue; // Exclude shelters with zero remaining capacity
    }
    reasons.push(capResult.reason);

    // Urgency reason
    reasons.push(urgencyResult.reason);

    // Need / Priority
    const needResult = calculateRecipientNeedScore(
      shelter.capacity?.current,
      shelter.capacity?.max
    );
    reasons.push(needResult.reason);

    // Composite Deterministic Score
    const totalScore = computeTotalMatchScore({
      distanceScore: distResult.score,
      capacityScore: capResult.score,
      foodScore: foodResult.score,
      urgencyScore: urgencyResult.score,
      needScore: needResult.score
    });

    candidates.push({
      shelter: {
        _id: shelter._id,
        name: shelter.name,
        organizationName: shelter.organizationName || shelter.name,
        address: shelter.address || '',
        phone: shelter.phone || '',
        capacity: shelter.capacity || { current: 0, max: 100 },
        foodPreferences: shelter.foodPreferences || []
      },
      score: totalScore,
      distanceKm,
      distanceMiles: kmToMiles(distanceKm),
      distance: `${distanceKm} km (straight-line)`,
      capacityCompatibility: capResult.label,
      foodCompatibility: foodResult.label,
      urgency: urgencyResult.label,
      scoreBreakdown: {
        distanceScore: distResult.score,
        capacityScore: capResult.score,
        foodScore: foodResult.score,
        urgencyScore: urgencyResult.score,
        needScore: needResult.score
      },
      reasons
    });
  }

  // 3. Deterministic Ranking: Score descending, tie-breaker distance ascending
  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.distanceKm - b.distanceKm;
  });

  return candidates.slice(0, resultLimit);
}

/**
 * Generates and persists candidate Match records in MongoDB for a donation.
 */
export async function generateMatchesForDonation(donation) {
  const rankedCandidates = await findCandidatesForDonation(donation);
  const matchDocs = [];

  const expiryDate = new Date(donation.availableUntil);
  const formattedExpiry = !isNaN(expiryDate.getTime())
    ? `Available until ${expiryDate.toLocaleDateString()} ${expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Standard pickup deadline';

  for (const candidate of rankedCandidates) {
    const matchDoc = await Match.findOneAndUpdate(
      { donationId: donation._id, shelterId: candidate.shelter._id },
      {
        donationId: donation._id,
        shelterId: candidate.shelter._id,
        donorName: donation.donorName || 'Food Donor',
        shelterName: candidate.shelter.name,
        foodType: donation.foodType,
        foodName: donation.foodName,
        quantity: `${donation.quantity} ${donation.unit}`,
        distance: candidate.distance,
        distanceMiles: candidate.distanceMiles,
        distanceKm: candidate.distanceKm,
        expiry: formattedExpiry,
        matchScore: candidate.score,
        scoreBreakdown: candidate.scoreBreakdown,
        capacityCompatibility: candidate.capacityCompatibility,
        foodCompatibility: candidate.foodCompatibility,
        urgency: candidate.urgency,
        reasons: candidate.reasons,
        status: 'PENDING'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    matchDocs.push(matchDoc);
  }

  return matchDocs;
}
