import { User } from '../models/User.js';
import { Delivery } from '../models/Delivery.js';
import { Donation } from '../models/Donation.js';
import { calculateStraightLineDistanceKm } from './matchingService.js';

/**
 * Deterministically finds the most suitable available volunteer driver for a pickup.
 * Evaluates driver availability, straight-line distance, and current pickup workload.
 */
export async function findBestAvailableDriver(pickupCoordinates) {
  const drivers = await User.find({
    role: 'DRIVER',
    isAvailable: { $ne: false }
  }).lean();

  if (!drivers || drivers.length === 0) {
    return null;
  }

  const scoredDrivers = [];

  for (const driver of drivers) {
    const driverCoords = driver.location?.coordinates;
    const distanceKm = calculateStraightLineDistanceKm(pickupCoordinates, driverCoords);
    if (distanceKm === null) continue;

    const activePickups = driver.driverDetails?.activePickups || 0;

    // Filter out drivers exceeding reasonable dispatch radius (50 km)
    if (pickupCoordinates && distanceKm > 50.0) {
      continue;
    }

    scoredDrivers.push({
      driver,
      distanceKm,
      activePickups
    });
  }

  // Deterministic sorting:
  // 1. Distance ascending
  // 2. Active pickups workload ascending (least loaded)
  // 3. Driver ID string ascending as tie-breaker
  scoredDrivers.sort((a, b) => {
    if (a.distanceKm !== b.distanceKm) {
      return a.distanceKm - b.distanceKm;
    }
    if (a.activePickups !== b.activePickups) {
      return a.activePickups - b.activePickups;
    }
    return String(a.driver._id).localeCompare(String(b.driver._id));
  });

  return scoredDrivers[0]?.driver || null;
}

/**
 * Atomically assigns a driver to an unassigned delivery route.
 */
export async function assignDriverToDelivery(deliveryId, driverUser) {
  const delivery = await Delivery.findOneAndUpdate(
    {
      _id: deliveryId,
      $or: [{ driverId: null }, { status: 'MATCHED' }]
    },
    {
      $set: {
        driverId: driverUser._id,
        driverName: driverUser.name,
        status: 'DRIVER_ASSIGNED',
        assignedAt: new Date()
      }
    },
    { new: true }
  );

  if (!delivery) {
    return null;
  }

  // Synchronize linked Donation status
  if (delivery.donationId) {
    await Donation.findByIdAndUpdate(delivery.donationId, {
      status: 'DRIVER_ASSIGNED',
      driverId: driverUser._id,
      driverAssigned: driverUser.name
    });
  }

  // Update driver active pickup count
  await User.findByIdAndUpdate(driverUser._id, {
    $inc: { 'driverDetails.activePickups': 1 }
  });

  return delivery;
}
