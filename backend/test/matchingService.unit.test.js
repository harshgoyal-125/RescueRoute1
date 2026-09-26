import { describe, it, expect } from 'vitest';
import {
  calculateStraightLineDistanceKm,
  kmToMiles,
  normalizeFoodCategory,
  checkFoodCompatibility,
  calculateCapacityScore,
  calculateUrgencyScore,
  calculateDistanceScore,
  calculateRecipientNeedScore,
  computeTotalMatchScore,
  ExpiredDonationError
} from '../src/services/matchingService.js';
import {
  MATCHING_WEIGHTS,
  MATCHING_CONSTRAINTS,
  NORMALIZED_FOOD_CATEGORIES
} from '../src/config/matchingConfig.js';

describe('TASK 03 - Matching Engine Unit Tests', () => {
  describe('1. Straight-Line Distance Calculation (Haversine)', () => {
    it('calculates accurate straight-line distance between SF coordinates', () => {
      // SF City Hall [-122.4194, 37.7749] to Ferry Building [-122.3937, 37.7955] (~3.2 km)
      const coordA = [-122.4194, 37.7749];
      const coordB = [-122.3937, 37.7955];
      const dist = calculateStraightLineDistanceKm(coordA, coordB);

      expect(dist).toBeGreaterThan(2.8);
      expect(dist).toBeLessThan(3.6);
      expect(typeof dist).toBe('number');
    });

    it('returns 0 for identical coordinates', () => {
      const coord = [-122.4194, 37.7749];
      expect(calculateStraightLineDistanceKm(coord, coord)).toBe(0);
    });

    it('rejects invalid or missing coordinate pairs gracefully', () => {
      expect(calculateStraightLineDistanceKm(null, [-122.4, 37.7])).toBeNull();
      expect(calculateStraightLineDistanceKm([-122.4, 37.7], undefined)).toBeNull();
      expect(calculateStraightLineDistanceKm([], [1, 2])).toBeNull();
      expect(calculateStraightLineDistanceKm(['invalid', 37.7], [-122.4, 37.7])).toBeNull();
      expect(calculateStraightLineDistanceKm([-122.4, 150], [-122.4, 37.7])).toBeNull(); // lat > 90
    });

    it('converts km to miles accurately', () => {
      expect(kmToMiles(10)).toBe(6.2);
      expect(kmToMiles(0)).toBe(0);
      expect(kmToMiles(null)).toBe(0);
    });
  });

  describe('2. Food Category Normalization', () => {
    it('normalizes arbitrary casings, spaces, and punctuation to standard categories', () => {
      expect(normalizeFoodCategory('Prepared Meals')).toBe(NORMALIZED_FOOD_CATEGORIES.PREPARED_MEALS);
      expect(normalizeFoodCategory('prepared_meals')).toBe(NORMALIZED_FOOD_CATEGORIES.PREPARED_MEALS);
      expect(normalizeFoodCategory('PREPARED MEALS')).toBe(NORMALIZED_FOOD_CATEGORIES.PREPARED_MEALS);
      expect(normalizeFoodCategory('Hot Cooked Food')).toBe(NORMALIZED_FOOD_CATEGORIES.PREPARED_MEALS);

      expect(normalizeFoodCategory('Bakery')).toBe(NORMALIZED_FOOD_CATEGORIES.BAKERY);
      expect(normalizeFoodCategory('Fresh Bread & Bagels')).toBe(NORMALIZED_FOOD_CATEGORIES.BAKERY);

      expect(normalizeFoodCategory('Fruits & Vegetables')).toBe(NORMALIZED_FOOD_CATEGORIES.PRODUCE);
      expect(normalizeFoodCategory('Fresh Produce')).toBe(NORMALIZED_FOOD_CATEGORIES.PRODUCE);

      expect(normalizeFoodCategory('Packaged Food')).toBe(NORMALIZED_FOOD_CATEGORIES.PACKAGED_FOOD);
      expect(normalizeFoodCategory('Canned & Dry Goods')).toBe(NORMALIZED_FOOD_CATEGORIES.PACKAGED_FOOD);

      expect(normalizeFoodCategory('Dairy')).toBe(NORMALIZED_FOOD_CATEGORIES.DAIRY);
      expect(normalizeFoodCategory('Milk & Yogurt')).toBe(NORMALIZED_FOOD_CATEGORIES.DAIRY);

      expect(normalizeFoodCategory('Chicken & Poultry')).toBe(NORMALIZED_FOOD_CATEGORIES.MEAT_POULTRY);
      expect(normalizeFoodCategory('unknown item')).toBe(NORMALIZED_FOOD_CATEGORIES.OTHER);
      expect(normalizeFoodCategory(null)).toBe(NORMALIZED_FOOD_CATEGORIES.OTHER);
    });
  });

  describe('3. Food Compatibility Matching', () => {
    it('matches when donation category is in shelter preferred intake list', () => {
      const prefs = ['Prepared Meals', 'Bakery'];
      const res = checkFoodCompatibility('Prepared Meals', prefs);
      expect(res.compatible).toBe(true);
      expect(res.score).toBe(100);
      expect(res.isDirectMatch).toBe(true);
    });

    it('rejects when donation category is not accepted by shelter', () => {
      const prefs = ['Bakery', 'Dairy'];
      const res = checkFoodCompatibility('Prepared Meals', prefs);
      expect(res.compatible).toBe(false);
      expect(res.score).toBe(0);
      expect(res.isDirectMatch).toBe(false);
      expect(res.reason).toContain('does not accept');
    });

    it('treats empty or unspecified preferences as open intake compatibility', () => {
      const resEmpty = checkFoodCompatibility('Dairy', []);
      expect(resEmpty.compatible).toBe(true);
      expect(resEmpty.score).toBe(100);

      const resNull = checkFoodCompatibility('Produce', null);
      expect(resNull.compatible).toBe(true);
    });
  });

  describe('4. Capacity Scoring', () => {
    it('awards 100% capacity score when shelter has sufficient open slots', () => {
      // 30 meals for shelter with 40 available slots (current: 60, max: 100)
      const res = calculateCapacityScore(30, 60, 100);
      expect(res.score).toBe(100);
      expect(res.isEligible).toBe(true);
      expect(res.availableCapacity).toBe(40);
      expect(res.label).toBe('Sufficient Capacity');
    });

    it('awards partial capacity score when shelter available slots are less than donation', () => {
      // 50 meals for shelter with 20 available slots (current: 80, max: 100)
      const res = calculateCapacityScore(50, 80, 100);
      expect(res.score).toBeLessThan(100);
      expect(res.score).toBeGreaterThan(10);
      expect(res.isEligible).toBe(true);
      expect(res.label).toBe('Partial Capacity');
    });

    it('rejects shelters with zero or negative remaining capacity', () => {
      // Current 100, max 100 -> available 0
      const res = calculateCapacityScore(10, 100, 100);
      expect(res.score).toBe(0);
      expect(res.isEligible).toBe(false);
      expect(res.label).toBe('No Capacity');
    });
  });

  describe('5. Urgency Scoring & Food-Safety Expiration Enforcement', () => {
    it('strictly identifies expired donations (deadline <= referenceTime)', () => {
      const now = new Date('2026-09-24T12:00:00Z');
      const pastDeadline = new Date('2026-09-24T11:59:00Z');

      const res = calculateUrgencyScore(pastDeadline, now);
      expect(res.isExpired).toBe(true);
      expect(res.score).toBe(0);
      expect(res.label).toBe('Expired');
    });

    it('assigns high urgency score for donations expiring soon (< 2h)', () => {
      const now = new Date('2026-09-24T12:00:00Z');
      const soonDeadline = new Date('2026-09-24T13:30:00Z'); // 1.5h

      const res = calculateUrgencyScore(soonDeadline, now);
      expect(res.isExpired).toBe(false);
      expect(res.score).toBe(100);
      expect(res.label).toContain('Critical Urgency');
    });

    it('assigns tiered scores based on remaining hours', () => {
      const now = new Date('2026-09-24T12:00:00Z');

      // 4 hours remaining
      const res4h = calculateUrgencyScore(new Date('2026-09-24T16:00:00Z'), now);
      expect(res4h.score).toBe(85);

      // 10 hours remaining
      const res10h = calculateUrgencyScore(new Date('2026-09-24T22:00:00Z'), now);
      expect(res10h.score).toBe(65);

      // 20 hours remaining
      const res20h = calculateUrgencyScore(new Date('2026-09-25T08:00:00Z'), now);
      expect(res20h.score).toBe(45);

      // 48 hours remaining
      const res48h = calculateUrgencyScore(new Date('2026-09-26T12:00:00Z'), now);
      expect(res48h.score).toBe(25);
    });
  });

  describe('6. Distance Scoring & Service Radius Filter', () => {
    it('scores higher for closer shelters within maximum radius', () => {
      const close = calculateDistanceScore(2.0, 50);
      const far = calculateDistanceScore(40.0, 50);

      expect(close.inRange).toBe(true);
      expect(far.inRange).toBe(true);
      expect(close.score).toBeGreaterThan(far.score);
    });

    it('flags shelters outside configured max matching radius as out of range', () => {
      const outOfRange = calculateDistanceScore(55.0, 50);
      expect(outOfRange.inRange).toBe(false);
      expect(outOfRange.score).toBe(0);
      expect(outOfRange.reason).toContain('Outside maximum service radius');
    });
  });

  describe('7. Deterministic Total Score Computation', () => {
    it('accurately applies centralized weights to compute final score (0-100)', () => {
      // Distance: 30%, Capacity: 25%, Food: 20%, Urgency: 15%, Need: 10%
      const score = computeTotalMatchScore({
        distanceScore: 100, // 30
        capacityScore: 100, // 25
        foodScore: 100,     // 20
        urgencyScore: 100,  // 15
        needScore: 100      // 10
      });

      expect(score).toBe(100);
    });

    it('is completely deterministic for identical inputs', () => {
      const input = {
        distanceScore: 78,
        capacityScore: 60,
        foodScore: 100,
        urgencyScore: 85,
        needScore: 75
      };

      const score1 = computeTotalMatchScore(input);
      const score2 = computeTotalMatchScore(input);
      expect(score1).toBe(score2);
    });

    it('clamps boundary scores to 1-100 range', () => {
      const minScore = computeTotalMatchScore({
        distanceScore: 0,
        capacityScore: 0,
        foodScore: 0,
        urgencyScore: 0,
        needScore: 0
      });
      expect(minScore).toBe(1);
    });
  });
});
