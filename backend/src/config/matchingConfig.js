import { ENV } from './env.js';

/**
 * Transparent, deterministic matching configuration.
 * All weights sum to 1.0 (100%).
 */
export const MATCHING_WEIGHTS = Object.freeze({
  DISTANCE: 0.30,           // 30% - Geographic straight-line proximity
  CAPACITY: 0.25,           // 25% - Shelter capacity compatibility
  FOOD_COMPATIBILITY: 0.20, // 20% - Dietary intake compatibility
  URGENCY: 0.15,            // 15% - Operational deadline / remaining shelf life
  RECIPIENT_PRIORITY: 0.10  // 10% - Recipient need and operational throughput
});

/**
 * Matching engine constraints and limits.
 */
export const MATCHING_CONSTRAINTS = Object.freeze({
  MAX_DISTANCE_KM: ENV.MATCH_MAX_DISTANCE_KM || 50,
  RESULT_LIMIT: ENV.MATCH_RESULT_LIMIT || 10,
  EARTH_RADIUS_KM: 6371.0,
  KM_TO_MILES_FACTOR: 0.621371
});

/**
 * Standardized food categories for deterministic matching.
 */
export const NORMALIZED_FOOD_CATEGORIES = Object.freeze({
  PREPARED_MEALS: 'PREPARED_MEALS',
  BAKERY: 'BAKERY',
  PRODUCE: 'PRODUCE',
  PACKAGED_FOOD: 'PACKAGED_FOOD',
  DAIRY: 'DAIRY',
  MEAT_POULTRY: 'MEAT_POULTRY',
  OTHER: 'OTHER'
});
