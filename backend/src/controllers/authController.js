import { User } from '../models/User.js';
import { generateToken, sanitizeUser } from '../services/authService.js';

export async function register(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      role = 'DONOR',
      organizationName,
      phone,
      address,
      capacity,
      foodPreferences,
      preferredRadiusMiles,
      location
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    if (password.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 10 characters long.'
      });
    }

    const normalizedRole = role.toUpperCase();
    if (!['DONOR', 'SHELTER', 'DRIVER'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: DONOR, SHELTER, DRIVER.'
      });
    }

    if (location?.coordinates && (!Array.isArray(location.coordinates) || location.coordinates.length !== 2 || !location.coordinates.every(Number.isFinite) || Math.abs(location.coordinates[0]) > 180 || Math.abs(location.coordinates[1]) > 90)) {
      return res.status(400).json({ success: false, message: 'Coordinates must be [longitude, latitude].' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const passwordHash = await User.hashPassword(password);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: normalizedRole,
      organizationName: organizationName ? organizationName.trim() : name.trim(),
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      avatar: normalizedRole === 'DONOR' ? '🥗' : normalizedRole === 'SHELTER' ? '🏠' : normalizedRole === 'DRIVER' ? '🚐' : '📊',
      capacity: capacity || { current: 0, max: 100 },
      foodPreferences: foodPreferences || ['Prepared Meals', 'Bakery', 'Fruits & Vegetables', 'Dairy'],
      preferredRadiusMiles: preferredRadiusMiles || 8,
      ...(location?.coordinates ? { location } : {})
    });

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        token,
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Both email and password are required.'
      });
    }

    // Include passwordHash explicitly
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(req.user)
      }
    });
  } catch (error) {
    next(error);
  }
}
