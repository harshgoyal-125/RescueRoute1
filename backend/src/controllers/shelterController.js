import { User } from '../models/User.js';

export async function getShelters(_req, res, next) {
  try {
    const shelters = await User.find({ role: 'SHELTER' })
      .select('name organizationName email phone address capacity foodPreferences preferredRadiusMiles avatar')
      .lean();

    res.status(200).json({
      success: true,
      data: { shelters }
    });
  } catch (error) {
    next(error);
  }
}

export async function getShelterById(req, res, next) {
  try {
    const shelter = await User.findOne({ _id: req.params.id, role: 'SHELTER' })
      .select('name organizationName email phone address capacity foodPreferences preferredRadiusMiles avatar')
      .lean();

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter organization not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: { shelter }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCapacity(req, res, next) {
  try {
    const shelter = await User.findOne({ _id: req.params.id, role: 'SHELTER' });

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter organization not found.'
      });
    }

    // Ownership check: Shelter can only update its own capacity
    if (req.user.role !== 'ADMIN' && !shelter._id.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify capacity settings for another organization.'
      });
    }

    const {
      currentCapacity,
      maxCapacity,
      foodPreferences,
      preferredRadiusMiles
    } = req.body;

    const cur = currentCapacity !== undefined ? Number(currentCapacity) : shelter.capacity?.current;
    const max = maxCapacity !== undefined ? Number(maxCapacity) : shelter.capacity?.max;

    if (cur !== undefined && (isNaN(cur) || cur < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Current capacity cannot be negative.'
      });
    }

    if (max !== undefined && (isNaN(max) || max <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Max capacity must be greater than zero.'
      });
    }

    if (cur !== undefined && max !== undefined && cur > max) {
      return res.status(400).json({
        success: false,
        message: 'Current capacity cannot exceed maximum capacity.'
      });
    }

    if (preferredRadiusMiles !== undefined) {
      const radius = Number(preferredRadiusMiles);
      if (isNaN(radius) || radius <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Preferred radius must be at least 1 mile.'
        });
      }
      shelter.preferredRadiusMiles = radius;
    }

    if (Array.isArray(foodPreferences) && foodPreferences.length > 0) {
      shelter.foodPreferences = foodPreferences;
    }

    shelter.capacity = {
      current: cur,
      max
    };

    await shelter.save();

    res.status(200).json({
      success: true,
      message: 'Shelter capacity settings updated successfully.',
      data: {
        shelter: {
          id: shelter._id,
          name: shelter.name,
          capacity: shelter.capacity,
          foodPreferences: shelter.foodPreferences,
          preferredRadiusMiles: shelter.preferredRadiusMiles
        }
      }
    });
  } catch (error) {
    next(error);
  }
}
