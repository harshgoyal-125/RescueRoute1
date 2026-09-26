import { Donation } from '../models/Donation.js';
import { calculateStraightLineDistanceKm } from './matchingService.js';

const MAX_KM = 50;
const compatibleDiets = {
  Vegetarian: ['Vegetarian', 'Vegan'],
  Vegan: ['Vegan'],
  Eggetarian: ['Eggetarian', 'Vegetarian', 'Vegan'],
  'Non-Vegetarian': ['Vegetarian', 'Vegan', 'Eggetarian', 'Non-Vegetarian']
};

/** Read-only candidates. No donation is reserved or promised to a requester. */
export async function suggestionsForRequest(foodRequest) {
  const query = {
    status: 'POSTED',
    availableUntil: { $gt: new Date() },
    unit: foodRequest.unit,
    quantity: { $gte: foodRequest.quantityNeeded }
  };
  if (foodRequest.foodCategory !== 'Any / All') query.foodType = foodRequest.foodCategory;
  const diet = String(foodRequest.dietaryRestrictions || 'None');
  if (compatibleDiets[diet]) query.dietaryType = { $in: compatibleDiets[diet] };
  else if (diet !== 'None' && diet !== 'Any Diet') return []; // Unknown restriction: do not guess safety.

  const donations = await Donation.find(query)
    .select('_id foodName foodType dietaryType quantity unit availableUntil location')
    .sort({ availableUntil: 1 }).limit(100).lean();
  const requestCoords = foodRequest.location?.coordinates;
  return donations.map(donation => {
    const distanceKm = calculateStraightLineDistanceKm(requestCoords, donation.location?.coordinates);
    if (distanceKm === null || distanceKm > MAX_KM) return null;
    return {
      donationId: donation._id,
      foodName: donation.foodName,
      foodType: donation.foodType,
      dietaryType: donation.dietaryType,
      quantity: donation.quantity,
      unit: donation.unit,
      availableUntil: donation.availableUntil,
      distanceKm
    };
  }).filter(Boolean).sort((a, b) => a.distanceKm - b.distanceKm || new Date(a.availableUntil) - new Date(b.availableUntil)).slice(0, 10);
}
